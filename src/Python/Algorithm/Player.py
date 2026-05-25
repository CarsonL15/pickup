class Player:


    def __init__(self, playerID, lat, long, numVS, skill,distancePreference):
        self.id = playerID
        self.lat = lat
        self.long = long
        self.numVS = numVS
        self.skillRating = skill
        self.distancePreference = distancePreference

        self.parkPriority = []  # holds the parkID of the parks the user is within range, index 0 is highest subsequent  are less priority
        self.queueCycles = 0  # used to tell if the user has been waiting a long time
        self.potentialGameIndex = []  # holds the index of the games in a list the user could potentially be scheduled at

        self.teamSide = 0
        self.foundParkID = 0

        self.urgentGameNeeded = False  # true if the user has been waiting a long time

        self.numVS = numVS  # 5 for 5v5 4 for 4v4 etc -1 for any

