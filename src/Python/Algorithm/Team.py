class Team:
    playersID = []
    lat = None
    long = None
    id = -1

    parkPriority = []       #holds the parkID of the parks the user is within range, index 0 is highest subsequent  are less priority
    skillRating = None
    queueCycles = 0         #used to tell if the user has been waiting a long time
    potentialGameIndex = []    # holds the index of the games in a list the user could potentially be scheduled at

    teamSide = 0
    teamSize = 0
    foundParkID = 0


    urgentGameNeeded = False # true if the user has been waiting a long time

    numVS = -1 # 5 for 5v5 4 for 4v4 etc -1 for any




    distancePreference = None

    def __init__(self, id,playersList, lat, long, numVS, skill,distancePreferance):
        self.id = id
        self.playersID = playersList
        self.lat = lat
        self.long = long
        self.numVS = numVS
        self.skill = skill
        self.distancePreference = distancePreferance

    def addPlayer(self,incomingID,lat,long,skillRating):
        self.playersID.append(incomingID)

        self.lat = ((self.lat * self.teamSize) + lat) // (self.teamSize + 1)
        self.long = ((self.long * self.teamSize) + long) // (self.teamSize + 1)
        self.teamSize += 1

        if skillRating != 0:
            self.skillRating += skillRating