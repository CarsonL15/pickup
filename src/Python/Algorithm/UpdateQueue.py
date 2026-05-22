from Python.Algorithm import main
from Python.Algorithm.Game import Game
from Python.Algorithm.JoinQueue import JoinQueue
from Python.Algorithm.JoinQueue import JoinQueue


def updateQueue(gamesList):
    for game in gamesList:
        if game.currentPlayers != game.maxPlayers:
            for player in game.players:

                player.queueCycles += 1

                if player.queueCycles > 10:

                    player.urgentGameNeeded = True

                    if(player.skillRating == 0):
                        game.removePlayerFromCasual(player)
                        JoinQueue.joinCasualParkQueue.append(player)
                    else:
                        game.removePlayerFromCompetitive(player)
                        JoinQueue.joinCompetitiveParkQueue.append(player)



                    if game.currentPlayers == 0:
                        main.activeGames.remove(game)

    return gamesList