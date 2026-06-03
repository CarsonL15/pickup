import copy
import os
from dotenv import load_dotenv
from supabase import Client, create_client

from Python.Algorithm.Game import Game
from Python.Algorithm.GamesList import GamesList
from Python.Algorithm.Parks import Park
from Python.Algorithm.Player import Player
from Python.Algorithm.Team import Team

load_dotenv()

supabase: Client = create_client(
        os.environ.get("SUPABASE_URL"),
        os.environ.get("SUPABASE_KEY")
)


class JoinQueue:
    joinCasualParkQueue : list[Player] = []
    joinCompetitiveParkQueue : list[Player] = []
    joinCompetitiveTeamsParkQueue : list[Team] = []
    joinCasualTeamsParkQueue : list[Team] = []

    gamesCreated : list[Game]= []
    gamesStarted: list[Game] = []
    gamesInExistence : list[Game] = []

    playersJoined : list[Player] = []
    teamsJoined : list[Team] = []



    playersJoiningList = []

    @staticmethod
    def addPlayer():
        print()
        #JoinQueue.playersJoiningList.append(Player(len(JoinQueue.playersJoiningList),random.random() + 47,random.random() - 118,random.randint(2,5),0,50))
        # JoinQueue.playersJoiningList.append(Player(0, 47.4, -117.2, 2,0,50))
        # JoinQueue.playersJoiningList.append(Player(1, 47.4, -117.2, 2, 0, 50))
        # JoinQueue.playersJoiningList.append(Player(2, 47.4, -117.2, 2, 0, 50))
        # JoinQueue.playersJoiningList.append(Player(3, 47.4, -117.2, 2, 0, 50))
        # JoinQueue.playersJoiningList.append(Player(3, 47.4, -117.2, 2, 0, 50))
        # JoinQueue.playersJoiningList.append(Team(0,[0,1,2,3],47,-117.225,4,1300,50))
        # JoinQueue.playersJoiningList.append(Team(1, [4,5,6,7,8], 47, -117, 5, 1600, 50))
        # JoinQueue.playersJoiningList.append(Team(2, [9,10], 47.9, -117.1, 2, 0, 50))
        # JoinQueue.playersJoiningList.append(Team(3, [11, 12, 13, 14], 47.1, -117.3, 4, 1150, 50))


    @staticmethod
    def refreshQueues():


        casualTeams = {}
        competitiveTeams = {}

        JoinQueue.joinCompetitiveTeamsParkQueue = []
        JoinQueue.joinCasualTeamsParkQueue = []
        JoinQueue.joinCasualParkQueue = []
        JoinQueue.joinCompetitiveParkQueue = []

        JoinQueue.gamesCreated = []
        JoinQueue.gamesStarted = []
        JoinQueue.gamesInExistence = []

        JoinQueue.playersJoined = []
        JoinQueue.teamsJoined = []

        JoinQueue.gamesFinished = []

        gamesExistingResponse = (
            supabase.table("game")
            .select("game_id")
            .execute()
            .data
        )

        for game in gamesExistingResponse:
            JoinQueue.gamesInExistence.append(game["game_id"])

        temp1 = []
        for game in GamesList.activeCasualGames:
            if game.gameID not in JoinQueue.gamesInExistence:
                temp1.append(game)

        for game in temp1:
            GamesList.activeCasualGames.remove(game)

        temp2 = []
        for game in GamesList.activeCompGames:
            if game.gameID not in JoinQueue.gamesInExistence:
                temp2.append(game)

        for game in temp2:
            GamesList.activeCompGames.remove(game)

        joinGamesQueueResponse = (
            supabase.table("queue_entry")
            .select("*")
            .execute()
            .data
        )

        #1. player is single and casual , 2. player is single and comp, 3. player is team not yet created and casual,
        #4. player is team not yet created and comp, 5. player is in created team and casual 6. player is in created team and comp 7. somethings messed up
        for player in joinGamesQueueResponse:
            if(player['is_casual'] == True and player['party_id'] == None):
                JoinQueue.joinCasualParkQueue.append(Player(player['player_id'],player['latitude'],player['longitude'],player['num_vs'],player['skill_rating'],player['distance_preference']))
            elif (player['is_casual'] == False and player['party_id'] == None):
                JoinQueue.joinCompetitiveParkQueue.append(Player(player['player_id'], player['latitude'], player['longitude'], player['num_vs'],player['skill_rating'], player['distance_preference']))
            elif(player['is_casual'] == True and player['party_id'] not in casualTeams):
                casualTeams[player['party_id']] = Team(player['party_id'],[player['player_id']],player['latitude'],player['longitude'],player['num_vs'],player['skill_rating'],player['distance_preference'])
            elif(player['is_casual'] == False and player['party_id'] not in competitiveTeams):
                competitiveTeams[player['party_id']] = Team(player['party_id'], [player['player_id']], player['latitude'],player['longitude'], player['num_vs'], player['skill_rating'],player['distance_preference'])
            elif(player['is_casual'] == True and player['party_id'] in casualTeams):
                casualTeams[player['party_id']].addPlayer(player['player_id'],player['latitude'],player['longitude'],player['skill_rating'])
            elif(player['is_casual'] == False and player['party_id'] in competitiveTeams):
                competitiveTeams[player['party_id']].addPlayer(player['player_id'], player['latitude'], player['longitude'],player['skill_rating'])

        for team in casualTeams.values():
            JoinQueue.joinCasualTeamsParkQueue.append(team)

        for team in competitiveTeams.values():
            JoinQueue.joinCompetitiveTeamsParkQueue.append(team)

        for team in JoinQueue.playersJoiningList:
            JoinQueue.joinCompetitiveTeamsParkQueue.append(team)
        JoinQueue.playersJoiningList = []

    @staticmethod
    def updateDatabase():

        #INSERT games made
        gamesMade = []
        for game in JoinQueue.gamesCreated:
            newGame = {"game_id": game.gameID, "is_casual":game.isCasual,"park_id":game.parkID,"is_active":game.isActive,"team1_skill":game.team1Skill,"team2_skill":game.team2Skill}
            gamesMade.append(newGame)

        if gamesMade: # if gamesMade is not empty
            try:
                response = (
                    supabase.table("game")
                    .insert(gamesMade)
                    .execute()
                )
            except Exception as exception:
                print("could not insert into game table")

        #INSERT single players joined
        playersJoin = []
        for player in JoinQueue.playersJoined:
            newPlayer = {"game_id": player.foundParkID, "user_id":player.id,"team_side":player.teamSide}
            playersJoin.append(newPlayer)

        if playersJoin: # if playerJoin is not empty
            try:
                response = (
                    supabase.table("game_player")
                    .insert(playersJoin)
                    .execute()
                )
            except Exception as e:
                print(f"could not insert individual players into game_player table {e}")



        #INSERT teams joined
        playerOnTeamJoin = []
        for team in JoinQueue.teamsJoined:
            for x in range(len(team.playersID)):
                newPlayerOnTeam = {"game_id":team.foundParkID, "user_id" : team.playersID[x],"team_side":team.teamSide,"party_id":team.id}
                playerOnTeamJoin.append(newPlayerOnTeam)

        if playerOnTeamJoin: # playerOnTeamJoin is not empty
            try:
                response = (
                    supabase.table("game_player")
                    .insert(playerOnTeamJoin)
                    .execute()
                )
            except Exception as e:
                print("could not insert players on team in game_player table")


        gamesBegun = f""
        for game in JoinQueue.gamesStarted:
            gamesBegun += f"game_id.eq.{game.gameID},"
        gamesBegun = gamesBegun[:len(gamesBegun) - 1]

        if gamesBegun != "":
            try:
                response = (
                    supabase.table("game")
                    .update({"is_active":True})
                    .or_(gamesBegun)
                    .execute()
                )
            except Exception as e:
                print("could not update is_active value of games")



    @staticmethod
    def emptyQueues():

        playerRemove = []
        # for player in JoinQueue.playersJoined:
        #     playerRemove += f"player_id.eq.{player.id},"
        # playerRemove = playerRemove[:len(playerRemove) - 1]
        for player in JoinQueue.playersJoined:
            playerRemove.append(player.id)
        if playerRemove: # not empty
            try:
                response = (
                    supabase.table("queue_entry")
                    .delete()
                    .in_("player_id",playerRemove)
                    .execute()
                )
            except Exception as e:
                print("could not remove players from the queue_entry table")

        for team in JoinQueue.teamsJoined:
            for playersID in team.playersID:
                """
                    remove playersID from QueueEntry
                """

        teamRemove = []
        for team in JoinQueue.teamsJoined:
            for playerID in team.playersID:
                teamRemove.append(playerID)


        if teamRemove:
            try:
                response = (
                    supabase.table("queue_entry")
                    .delete()
                    .in_("player_id",teamRemove)
                    .execute()
                )
            except Exception as e:
                print("could not remove players from the queue_entry table")

    @staticmethod
    def getParksWithinRange(incomingPlayer):
        minmaxLat = (incomingPlayer.lat - 1, incomingPlayer.lat + 1)
        minmaxLong = (incomingPlayer.long - 1, incomingPlayer.long + 1)

        getParksResponse = (
            supabase.table("parks")
            .select("park_id, latitude, longitude")
            .gte("latitude", minmaxLat[0])
            .lte("latitude", minmaxLat[1])
            .gte("longitude", minmaxLong[0])
            .lte("longitude", minmaxLong[1])
            .execute()
            .data
        )

        # print(f"get parks response is {getParksResponse}")

        parks: list[Park] = []
        for park in getParksResponse:
            parks.append(Park(park['park_id'], park['latitude'], park['longitude']))
        return parks