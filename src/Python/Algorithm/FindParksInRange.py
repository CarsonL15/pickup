from json import loads
from math import cos, radians, ceil

from requests import get


def FindParksInRange(Player):
    origin = (Player.lat,Player.long)
    validParks = []



    minmaxLat = (Player.lat - 1,Player.lat + 1)
    minmaxLong = (Player.long -1,Player.long + 1)

    getParksRequest = ("Select park_name,latitude,longitude from parks where "
                       f"latitude >= {minmaxLat[0]} AND latitude <= {minmaxLat[1]} "
                       f"AND longitude >= {minmaxLong[0]} AND longitude <= {minmaxLong[1]}")

    getParksResponse = None # SQL request for parks temp placeholder

    for park in getParksResponse:
        deg = (park.lat - Player.lat) + cos(Player.lat) * cos(park.lat) * (park.long - Player.long)
        distance = radians(deg) * 3,958.8
        if(distance < Player.distancePreference):
            validParks.append(park)
    

    return calculateTravelTimes(validParks,Player)



def calculateTravelTimes(validParks,player):

    orderedParks = []
    priorityList = []

    for park in validParks:

        #mapRequest = f"http://router.project-osrm.org/table/v1/driving/13.388860,52.517037;13.397634,52.529407;13.428555,52.523219"

        mapRequest = f"http://router.project-osrm.org/table/v1/driving/{player.long},{player.lat};{park.long},{park.lat}"

        print(f"map request is {mapRequest}")
        try:
            response = get(mapRequest)
            response = loads(response.text)
            travelTime = ceil(response['durations'][0][1] / 60)
        except:
            travelTime = -1

        parkTimePair = (travelTime,park.id)
        orderedParks.append(parkTimePair)


    orderedParks.sort()

    for park in orderedParks:
        priorityList.append(park[1])


    return priorityList