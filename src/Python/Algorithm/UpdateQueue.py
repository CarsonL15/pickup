from Python.Algorithm.Game import Game
from Python.Algorithm.GamesList import GamesList
from Python.Algorithm.JoinQueue import JoinQueue
from Python.Algorithm.JoinQueue import JoinQueue
from Python.Algorithm.Player import Player

@staticmethod
def updateQueue():

    for game in GamesList.activeCasualGames:
        if not game.isActive:
            for player in game.players:
                if player.skillRating == 0:

                    player.queueCycles += 1

                    if player.queueCycles > 10:
                        player.queueCycles = 0
                        player.urgentGameNeeded = True

                        if(player.skillRating == 0):
                            game.removePlayerFromCasual(player)
                            JoinQueue.joinCasualParkQueue.append(player)
                        else:
                            game.removePlayerFromCompetitive(player)
                            JoinQueue.joinCompetitiveParkQueue.append(player)



                        if game.currentPlayers == 0:
                            GamesList.activeCasualGames.remove(game)

    return GamesList.activeCasualGames