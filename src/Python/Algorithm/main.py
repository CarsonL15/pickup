import time
import Python.Algorithm

from Python.Algorithm import Matchmake
from Python.Algorithm.FindParksInRange import FindParksInRange
from Python.Algorithm.Player import Player
from Python.Algorithm.JoinQueue import JoinQueue
from Python.Algorithm.GamesList import GamesList


def main():

    # p1 = Player(47.702338,-117.194290,0)
    # parksList = []
    # parksList.append(Park(47.626419,-117.420181))
    # validParks = calculateTravelTimes(parksList,p1)

    mainQueue = JoinQueue()
    gameList = GamesList()


    while True:

        mainQueue.refreshQueues()


        for player in JoinQueue.joinCasualParkQueue:
            player.parkPriority = FindParksInRange(player)
            player.potentialGameIndex = [None] * len(player.parkPriority)

        for player in JoinQueue.joinCompetitiveParkQueue:
            player.parkPriority = FindParksInRange(player)
            player.potentialGameIndex = [None] * len(player.parkPriority)




        Matchmake.casual(GamesList.activeCasualGames, JoinQueue.joinCasualParkQueue)
        Matchmake.competitive(GamesList.activeCompGames, JoinQueue.joinCompetitiveParkQueue)
        time.sleep(10)





if __name__ == "__main__":
    main()