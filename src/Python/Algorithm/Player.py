class Player:
    id = 0
    lat = None
    long = None

    parkPriority = []       #holds the parkID of the parks the user is within range, index 0 is highest subsequent  are less priority
    skillRating = None
    queueCycles = 0         #used to tell if the user has been waiting a long time
    potentialGameIndex = []    # holds the index of the games in a list the user could potentially be scheduled at

    teamSide = 0
    foundParkID = 0


    urgentGameNeeded = False # true if the user has been waiting a long time

    numVS = -1 # 5 for 5v5 4 for 4v4 etc -1 for any




    distancePreference = None

    def __init__(self, playerID, lat, long, numVS, skill):
        self.id = playerID
        self.lat = lat
        self.long = long
        self.numVS = numVS
        self.skill = skill


