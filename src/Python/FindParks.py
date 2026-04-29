from math import cos, radians

def FindParks(Player):
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
    

    return validParks