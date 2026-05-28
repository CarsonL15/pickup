-- Fix: game is unwritable due to a broken CHECK constraint.
--
-- `game."isCasual"` is a boolean, but the constraint `game_game_mode_check`
-- compares its text form ('t'/'f') against the strings 'casual'/'competitive',
-- which can never match. Result: every INSERT into game fails with a check
-- violation (confirmed 2026-05-27), so no game can be created at all.
--
-- A boolean is already constrained to true/false/null, so it needs no string
-- check. Drop the bad constraint. (true = casual, false = competitive.)
--
-- Run this BEFORE the game_history migration — that feature can't do anything
-- until games are insertable.

begin;

alter table public.game
  drop constraint if exists game_game_mode_check;

commit;

-- Verify after running:
--   begin;
--   insert into game ("isCasual", status, park_id)
--   values (true, 'waiting', (select park_id from parks limit 1));
--   rollback;
-- Should now succeed (INSERT 0 1) instead of a check-constraint error.
--
-- Follow-up worth considering (not done here): the column name "isCasual" is
-- mixed-case, so it must be double-quoted in EVERY query or Postgres folds it to
-- lowercase `iscasual` and errors. Renaming it to lowercase `iscasual` or a
-- `mode varchar` (matching queue_entry.game_mode) would remove that recurring
-- footgun, but requires updating the frontend/matchmaker code that references it.
