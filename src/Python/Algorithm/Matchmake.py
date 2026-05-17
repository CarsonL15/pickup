from Python.Algorithm.Game import Game
from Python.Algorithm.GamesList import GamesList
from Python.Algorithm.JoinQueue import JoinQueue
from Python.Algorithm.Player import Player

def casual(activeGames,joiningPlayers):


    i = 0

    for game in activeGames:
        for player in joiningPlayers:
            if game.playerCanJoinCasual(player):
                player.potentialGameIndex[player.parkPriority.index(game.parkID)] = i # sets the corresponding list that this park has a game
                i += 1







    for player in joiningPlayers:
        if player.potentialGameIndex.count(None) < len(player.potentialGameIndex): # if there is a game within range


            for x in player.potentialGameIndex:
                if x != None:
                    if activeGames[x].playerCanJoinCasual():
                        activeGames[x].addPlayerToCasual(player)
                        JoinQueue.playersJoined.append(player)
                    break

        else:   # create a new game at the specified park
            newGame = Game(GamesList.GLOBALGAMEID(),player.parkPriority[0],player.numVS * 2,True)
            activeGames.append(newGame)

            JoinQueue.gamesCreated.append(newGame)
            JoinQueue.playersJoined.append(player)

