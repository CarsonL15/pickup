from Python.Algorithm.Game import Game
from Python.Algorithm.Player import Player
from Python.Algorithm.Team import Team


class JoinQueue:
    joinCasualParkQueue : list[Player] = []
    joinCompetitiveParkQueue : list[Player] = []
    joinTeamsParkQueue : list[Player] = []

    gamesCreated : list[Game]= []
    playersJoined : list[Player] = []

    gamesFinished : list[Game]


    def refreshQueues(self):
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

        joinCasualParkQueue = []
        joinCompetitiveParkQueue = []



        for x in range(len(joinGamesQueueResponse)):
            if (joinCasualParkQueue[10] != "casual"):  # if the game type is competitive
                joinCompetitiveParkQueue.append(Player(joinGamesQueueResponse[5], joinGamesQueueResponse[6],
                                                       # THESE lines will change when we find out what supabase returns in JSON
                                                       joinGamesQueueResponse[7], joinGamesQueueResponse[8],
                                                       joinCasualParkQueue[11]))
            else:
                joinCasualParkQueue.append(Player(joinGamesQueueResponse[5], joinGamesQueueResponse[6],
                                                  joinGamesQueueResponse[7], joinGamesQueueResponse[8],
                                                  0))  # THESE lines will change when we find out what supabase returns in JSON



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

        joinCompetitiveTeamsParkQueue = []
        joinCasualTeamsParkQueue = []

        for x in range(len(joinGamesQueueResponse)):
                # this should be the isTeam section     #this is the Party/Team ID
            if joinGamesQueueResponse[12] == False and joinGamesQueueResponse[11] not in casualGames.keys():
                casualGames[joinGamesQueueResponse[11]] = [Team()]
            elif joinGamesQueueResponse[11] not in competitiveGames.keys():
                competitiveGames[joinGamesQueueResponse[11]] = [Team()]
            elif joinGamesQueueResponse[12] == True and joinGamesQueueResponse[11] in competitiveGames.keys():
                competitiveGames[joinGamesQueueResponse[11]].addPlayer()
            else:
                casualGames[joinGamesQueueResponse[11]].addPlayer()

            

    def updateDatabase(self):

        updateGamesRequest = "Insert Into Games"
        updatePlayerRequest = "Insert Into Game_player"

        for game in self.gamesCreated:

            """
            
            game.gameID -> game_id
            game.isCasual -> game_mode
            game.isActive -> status
            game.parkID -> park_id
            
            
            """

        for player in self.playersJoined:
            """

            player.foundParkID -> game_id
            player.id -> user_id
            player.teamSide -> team_side


            """


    def emptyQueues(self):
        removePlayerRequest = ""

        for player in self.joinCasualParkQueue:
            """
                remove player.id from QueueEntry
            """
        for player in self.joinCompetitiveParkQueue:
            """
                remove player.id from QueueEntry
            """
        for player in self.joinTeamsParkQueue:
            """
                remove player.id from QueueEntry
            """