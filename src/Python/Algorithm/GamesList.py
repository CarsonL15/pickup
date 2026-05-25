class GamesList:
    activeCasualGames = []
    activeCompGames = []
    GLOBALGAMEID = -1

    @staticmethod
    def getGLOBALGAMEID():
        GamesList.GLOBALGAMEID += 1
        return GamesList.GLOBALGAMEID