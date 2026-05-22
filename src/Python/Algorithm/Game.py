from Python.Algorithm.GamesList import GamesList
from Python.Algorithm.Player import Player


class Game:
    gameID = 0

    currentPlayers = 0
    maxPlayers = 0

    parkID = 0
    players = []

    team1Players = 0
    team2Players = 0

    isActive = False

    isCasual = True

    team1Skill = 0
    team2Skill = 0

    skillFloor = 0
    skillCeiling = 0


    def __init__(self,gameID,parkID,maxPlayers,isCasual):
        self.gameID = gameID
        self.parkID = parkID

        if maxPlayers < 0:
            self.maxPlayers = 10
        else:
            self.maxPlayers = maxPlayers

        self.isCasual = isCasual


    def TeamCanJoinCasual(self,team):
        if team.teamSize + self.currentPlayers > self.maxPlayers:  # if the players would exceed the max if this player(s) joined
            return False
        if self.maxPlayers / 2 - self.team1Players < team.teamSize and self.maxPlayers / 2 - self.team2Players < team.teamSize:  # this checks whether both sides have enough people
            return False
        return True

    def TeamCanJoinCompetitve(self,team):
        return



    def playerCanJoinCasual(self,player):
        if self.isActive or self.parkID not in player.parkPriority or player.skillRating != 0: # if the game has started or the park is not in the players range or comp player in casual
            return False
        if player.numVS != -1 or player.numVS != self.maxPlayers / 2: # if the matchup count is wrong, ex: 4v4 vs 5v5
            return False
        return True



    def playerCanJoinCompetitive(self,player):
        if self.isActive or self.parkID not in player.parkPriority or player.skillRating != 0:  # if the game has started or the park is not in the players range or comp player in casual
            return False
        if player.numVS != -1 or player.numVS != self.maxPlayers / 2:  # if the matchup count is wrong, ex: 4v4 vs 5v5
            return False
        if player.skillRating < self.skillFloor or player.skillRating > self.skillCeiling:
            return False
        return True




    def addPlayerToCasual(self,player):
        self.currentPlayers += 1
        if self.team1Players < self.maxPlayers / 2:
            self.team1Players += 1
            player.teamSide = 1
        else:
            self.team2Players += 1
            player.teamSide = 2

        self.players.append(player)
        if self.currentPlayers == self.maxPlayers:
            self.isActive = True

        player.foundParkID = self.gameID



    def addPlayerToCompetitve(self,player,initialPlayer = False):
        self.currentPlayers += 1

        if initialPlayer:
            self.skillFloor = player.skillRating - 100
            self.skillCeiling = player.skillRating + 100
            self.team1Players += 1
        else:

            team1Adv = (self.team1Skill / self.team1Players > self.team2Skill / self.team2Players)
            aboveAvg = player.skillRating > (self.team1Skill + self.team2Skill) / self.currentPlayers



            if (self.team1Players < self.maxPlayers / 2 and not team1Adv and aboveAvg) or self.team2Players == 5:
                self.team1Players += 1
                player.teamSide = 1
            else:
                self.team2Players += 1
                player.teamSide = 2

        self.players.append(player)
        if self.currentPlayers == self.maxPlayers:
            self.isActive = True

        player.foundParkID = self.gameID

    def removePlayerFromCasual(self,player):
        if(player not in self.players):
            return False
        else:
            self.currentPlayers -= 1
            self.players.remove(player)

            if(player.teamSide == 1):
                self.team1Players -= 1
            else:
                self.team2Players -= 1
        return True

    def removePlayerFromCompetitive(self,player):
        if(self.removePlayerFromCasual(player)):
            if (player.teamSide == 1):
                self.team1Skill -= player.skillRating
            else:
                self.team2Skill -= player.skillRating
