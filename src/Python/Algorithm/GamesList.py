class GamesList:
    activeCasualGames = []
    activeCompGames = []
    activeTeamGames = []
    GLOBALGAMEID = -1

    def getGLOBALGAMEID(self):
        self.GLOBALGAMEID += 1
        return self.GLOBALGAMEID