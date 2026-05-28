
from json import loads
from math import cos, radians, ceil


from requests import get


from Python.Algorithm.JoinQueue import JoinQueue


def FindParksInRange(Player):
    origin = (Player.lat,Player.long)
    validParks = []


    # parks.append(Park(0, 47.346327, -117.892986))
    # parks.append(Park(1, 47.636327, -117.382986))
    # parks.append(Park(2,47.646327,-117.392986))
    # parks.append(Park(3, 47.736327, -117.282986))
    # parks.append(Park(4, 47.546327, -117.992986))
    # parks.append(Park(5, 47.836327, -117.282986))
    # parks.append(Park(6, 47.146327, -117.192986))
    # parks.append(Park(7, 47.436327, -117.382986))

    parks = JoinQueue.getParksWithinRange(Player)

    for park in parks:
        deg = (park.lat - Player.lat) + cos(Player.lat) * cos(park.lat) * (park.long - Player.long)
        distance = radians(deg) * 3958.8
        if(distance < Player.distancePreference):
            validParks.append(park)
    
    if not validParks: #means validParks is empty
        return []
    else:
        return calculateTravelTimes(validParks,Player)



def calculateTravelTimes(validParks,player):

    orderedParks = []
    priorityList = []




    cordList = f"{player.long},{player.lat};"
    destinationList = ""
    i = 1

    for park in validParks:
        if i == len(validParks):
            cordList += f"{park.long},{park.lat}"
            destinationList += f"{i}"
        else:
            cordList += f"{park.long},{park.lat};"
            destinationList += f"{i};"
        i += 1



    #mapRequest = f"http://router.project-osrm.org/table/v1/driving/13.388860,52.517037;13.397634,52.529407;13.428555,52.523219"
    mapRequest = f"http://router.project-osrm.org/table/v1/driving/{cordList}?sources=0&destinations={destinationList}"

    try:
        response = get(mapRequest)
        response = loads(response.text)
        travelTime = response['durations']
    except:
        travelTime = ""


    dest = 0
    if travelTime != "":
        for x in range(len(travelTime[0])):
            parkTimePair = (travelTime[0][dest] // 60,validParks[dest - 1].id)
            orderedParks.append(parkTimePair)
            dest += 1
    else:
        return []

    orderedParks.sort()

    for park in orderedParks:
        if(park[0] != -1):
            priorityList.append(park[1])

    del priorityList[20:]
    return priorityList