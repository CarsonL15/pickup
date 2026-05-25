class Team:

    def __init__(self, id,playersList, lat, long, numVS, skill,distancePreferance):
        self.id = id
        self.playersID = playersList
        self.lat = lat
        self.long = long
        self.numVS = numVS
        self.skillRating = skill
        self.distancePreference = distancePreferance

        self.playersID = []

        self.parkPriority = []  # holds the parkID of the parks the user is within range, index 0 is highest subsequent  are less priority
        self.queueCycles = 0  # used to tell if the user has been waiting a long time
        self.potentialGameIndex = []  # holds the index of the games in a list the user could potentially be scheduled at

        self.teamSide = 0
        self.teamSize = 0
        self.foundParkID = 0

        self.urgentGameNeeded = False  # true if the user has been waiting a long time

    def addPlayer(self,incomingID,lat,long,skillRating):
        self.playersID.append(incomingID)

        self.lat = ((self.lat * self.teamSize) + lat) // (self.teamSize + 1)
        self.long = ((self.long * self.teamSize) + long) // (self.teamSize + 1)
        self.teamSize += 1

        if skillRating != 0:
            self.skillRating += skillRating