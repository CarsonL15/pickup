import time
import Python.Algorithm

from Python.Algorithm import Matchmake
from Python.Algorithm.FindParksInRange import FindParksInRange
from Python.Algorithm.Player import Player
from Python.Algorithm.JoinQueue import JoinQueue
from Python.Algorithm.GamesList import GamesList
from Python.Algorithm.UpdateQueue import updateQueue


def main():

    # p1 = Player(47.702338,-117.194290,0)
    # parksList = []
    # parksList.append(Park(47.626419,-117.420181))
    # validParks = calculateTravelTimes(parksList,p1)
    i = 0




    while True:
        JoinQueue.addPlayer()
        JoinQueue.refreshQueues()
        #updateQueue()

        removeList = []
        for player in JoinQueue.joinCasualParkQueue:
            player.parkPriority = FindParksInRange(player)
            player.potentialGameIndex = [-1] * len(player.parkPriority)
            if not player.parkPriority: #this means list is empty and no parks are in range of the player
                removeList.append(player)
        for player in removeList:
            player.distancePreference += 150
            player.parkPriority = FindParksInRange(player)
            player.potentialGameIndex = [-1] * len(player.parkPriority)

        removeList = []
        for player in JoinQueue.joinCompetitiveParkQueue:
            player.parkPriority = FindParksInRange(player)
            player.potentialGameIndex = [-1] * len(player.parkPriority)
            if not player.parkPriority: #this means list is empty and no parks are in range of the player
                removeList.append(player)
        for player in removeList:
            player.distancePreference += 150
            player.parkPriority = FindParksInRange(player)
            player.potentialGameIndex = [-1] * len(player.parkPriority)


        removeList = []

        for team in JoinQueue.joinCasualTeamsParkQueue:
            team.parkPriority = FindParksInRange(team)
            team.potentialGameIndex = [-1] * len(team.parkPriority)
            if not team.parkPriority: #this means list is empty and no parks are in range of the player
                removeList.append(team)
        for team in removeList:
            team.distancePreference += 150
            team.parkPriority = FindParksInRange(team)
            team.potentialGameIndex = [-1] * len(team.parkPriority)


        removeList = []
        for team in JoinQueue.joinCompetitiveTeamsParkQueue:
            team.parkPriority = FindParksInRange(team)
            team.potentialGameIndex = [-1] * len(team.parkPriority)
            if not team.parkPriority: #this means list is empty and no parks are in range of the player
                removeList.append(team)
        for team in removeList:
            team.distancePreference += 150
            team.parkPriority = FindParksInRange(team)
            team.potentialGameIndex = [-1] * len(team.parkPriority)


        Matchmake.casual(GamesList.activeCasualGames, JoinQueue.joinCasualParkQueue)
        Matchmake.competitive(GamesList.activeCompGames, JoinQueue.joinCompetitiveParkQueue)
        Matchmake.teamCasual(GamesList.activeCasualGames,JoinQueue.joinCasualTeamsParkQueue)
        Matchmake.teamCompetitive(GamesList.activeCompGames,JoinQueue.joinCompetitiveTeamsParkQueue)

        JoinQueue.updateDatabase()
        JoinQueue.emptyQueues()
        time.sleep(5)

        i += 1
        print(f"{i} cycles finished")





if __name__ == "__main__":
    main()