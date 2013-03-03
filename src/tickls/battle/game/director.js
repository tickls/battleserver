/*!
 * game_director
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var util                = require('util'),
    events              = require('events'),
    net                 = require('net'),
    settings            = require('tickls/util/settings');
    log                 = require('tickls/util/logger'),
    messageCenter       = require('tickls/battle/message/message_center'),
    message             = require('tickls/battle/message/message'),
    Validator           = require('tickls/battle/message/validator'),
    ClientState         = require('tickls/battle/client/client_state'),
    ClientChannel       = require('tickls/battle/client/client_channel'),
    GameState           = require('./game_state'),
    Game                = require('./game'),
    Player              = require('./player');



function Director() {
    var self = this;

    events.EventEmitter.call(self);

    self.game = null;
    self.clients = {};
    self.running = true;
    self.state = GameState.InLobby;
    self.tickRate = settings.get("server.tickRate", 20);
    self.clientUpdateRate = settings.get("server.clientUpdateTickRate", 5);
    self.tickIntervalId = null
    self.clientUpdateIntervalId = null;
}

util.inherits(Director, events.EventEmitter);


Director.prototype.startDirecting = function() {
    var self = this;

    log.i("Starting Game Director (Game tick rate: #magenta[" + self.tickRate + "] hz, client update rate: #magenta[" + self.clientUpdateRate + "] hz)");

    return self;
};

Director.prototype.addClient = function(client) {
    var self = this;

    var welcomeMessage = message.welcome(self.state, self.namesForClients());

    client.writeMessageToUpstreamChannel(welcomeMessage, function() {
        self.clients[client.UID] = {
            client: client,
            player: new Player(client)
        };

        // Check if we're in a game, if not add player to lobby
        if(self.state == GameState.InGame) {
            self.addClientToGame(client);
        }
        else {
            self.addClientToLobby(client);
        }

        self.emit('clientAdded', client);
    });
};

Director.prototype.removeClient = function(client) {
    var self = this;

    log.i("Removing client #green[" + client.username + "]");

    if(self.clients[client.UID]) {
        delete self.clients[client.UID];
    }

    if(self.state == GameState.InGame) {
        if(!self.hasStillClientsInGame()) {
            self.endGame();
        }
    }
};

Director.prototype.startNewGame = function() {
    var self = this;

    log.i("Creating game...");
    self.state = GameState.InGame;
    self.game = new Game()
        .on('gameEndedWithWinner', function(winner) {
            log.i("Player #green[" + winner.client.username + " won, hoorays!");
            self.endGame();
        })
        .on('allPlayersDied', function() {
            log.i("All players died");
            self.endGame();
        });

    var clientsInGame = {};

    for(var clientUID in self.clients) {
        var client = self.clients[clientUID].client;

        self.addClientToGame(client);
        clientsInGame[clientUID] = client;
    }

    // Notify clients
    self.notifyClientsGameWillStartIn(0, clientsInGame, self.game.map);

    self.game.start();

    // Instantiate ticks
    self.tickIntervalId = setInterval(function() {
        self.tick()
    }, (1.0 / self.tickRate) * 1000);

    self.clientUpdateIntervalId = setInterval(function() {
        self.clientUpdateTick();
    },
    (1.0 / self.clientUpdateRate) * 1000);


    log.i("Game running");
};

Director.prototype.endGame = function() {
    var self = this;

    log.i("Ending game");
    self.state = GameState.InLobby;

    for(var clientUID in self.clients) {
        var client = self.clients[clientUID].client;

        if(client.state != ClientState.Disconnected) {
            client.setState(ClientState.InLobby);
        }
    }

    if(self.game) {
        self.game.end();

        if(self.clientUpdateIntervalId) {
            log.d("Stopping clientUpdate timer");
            clearInterval(self.clientUpdateIntervalId);
            self.clientUpdateIntervalId = null;
        }
        else {
            log.e("Expected to have a #red[clientUpdateTickId] but it doesn't seem to be set :/");
        }

        if(self.tickIntervalId) {
            log.d("Stopping game tick timer");
            clearInterval(self.tickIntervalId);
            self.tickIntervalId = null;
        }
        else {
            log.e("Expected to have a #red[tickIntervalId] but it doesn't seem to be set :/");
        }

        self.game = null;
    }
    else {
        log.w("Could not stop game, no game running");
    }
};

Director.prototype.addClientToGame = function(client) {
    var self = this;
    var player = self.playerForClient(client);

    if(self.state == GameState.InGame) {
        log.d("Adding player #green[" + client.username + "] to game");
        self.game.addPlayer(player);
        client.setState(ClientState.InGame);
    }
    else {
        log.e("Tried to add player to game but we're not in #red[InGame] state, this should never happen :/");
    }
};

Director.prototype.addClientToLobby = function(client) {
    var self = this;

    log.d("Adding player #green[" + client.username + "] to lobby");
    client.setState(ClientState.InLobby);
};

Director.prototype.tick = function() {
    var self = this;

    if(self.state == GameState.InGame) {
        if(self.game != null) {
            self.game.tick(1.0 / self.tickRate);
        }
        else {
            log.w("game == null");
        }
    }
};

Director.prototype.namesForClients = function(clients) {
    var self = this;
    var names = [];

    if(clients == undefined) {
        clients = self.clients;
    }

    for(var clientUID in clients) {
        var client = self.clientForUID(clientUID);
        names.push(client.username);
    }

    return names;
};


Director.prototype.clientUpdateTick = function() {
    var self = this;

    for(var clientUID in self.clients) {
        var clientEntry = self.clients[clientUID];
        var client = clientEntry.client;
        var player = clientEntry.player;

        var tank = player.units[0];

        var updateMessage = {
            'tankStatusUpdate': {
                'position': {
                    'x': tank.position.elements[0],
                    'y': tank.position.elements[1]
                },
                'direction': tank.direction,
                'turretDirection': tank.turret.direction,
                'isMoving': tank.isMoving,
                'isRotating': tank.isRotating,
                'isTurretRotating': tank.turret.isRotating
            }
        };

        client.writeMessageToUpstreamChannel(updateMessage);
    }
};


Director.prototype.playerForClient = function(client) {
    var self = this;
    var clientEntry = self.clients[client.UID];

    if(clientEntry) {
        return clientEntry.player;
    }

    return null;
};

Director.prototype.clientForUID = function(uid) {
    var self = this;
    var clientEntry = self.clients[uid];

    if(clientEntry) {
        return clientEntry.client;
    }

    return null;
};

Director.prototype.hasStillClientsInGame = function() {
    var self = this;
    var stillClientsInGame = false;

    for(var clientUID in self.clients) {
        var clientEntry = self.clients[clientUID];

        if(clientEntry.client.state == ClientState.InGame) {
            stillClientsInGame = true;
            break;
        }
    }

    return stillClientsInGame;
};


Director.prototype.notifyClientsGameWillStartIn = function(delay, clients, map) {
    var self = this;

    var playerNames = self.namesForClients(clients);
    var gameWillStartMessage = message.gameWillStartIn(delay, playerNames, map);

    for(var clientUID in clients) {
        var client = self.clientForUID(clientUID);
        client.writeMessageToUpstreamChannel(gameWillStartMessage);
    }
};

////////////////////
// module exports
////////////////////

// Sort of the singleton pattern.. i guess
// TODO: figure out the 'common' way to do this
directorInstance = new Director();
module.exports = directorInstance;
