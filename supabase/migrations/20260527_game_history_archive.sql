-- Game history (copy-on-insert, fully trigger-driven)
--
-- Written against the LIVE schema as of 2026-05-27 (not the older context dump).
-- Notable: there is no score_submission table; outcomes are per-player win/loss
-- in game_player.result (+ a captain report in report_outcome). So history
-- tracks win/loss, not numeric scores.
--
-- Model (Warren's "copy on insert"): the durable history row is created the
-- moment a game is inserted and stays after the live game is deleted. History is
-- maintained entirely by triggers, so the frontend just manages the live tables
-- (game, game_player) as normal and never touches the history tables:
--   - game INSERT          -> create game_history shell
--   - game UPDATE          -> sync status / completed_at into game_history
--   - game_player INSERT    -> mirror the row into game_history_player
--   - game_player UPDATE    -> sync result / team_side into game_history_player
--   - game DELETE          -> cascades clear live-only tables; history persists
--
-- Why triggers, not an Edge Function: this is database-to-database work that must
-- stay consistent inside the same transaction. An edge function fires after
-- commit, async, over the network, and can fail independently.

begin;

-- =====================================================================
-- 1. History tables
-- =====================================================================

create table if not exists public.game_history (
  game_id        integer primary key,          -- same id as the live game; copied, not generated
  is_casual      boolean not null,
  status         varchar not null,
  scheduled_time timestamptz,
  created_at     timestamptz not null,
  completed_at   timestamptz,
  park_id        bigint not null references public.parks(park_id),
  archived_at    timestamptz not null default now()  -- when history row was created (= game insert time)
);

create table if not exists public.game_history_player (
  game_id   integer not null references public.game_history(game_id) on delete cascade,
  user_id   integer not null references public.app_user(user_id),
  team_side integer not null,
  result    varchar,                            -- 'win' | 'loss' | 'draw' | null
  primary key (game_id, user_id)
);

create index if not exists idx_game_history_player_user on public.game_history_player(user_id);

-- =====================================================================
-- 2. Triggers (all SECURITY DEFINER so they bypass RLS on history)
-- =====================================================================

-- 2a. game INSERT -> create the history shell
create or replace function public.create_game_history_on_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.game_history (
    game_id, is_casual, status, scheduled_time, created_at, completed_at, park_id
  )
  values (
    new.game_id, new."isCasual", new.status, new.scheduled_time,
    new.created_at, new.completed_at, new.park_id
  )
  on conflict (game_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_create_game_history on public.game;
create trigger trg_create_game_history
after insert on public.game
for each row execute function public.create_game_history_on_insert();

-- 2b. game UPDATE -> sync status / completed_at / scheduled_time
create or replace function public.sync_game_history_on_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.game_history
  set status = new.status,
      completed_at = new.completed_at,
      scheduled_time = new.scheduled_time
  where game_id = new.game_id;
  return new;
end;
$$;

drop trigger if exists trg_sync_game_history on public.game;
create trigger trg_sync_game_history
after update on public.game
for each row execute function public.sync_game_history_on_update();

-- 2c. game_player INSERT -> mirror into history (game_history already exists,
-- since game_player FKs to game and the game row was inserted first)
create or replace function public.mirror_game_player_to_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.game_history_player (game_id, user_id, team_side, result)
  values (new.game_id, new.user_id, new.team_side, new.result)
  on conflict (game_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_mirror_game_player_to_history on public.game_player;
create trigger trg_mirror_game_player_to_history
after insert on public.game_player
for each row execute function public.mirror_game_player_to_history();

-- 2d. game_player UPDATE -> sync result / team_side (this is how the win/loss
-- lands in history: the frontend sets game_player.result when the game ends)
create or replace function public.sync_game_player_to_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.game_history_player
  set result = new.result,
      team_side = new.team_side
  where game_id = new.game_id and user_id = new.user_id;
  return new;
end;
$$;

drop trigger if exists trg_sync_game_player_to_history on public.game_player;
create trigger trg_sync_game_player_to_history
after update on public.game_player
for each row execute function public.sync_game_player_to_history();

-- =====================================================================
-- 3. Live-only child tables: cascade away when a game is deleted
-- =====================================================================

-- game_chat: deleted with the game (your requirement).
alter table public.game_chat
  drop constraint if exists game_chat_game_id_fkey;
alter table public.game_chat
  add constraint game_chat_game_id_fkey
  foreign key (game_id) references public.game(game_id) on delete cascade;

-- game_player: live roster; durable copy is game_history_player.
alter table public.game_player
  drop constraint if exists game_player_game_id_fkey;
alter table public.game_player
  add constraint game_player_game_id_fkey
  foreign key (game_id) references public.game(game_id) on delete cascade;

-- report_outcome: the captain's win report is transient; the per-player result
-- is already synced into history. Cascade it away with the game.
alter table public.report_outcome
  drop constraint if exists report_outcome_game_id_fkey;
alter table public.report_outcome
  add constraint report_outcome_game_id_fkey
  foreign key (game_id) references public.game(game_id) on delete cascade;

-- =====================================================================
-- 4. sportsmanship_rating: point at history so reputation survives deletion
-- =====================================================================
-- game_history exists from game creation, so this FK is valid whenever a rating
-- could be written.
alter table public.sportsmanship_rating
  drop constraint if exists sportsmanship_rating_game_id_fkey;
alter table public.sportsmanship_rating
  add constraint sportsmanship_rating_game_id_fkey
  foreign key (game_id) references public.game_history(game_id) on delete cascade;

-- Prevent rating the same person twice for the same game.
alter table public.sportsmanship_rating
  drop constraint if exists sportsmanship_rating_unique_per_game;
alter table public.sportsmanship_rating
  add constraint sportsmanship_rating_unique_per_game
  unique (game_id, rater_id, rated_id);

-- =====================================================================
-- 5. RLS: read-only for clients; all writes happen via SECURITY DEFINER triggers
-- =====================================================================

alter table public.game_history enable row level security;
alter table public.game_history_player enable row level security;

drop policy if exists allow_select_game_history on public.game_history;
create policy allow_select_game_history
  on public.game_history for select to authenticated using (true);

drop policy if exists allow_select_game_history_player on public.game_history_player;
create policy allow_select_game_history_player
  on public.game_history_player for select to authenticated using (true);

-- No INSERT/UPDATE/DELETE policies: history is written only by the triggers.

commit;

-- =====================================================================
-- NOTES / PRE-CHECK BEFORE RUNNING
-- =====================================================================
--
-- 1. sportsmanship_rating FK repoint (section 4) will FAIL if that table already
--    has rows (their game_ids won't exist in the empty game_history yet). Check:
--      select count(*) from sportsmanship_rating;
--    If > 0 on a demo DB, just: delete from sportsmanship_rating;  then run this.
--
-- 2. How win/loss reaches history: the frontend updates game_player.result when a
--    game ends; trigger 2d syncs it into game_history_player automatically. The
--    frontend does NOT need to write to the history tables directly.
--
-- 3. Verified live on 2026-05-27: game."isCasual" is a quoted boolean column and
--    game is writable (the broken CHECK was dropped). The triggers rely on both.
--
-- 4. Unrelated bugs still live in this schema (NOT fixed here, flag for the team):
--    - queue_entry.num_vs has the SAME broken pattern isCasual had: it's an
--      integer (default -1) but its CHECK compares to the strings
--      'casual'/'competitive', so inserts into queue_entry will fail. This blocks
--      matchmaking. Needs its own fix.
--    - queue_entry.player_id is GENERATED ALWAYS AS IDENTITY *and* a FK to
--      app_user(user_id) — contradictory, same issue as before.
--    - `messages` (plural) still duplicates `message`.
