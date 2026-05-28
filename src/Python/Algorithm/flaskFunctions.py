from flask import Flask

from Python.Algorithm.Player import Player

app = Flask(__name__)


@app.route("/queuePlayer/<joiningPlayer>")
def queuePlayer(joiningPlayer):
    newPlayer = Player(joiningPlayer['playerID'])