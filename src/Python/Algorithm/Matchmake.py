from Python.Algorithm.Game import Game
from Python.Algorithm.GamesList import GamesList
from Python.Algorithm.JoinQueue import JoinQueue
from Python.Algorithm.Player import Player
from Python.Algorithm.Team import Team


def casual(activeGames : list[Game],joiningPlayers : list[Player]):


    i = 0

    for game in activeGames:
        for player in joiningPlayers:
            if game.playerCanJoinCasual(player):
                player.potentialGameIndex[player.parkPriority.index(game.parkID)] = i # sets the corresponding list that this park has a game
                i += 1







    for player in joiningPlayers:
        if player.potentialGameIndex.count(None) < len(player.potentialGameIndex): # if there is a game within range

            if player.urgentGameNeeded:
                largest = -1
                index = -1
                for x in player.potentialGameIndex:
                    if x != None:
                        if activeGames[x].playerCanJoinCasual(player):
                            if activeGames[x].currentPlayers > largest:
                                largest = activeGames[x].currentPlayers
                                index = x
                activeGames[index].addPlayerToCasual(player)


            else:
                for x in player.potentialGameIndex:
                    if x != None:
                        if activeGames[x].playerCanJoinCasual(player):
                            activeGames[x].addPlayerToCasual(player)
                            JoinQueue.playersJoined.append(player)
                        break

        else:   # create a new game at the specified park
            newGame = Game(GamesList.GLOBALGAMEID(),player.parkPriority[0],player.numVS * 2,True)
            newGame.addPlayerToCasual(player)
            activeGames.append(newGame)

            JoinQueue.gamesCreated.append(newGame)
            JoinQueue.playersJoined.append(player)


def competitive(activeGames : list[Game],joiningPlayers : list[Player]):
    i = 0

    for game in activeGames:
        for player in joiningPlayers:
            if game.playerCanJoinCompetitive(player):
                player.potentialGameIndex[player.parkPriority.index(game.parkID)] = i  # sets the corresponding list that this park has a game
                i += 1



    for player in joiningPlayers:
        if player.potentialGameIndex.count(None) < len(player.potentialGameIndex): # if there is a game within range


            for x in player.potentialGameIndex:
                if x != None:
                    if activeGames[x].playerCanJoinCompetitive(player):
                        activeGames[x].addPlayerToCompetitive(player)
                        JoinQueue.playersJoined.append(player)
                    break

        else:   # create a new game at the specified park
            newGame = Game(GamesList.GLOBALGAMEID(),player.parkPriority[0],player.numVS * 2,False)
            newGame.addPlayerToCompetitive(player,True)
            activeGames.append(newGame)

            JoinQueue.gamesCreated.append(newGame)
            JoinQueue.playersJoined.append(player)


def teamCasual(activeGames : list[Game] ,joiningTeams : list[Team]):
    i = 0
    for game in activeGames:
        for team in joiningTeams:
            if game.teamCanJoinCasual(team):
                team.potentialGameIndex[team.parkPriority.index(game.parkID)] = i # sets the corresponding list that this park has a game
                i += 1

    for team in joiningTeams:
        if team.potentialGameIndex.count(None) < len(team.potentialGameIndex): # if there is a game within range


            for x in team.potentialGameIndex:
                if x != None:
                    if activeGames[x].teamCanJoinCasual(team):
                        activeGames[x].addTeamToCasual(team)
                        JoinQueue.teamsJoined.append(team)
                        break

        else:   # create a new game at the specified park
            newGame = Game(GamesList.GLOBALGAMEID(),team.parkPriority[0],team.numVS * 2,True)
            newGame.addTeamToCasual(team)
            activeGames.append(newGame)

            JoinQueue.gamesCreated.append(newGame)
            JoinQueue.teamsJoined.append(team)


def teamCompetitive(activeGames : list[Game] ,joiningTeams : list[Team]):
    i = 0
    for game in activeGames:
        for team in joiningTeams:
            if game.teamCanJoinCompetitive(team):
                team.potentialGameIndex[team.parkPriority.index(game.parkID)] = i # sets the corresponding list that this park has a game
                i += 1

    for team in joiningTeams:
        if team.potentialGameIndex.count(None) < len(team.potentialGameIndex): # if there is a game within range


            for x in team.potentialGameIndex:
                if x != None:
                    if activeGames[x].teamCanJoinCompetitive(team):
                        activeGames[x].addTeamToCompetitive(team)
                        JoinQueue.teamsJoined.append(team)
                        break

        else:   # create a new game at the specified park
            newGame = Game(GamesList.GLOBALGAMEID(),team.parkPriority[0],team.numVS * 2,False)
            newGame.addTeamToCompetitive(team,True)
            activeGames.append(newGame)

            JoinQueue.gamesCreated.append(newGame)
            JoinQueue.teamsJoined.append(team)