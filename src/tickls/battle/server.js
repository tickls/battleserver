/*!
 * server
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var log                 = require('tickls/util/logger'),
    constants           = require('tickls/util/constants'),
    settings            = require('tickls/util/settings'),
    clientAcceptor      = require('tickls/battle/client/client_acceptor'),
    client              = require('tickls/battle/client/client'),
    gameDirector        = require('tickls/battle/game/director'),
    GameState           = require('tickls/battle/game/game_state'),
    sys                 = require('sys'),
    events              = require('events'),
    net                 = require('net');


/**
 * Module exports
 */
module.exports = Server;


function Server() {
    var self = this;

    events.EventEmitter.call(self);

    if(false === (self instanceof Server)) {
        return new Server();
    }

}

sys.inherits(Server, events.EventEmitter);

Server.super_ = events.EventEmitter;
Server.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value: Server,
        enumerable: false
    }
});


Server.prototype.addUnit = function(unit) {
    var self = this;

    self.units.push(unit);
};

Server.prototype.start = function() {
    var self = this;

    gameDirector.on('clientAdded', function(client) {
        if(gameDirector.state != GameState.InGame) {
            gameDirector.startNewGame();
        }
    }).startDirecting();

    clientAcceptor.startAcceptingClients().on('acceptedClient', function(client) {
        client.on('disconnected', function(client) {
            gameDirector.removeClient(client);
        });

        gameDirector.addClient(client);
    });

    return self;
}
