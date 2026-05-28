from Python.Algorithm.Player import Player
from Python.Algorithm.Team import Team

class Game:


    def __init__(self,gameID,parkID,maxPlayers,isCasual):
        self.gameID = gameID
        self.parkID = parkID

        if maxPlayers < 0:
            self.maxPlayers = 10
        else:
            self.maxPlayers = maxPlayers

        self.isCasual = isCasual

        self.currentPlayers = 0

        self.players: list[Player] = []
        self.teams: list[Team] = []

        self.team1Players = 0
        self.team2Players = 0

        self.isActive = False

        self.team1Skill = 0
        self.team2Skill = 0

        self.skillFloor = 0
        self.skillCeiling = 0


    def teamCanJoinCasual(self,team):
        if self.isActive or team.teamSize + self.currentPlayers > self.maxPlayers:  # if the players would exceed the max if this player(s) joined
            return False
        if self.maxPlayers / 2 - self.team1Players < team.teamSize and self.maxPlayers / 2 - self.team2Players < team.teamSize:  # this checks whether both sides have enough people
            return False
        if team.numVS != -1 and self.maxPlayers / 2 != team.numVS:
            return False
        return True

    def teamCanJoinCompetitive(self,team):
        if self.isActive or team.teamSize != self.maxPlayers / 2:  # if the players would exceed the max if this player(s) joined
            return False
        if self.team1Players != 0 and self.team2Players != 0:  # this checks whether both sides have enough people
            return False
        if team.skillRating < self.skillFloor or team.skillRating > self.skillCeiling:
            return False
        return True



    def playerCanJoinCasual(self,player):
        if self.isActive or self.parkID not in player.parkPriority or player.skillRating != 0: # if the game has started or the park is not in the players range or comp player in casual
            return False
        if player.numVS != -1 and player.numVS != self.maxPlayers / 2: # if the matchup count is wrong, ex: 4v4 vs 5v5
            return False
        return True



    def playerCanJoinCompetitive(self,player):
        if self.isActive or self.parkID not in player.parkPriority or player.skillRating == 0:  # if the game has started or the park is not in the players range or comp player in casual
            return False
        if player.numVS != -1 and player.numVS != self.maxPlayers / 2:  # if the matchup count is wrong, ex: 4v4 vs 5v5
            return False
        if player.skillRating < self.skillFloor or player.skillRating > self.skillCeiling:
            return False
        return True




    def addPlayerToCasual(self,player : Player):
        if self.currentPlayers == 0: # means this game has just been created
            self.maxPlayers = player.numVS * 2

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



    def addPlayerToCompetitive(self,player : Player,initialPlayer = False):


        if initialPlayer:
            self.maxPlayers = player.numVS * 2
            self.skillFloor = player.skillRating - 100
            self.skillCeiling = player.skillRating + 100
            self.team1Players += 1
            self.team1Skill += player.skillRating
            player.teamSide = 1

        else:
            team1Adv = True
            aboveAvg = False
            if self.team2Players != 0:
                team1Adv = (self.team1Skill / self.team1Players > self.team2Skill / self.team2Players)
                aboveAvg = player.skillRating > (self.team1Skill + self.team2Skill) / self.currentPlayers





            if (self.team1Players < self.maxPlayers / 2 and not team1Adv and aboveAvg) or self.team2Players == self.maxPlayers / 2:
                self.team1Players += 1
                self.team1Skill += player.skillRating
                player.teamSide = 1
            else:
                self.team2Players += 1
                self.team2Skill += player.skillRating
                player.teamSide = 2

        self.currentPlayers += 1
        self.players.append(player)
        if self.currentPlayers == self.maxPlayers:
            self.isActive = True


        player.foundParkID = self.gameID

    def addTeamToCasual(self,team : Team):
        if self.currentPlayers == 0:
            self.maxPlayers = team.numVS * 2


        self.currentPlayers += team.teamSize
        if self.team1Players < self.maxPlayers / 2:
            self.team1Players += team.teamSize
            team.teamSide = 1
        else:
            self.team2Players += team.teamSize
            team.teamSide = 2

        self.teams.append(team)
        if self.currentPlayers == self.maxPlayers:
            self.isActive = True


        team.foundParkID = self.gameID

    def addTeamToCompetitive(self,team : Team,initialPlayer = False):


        if initialPlayer:
            self.skillFloor = (team.skillRating) - 200
            self.skillCeiling = (team.skillRating) + 200
            self.team1Players += team.teamSize
            self.maxPlayers = team.numVS * 2
            self.team1Skill = team.skillRating
            team.teamSide = 1
        else:
            self.team2Players += team.teamSize
            self.team2Skill = team.skillRating
            team.teamSide = 2

        self.teams.append(team)

        self.currentPlayers += team.teamSize
        if self.currentPlayers == self.maxPlayers:
            self.isActive = True


        team.foundParkID = self.gameID

    def removePlayerFromCasual(self,player : Player):
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

    def removePlayerFromCompetitive(self,player : Player):
        if(self.removePlayerFromCasual(player)):
            if (player.teamSide == 1):
                self.team1Skill -= player.skillRating
            else:
                self.team2Skill -= player.skillRating
