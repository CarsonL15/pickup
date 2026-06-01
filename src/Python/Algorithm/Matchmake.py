from Python.Algorithm.Game import Game
from Python.Algorithm.GamesList import GamesList
from Python.Algorithm.JoinQueue import JoinQueue
from Python.Algorithm.Player import Player
from Python.Algorithm.Team import Team


def casual(activeGames : list[Game],joiningPlayers : list[Player]):




    for player in joiningPlayers:



        for game in activeGames:
            if game.playerCanJoinCasual(player):
                player.potentialGameIndex[player.parkPriority.index(
                    game.parkID)] = game.gameID  # sets the corresponding list that this park has a game



        if player.potentialGameIndex.count(-1) < len(player.potentialGameIndex): # if there is a game within range

            if player.urgentGameNeeded:
                largest = -1
                index = -1
                for x in player.potentialGameIndex:
                    if x != -1:
                        if activeGames[x].playerCanJoinCasual(player):
                            if activeGames[x].currentPlayers > largest:
                                largest = activeGames[x].currentPlayers
                                index = x
                activeGames[index].addPlayerToCasual(player)


            else:
                for x in player.potentialGameIndex:
                    if x != -1:
                        if activeGames[x].playerCanJoinCasual(player):
                            activeGames[x].addPlayerToCasual(player)
                            if activeGames[x].isActive:
                                JoinQueue.gamesStarted.append(activeGames[x])
                            JoinQueue.playersJoined.append(player)
                        break

        else:   # create a new game at the specified park
            newGame = Game(GamesList.getGLOBALGAMEID(),player.parkPriority[0],player.numVS * 2,True)
            newGame.addPlayerToCasual(player)
            activeGames.append(newGame)

            JoinQueue.gamesCreated.append(newGame)
            JoinQueue.playersJoined.append(player)


def competitive(activeGames : list[Game],joiningPlayers : list[Player]):




    for player in joiningPlayers:



        for game in activeGames:
            if game.playerCanJoinCompetitive(player):
                player.potentialGameIndex[player.parkPriority.index(
                    game.parkID)] = game.gameID  # sets the corresponding list that this park has a game




        if player.potentialGameIndex.count(-1) < len(player.potentialGameIndex): # if there is a game within range


            for x in player.potentialGameIndex:
                if x != -1:
                    if activeGames[x].playerCanJoinCompetitive(player):
                        activeGames[x].addPlayerToCompetitive(player)
                        if activeGames[x].isActive:
                            JoinQueue.gamesStarted.append(activeGames[x])
                        JoinQueue.playersJoined.append(player)
                    break

        else:   # create a new game at the specified park
            newGame = Game(GamesList.getGLOBALGAMEID(),player.parkPriority[0],player.numVS * 2,False)
            newGame.addPlayerToCompetitive(player,True)
            activeGames.append(newGame)

            JoinQueue.gamesCreated.append(newGame)
            JoinQueue.playersJoined.append(player)


def teamCasual(activeGames : list[Game] ,joiningTeams : list[Team]):


    for team in joiningTeams:


        for game in activeGames:
            if game.teamCanJoinCasual(team):
                team.potentialGameIndex[team.parkPriority.index(
                    game.parkID)] = game.gameID  # sets the corresponding list that this park has a game


        if team.potentialGameIndex.count(-1) < len(team.potentialGameIndex): # if there is a game within range


            for x in team.potentialGameIndex:
                if x != -1:
                    if activeGames[x].teamCanJoinCasual(team):
                        activeGames[x].addTeamToCasual(team)
                        if activeGames[x].isActive:
                            JoinQueue.gamesStarted.append(activeGames[x])
                        JoinQueue.teamsJoined.append(team)
                        break

        else:   # create a new game at the specified park
            newGame = Game(GamesList.getGLOBALGAMEID(),team.parkPriority[0],team.numVS * 2,True)
            newGame.addTeamToCasual(team)
            activeGames.append(newGame)

            JoinQueue.gamesCreated.append(newGame)
            JoinQueue.teamsJoined.append(team)


def teamCompetitive(activeGames : list[Game] ,joiningTeams : list[Team]):


    for team in joiningTeams:


        for game in activeGames:
            if game.teamCanJoinCompetitive(team):
                team.potentialGameIndex[team.parkPriority.index(
                    game.parkID)] = game.gameID  # sets the corresponding list that this park has a game



        if team.potentialGameIndex.count(-1) < len(team.potentialGameIndex): # if there is a game within range


            for x in team.potentialGameIndex:
                if x != -1:
                    if activeGames[x].teamCanJoinCompetitive(team):
                        activeGames[x].addTeamToCompetitive(team)
                        if activeGames[x].isActive:
                            JoinQueue.gamesStarted.append(activeGames[x])
                        JoinQueue.teamsJoined.append(team)
                        break

        else:   # create a new game at the specified park
            newGame = Game(GamesList.getGLOBALGAMEID(),team.parkPriority[0],team.numVS * 2,False)
            newGame.addTeamToCompetitive(team,True)
            activeGames.append(newGame)

            JoinQueue.gamesCreated.append(newGame)
            JoinQueue.teamsJoined.append(team)