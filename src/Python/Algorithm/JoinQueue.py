import random

from Python.Algorithm.Game import Game
from Python.Algorithm.Player import Player
from Python.Algorithm.Team import Team


class JoinQueue:
    joinCasualParkQueue : list[Player] = []
    joinCompetitiveParkQueue : list[Player] = []
    joinCompetitiveTeamsParkQueue : list[Team] = []
    joinCasualTeamsParkQueue : list[Team] = []

    gamesCreated : list[Game]= []
    playersJoined : list[Player] = []
    teamsJoined : list[Team] = []
    gamesStarted = []

    gamesFinished : list[Game]

    playersJoiningList = []

    @staticmethod
    def addPlayer():
        #JoinQueue.playersJoiningList.append(Player(len(JoinQueue.playersJoiningList),random.random() + 47,random.random() - 118,random.randint(2,5),0,50))
        JoinQueue.playersJoiningList.append(Player(0, 47, -118, 2,0,50))
        JoinQueue.playersJoiningList.append(Player(1, 47, -118, 2, 0, 50))
        JoinQueue.playersJoiningList.append(Player(2, 47, -118, 2, 0, 50))
        JoinQueue.playersJoiningList.append(Player(3, 47, -118, 2, 0, 50))
        JoinQueue.playersJoiningList.append(Player(3, 47, -118, 2, 0, 50))

    @staticmethod
    def refreshQueues():
        joinGamesQueueRequest = "SELECT" """we want info on players joining games, this includes 

                the id of the player
                the latitude of the player
                the longitude of the player
                the number of opponents, eg 5v5 would be 5, 3v3 would be 3, any would be -1
                the skill of the player
                the distance Preference of the player
                
                In the select statement exclude all that have a partyID that's not null

                """

        joinGamesQueueResponse = ""

        JoinQueue.joinCasualParkQueue = []
        JoinQueue.joinCompetitiveParkQueue = []



        for x in range(len(joinGamesQueueResponse)):
            if (JoinQueue.joinCasualParkQueue[10] != "casual"):  # if the game type is competitive
                JoinQueue.joinCompetitiveParkQueue.append(Player(joinGamesQueueResponse[5], joinGamesQueueResponse[6],
                                                       # THESE lines will change when we find out what supabase returns in JSON
                                                       joinGamesQueueResponse[7], joinGamesQueueResponse[8],
                                                       joinGamesQueueResponse[11],50))
            else:
                JoinQueue.joinCasualParkQueue.append(Player(joinGamesQueueResponse[5], joinGamesQueueResponse[6],
                                                  joinGamesQueueResponse[7], joinGamesQueueResponse[8],
                                                  0,50))  # THESE lines will change when we find out what supabase returns in JSON



        # TEAMS QUEUE
        joinTeamGamesQueueRequest = "SELECT" """we want info on players joining games, this includes 

                the id of the player
                the latitude of the player
                the longitude of the player
                the number of opponents, eg 5v5 would be 5, 3v3 would be 3, any would be -1
                the skill of the player
                the distance Preference of the player
                the party/team ID of the player
                
                In the select statement exclude all that have a partyID that's null
                        

                        """

        joinGamesQueueResponse = ""

        casualGames = {}
        competitiveGames = {}

        JoinQueue.joinCompetitiveTeamsParkQueue = []
        JoinQueue.joinCasualTeamsParkQueue = []

        for x in range(len(joinGamesQueueResponse)):
                # this should be the isTeam section     #this is the Party/Team ID
            if joinGamesQueueResponse[12] == False and joinGamesQueueResponse[11] not in casualGames.keys():
                casualGames[joinGamesQueueResponse[11]] = [Team("""""")]
            elif joinGamesQueueResponse[11] not in competitiveGames.keys():
                competitiveGames[joinGamesQueueResponse[11]] = [Team("""""")]
            elif joinGamesQueueResponse[12] == True and joinGamesQueueResponse[11] in competitiveGames.keys():
                competitiveGames[joinGamesQueueResponse[11]].addPlayer("""""")
            else:
                casualGames[joinGamesQueueResponse[11]].addPlayer("""""")
        for player in JoinQueue.playersJoiningList:
            JoinQueue.joinCasualParkQueue.append(player)
        JoinQueue.playersJoiningList = []

    @staticmethod
    def updateDatabase():

        updateGamesRequest = "Insert Into game"
        updatePlayerRequest = "Insert Into Game_player"
        updateGamesStartedRequest = "Insert Into game"

        for game in JoinQueue.gamesCreated:

            """
            
            game.gameID -> game_id
            game.isCasual -> game_mode
            game.isActive -> status
            game.parkID -> park_id
            
            
            """

        for player in JoinQueue.playersJoined:
            """

            player.foundParkID -> game_id
            player.id -> user_id
            player.teamSide -> team_side


            """

        for team in JoinQueue.teamsJoined:
            for playersID in team.playersID:
                """
                team.foundParkID -> game_id
                playersID -> user_id
                player.teamSide -> team_side
                team.is -> party_id
            
                """

        for game in JoinQueue.gamesStarted:
            print(f"game id is {game.gameID}")
            """
            update where game.gameID == game_id
            status is now active

            """



    @staticmethod
    def emptyQueues():
        removePlayerRequest = ""

        for player in JoinQueue.playersJoined:
            """
                remove player.id from QueueEntry
            """

        for team in JoinQueue.teamsJoined:
            for playersID in team.playersID:
                """
                    remove playersID from QueueEntry
                """