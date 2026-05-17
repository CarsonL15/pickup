from Python.Algorithm import main


def updateQueue(gamesList):
    for game in gamesList:
        if game.currentPlayers != game.maxPlayers:
            for player in game.players:

                player.queueCycles += 1

                if player.queueCycles > 10:

                    player.urgentGameNeeded = True
                    game.currentPlayers -= 1

                    game.players.remove(player)
                    main.joinParkQueue.append(player)

                    if game.currentPlayers == 0:
                        main.activeGames.remove(game)

    return gamesList