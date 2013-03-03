/**!
 * player
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */


/**
 * Module dependencies.
 */
var util                = require('util'),
    events              = require('events'),
    log                 = require('tickls/util/logger'),
    settings            = require('tickls/util/settings'),
    ClientState         = require('tickls/battle/client/client_state'),
    ClientChannel       = require('tickls/battle/client/client_channel'),
    messageCenter       = require('tickls/battle/message/message_center');


////////////////////
// module exports
////////////////////
module.exports = Player;
//exports.hasUpstreamAwaitingClientWithUID = hasUpstreamAwaitingClientWithUID;

var isAliveValidator = function(player) {
    return function() {
        return player.isAlive();
    };
};

function Player(client) {
    var self = this;
    events.EventEmitter.call(self);

    self.registerMessageValidators(client);
    self.initClientMessageHandlers(client);

    if(false === (self instanceof Player)) {
        return new Player();
    }

    // Couple the player UID to our client UID
    self.UID = client.UID;
    self.client = client;
    self.units = [];
}

util.inherits(Player, events.EventEmitter);


Player.prototype.addUnit = function(unit) {
    var self = this;
    self.units.push(unit);
};


Player.prototype.initClientMessageHandlers = function(client) {
    var self = this;

    client.on('moveForwardWithSpeed', function(msg) {
        // We only have one unit for now
        var tank = self.getTank();
        var speed = msg.moveForwardWithSpeed;
        tank.moveForwardWithSpeed(speed * settings.get('game.rules.moveSpeed', 45));
    });

    client.on('moveBackwardWithSpeed', function(msg) {
        var tank = self.getTank();
        var speed = msg.moveBackwardWithSpeed;
        tank.moveBackwardWithSpeed(speed * settings.get('game.rules.moveSpeed', 10));
    });

    client.on('stop', function(msg) {
        var tank = self.getTank();
        switch(msg.stop) {
            case 'moving':
                tank.stopMoving();
                break;

            case 'tankRotation':
                tank.stopRotating();
                break;

            case 'turretRotation':
                tank.turret.stopRotating();
                break;

            default:
                log.e("Invalid stop command: #magenta[" + msg.stop + "]");
                break;
        }
    });

    client.on('rotateTankWithSpeed', function(msg) {
        var tank = self.getTank();;
        log.i("rotate tank to: " + msg.rotateTankWithSpeed);
        tank.rotateWithSpeed(msg.rotateTankWithSpeed * settings.get('game.rules.rotationSpeed', 45));
    });

    client.on('rotateTurretWithSpeed', function(msg) {
        var tank = self.getTank();
        log.i("Rotate turret with speed: " + msg.rotateTurretWithSpeed);
        tank.turret.rotateWithSpeed(msg.rotateTurretWithSpeed * settings.get('game.rules.turretRotationSpeed', 35));
    });

    client.on('fire', function() {
        var tank = self.getTank();
        var direction = tank.degreesOnCircle(tank.direction + tank.turret.direction);
        self.emit('tankFiredInDirection', tank, direction);
    });
};

Player.prototype.isAlive = function() {
    var self = this;
    var isClientInGame = self.client.state == ClientState.InGame;
    return (self.getTank().hp > 0 && isClientInGame);
};

Player.prototype.getTank = function() {
    var self = this;
    return self.units[0];
};

Player.prototype.registerMessageValidators = function(client) {
    var self = this;

    messageCenter.registerMessageForClient(client, 'moveForwardWithSpeed', ClientChannel.DOWN, ClientState.InGame,
        function(msg) {
            new Validator(msg)
                .doThis(isAliveValidator(self), 'YouDied')
                .shouldBeInRange('moveForwardWithSpeed', 0.0, 1.0);
        });

    messageCenter.registerMessageForClient(client, 'moveBackwardWithSpeed', ClientChannel.DOWN, ClientState.InGame,
        function(msg) {
            new Validator(msg)
                .doThis(isAliveValidator(self), 'YouDied')
                .shouldBeInRange('moveBackwardWithSpeed', 0.0, 1.0);
        });

    messageCenter.registerMessageForClient(client, 'stop', ClientChannel.DOWN, ClientState.InGame,
        function(msg) {
            new Validator(msg)
                .doThis(isAliveValidator(self), 'YouDied')
                .shouldBeOneOfThese('stop', ['moving', 'tankRotation', 'turretRotation']);
        });

    messageCenter.registerMessageForClient(client, 'rotateTankWithSpeed', ClientChannel.DOWN, ClientState.InGame,
        function(msg) {
            new Validator(msg)
                .doThis(isAliveValidator(self), 'YouDied')
                .shouldBeInRange('rotateTankWithSpeed', -1.0, 1.0);
        });

    messageCenter.registerMessageForClient(client, 'rotateTurretWithSpeed', ClientChannel.DOWN, ClientState.InGame,
        function(msg) {
            new Validator(msg)
                .doThis(isAliveValidator(self), 'YouDied')
                .shouldBeInRange('rotateTurretWithSpeed', -1.0, 1.0);
        });

    messageCenter.registerMessageForClient(client, 'fire', ClientChannel.DOWN, ClientState.InGame,
        function(msg) {
            new Validator(msg)
                .doThis(isAliveValidator(self), 'YouDied')
                .shouldBe('fire', 'ze missiles!');
        });
};