/**!
* game
* Copyright(c) 2013 tickls <tickls.nl>
* MIT Licensed
*/

/**
 * Module dependencies.
 */
var sys                 = require('sys'),
    events              = require('events'),
    net                 = require('net'),
    settings            = require('tickls/util/settings');
    log                 = require('tickls/util/logger'),
    messageCenter       = require('tickls/battle/message/message_center'),
    message             = require('tickls/battle/message/message'),
    Validator           = require('tickls/battle/message/validator'),
    ClientState         = require('tickls/battle/client/client_state'),
    ClientChannel       = require('tickls/battle/client/client_channel'),
    ObjectMover         = require('./object_mover'),
    Player              = require('./player'),
    Tank                = require('./tank'),
    Map                 = require('./map'),
    Ballistic           = require('./ballistic');



/**
 * Module exports
 */
module.exports = Game;


function Game() {
    var self = this;

    events.EventEmitter.call(self);

    if(false === (self instanceof Game)) {
        return new Game();
    }

    var mapSize = settings.get("game.map.size", { width: 1000, height: 1000 });
    self.map = new Map(mapSize);
    self.players = [];
    self.objects = [];
    self.objectMover = new ObjectMover(self.map);
    self.objectMover.on('objectStoppedMoving', function(obj,reason) { self.handleObjectStoppedMoving(obj,reason); });
    self.objectMover.on('objectStoppedRotating',function(obj,reason) { self.handleObjectStoppedRotating(obj,reason); });
    self.objectMover.on('objectCollidedWithOther',function(obj,otherObj,reason) { self.handleObjectCollision(obj,otherObj,reason); });
}

sys.inherits(Game, events.EventEmitter);

Game.super_ = events.EventEmitter;
Game.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value: Game,
        enumerable: false
    }
});


Game.prototype.start = function() {
    var self = this;

    for(var i in self.players) {
        var player = self.players[i];
        log.v("Spawning units on map");
        self.map.spawnUnits(player.units);
    }
};

Game.prototype.end = function() {
    // Nothing to do for now
    var self = this;

    delete self.players;
    delete self.objects;
};


Game.prototype.addPlayer = function(player) {
    var self = this;

    // Create player and add Tank
    var tank = new Tank();
    player.addUnit(tank);

    player.on('tankFiredInDirection', function(tank, direction) {
        log.e("Fire tank in direction: " + direction);

        var power = settings.get('game.rules.ballisticDamage', 20);
        var ballisticSpeed = settings.get('game.rules.ballisticsTravelSpeed', 100);
        var ballistic = new Ballistic(power, ballisticSpeed, direction, tank);

        self.objectBelongsToPlayer(ballistic, player);
    });

    self.players.push(player);
    self.objectBelongsToPlayer(tank, player);


    var testUnit = new Tank();
    testUnit.position = $V([200, 0]);
    self.objectBelongsToPlayer(testUnit, player);
};


Game.prototype.objectBelongsToPlayer = function(obj, player) {
    var self = this;

    self.objects[obj.UID] = {
        obj: obj,
        belongsToPlayer: player
    };
};

Game.prototype.ownerForObject = function(obj) {
    var self = this;

    if(self.objects[obj.UID]) {
        return (self.objects[obj.UID].belongsToPlayer);
    }

    if(obj.superObj) {
        return self.ownerForObject(obj.superObj);
    }

    log.e("Object with UID: #magenta[" + obj.UID + "] has no owner. This shouldn't happen :/");

    return null;
};

Game.prototype.tick = function(delta) {
    var self = this;

    self.objectMover.moveObjects(self.objects, delta);
};


/**
 * Object event handlers
 */
Game.prototype.handleObjectStoppedMoving = function(object, reason) {
    var self = this;

    if(object.type != 'Ballistic') {
        var player = self.ownerForObject(object);
        var client = player.client;

        var response = message.stoppedMoving(object.position, reason);
        client.writeMessageToUpstreamChannel(response);

        log.v("Object with type: " + object.type + " UID: " + object.UID + " stopped moving, owner is: #green[" + player.client.username + "]");
    }
};


Game.prototype.handleObjectStoppedRotating = function(object) {
    var self = this;

    var player = self.ownerForObject(object);
    log.i("Object with UID: " + object.UID + " stopped rotating, owner is: #green[" + player.client.username + "]");
};


Game.prototype.handleObjectCollision = function(obj, otherObj, reason) {
    var self = this;

    // TODO: Hmm.. not liking this
    if(obj.type == 'Ballistic' && otherObj.type == 'Tank') {
        self.tankIsHitByBallistic(otherObj, obj);
    }
    else if(obj.type == 'Tank' && otherObj.type == 'Ballistic') {
        self.tankIsHitByBallistic(obj, otherObj);
    }
    else {
        log.d("Object #magenta[" + obj.UID + "] collided with object #magenta[" + otherObj.UID + "]");

        self.handleObjectStoppedMoving(obj, 'CollidedWithOtherObject');
    }
};


Game.prototype.tankIsHitByBallistic = function(tank, ballistic) {
    var self = this;
    var player = self.ownerForObject(tank);
    var firedByPlayer = self.ownerForObject(ballistic.firedBy);

    log.d("Tank with UID: #magenta[" + tank.UID + "] was hit by ballistic fired by player: #green[" + firedByPlayer.client.username + "]");

    if(player.isAlive()) {
        tank.hp -= ballistic.power;

        if(tank.hp > 0) {
            player.client.writeMessageToUpstreamChannel(message.gotHitBy(firedByPlayer, tank.hp));
            firedByPlayer.client.writeMessageToUpstreamChannel(message.hit(player));
        }
        else {
            tank.hp = 0;

            player.client.writeMessageToUpstreamChannel(message.gotKilledBy(firedByPlayer));
            firedByPlayer.client.writeMessageToUpstreamChannel(message.killed(player));
            var playersAlive = self.playersAlive();

            if(playersAlive.length == 1) {
                var winner = self.firstPlayerAlive();
                self.emit('gameEndedWithWinner', winner);
            }
            else if(self.areAnyPlayersAlive == 0) {
                self.emit('allPlayersDied');
            }
        }
    }
    else {
        log.d("Object belongs to a player who's not alive");
    }
};


Game.prototype.areAnyPlayersAlive = function() {
    var self = this;

    for(var player in self.players) {
        if(player.isAlive())
            return true;
    }

    return false;
};

Game.prototype.playersAlive = function() {
    var self = this;
    var count = 0;

    for(var i in self.players) {
        var player = self.players[i];
        if(player.isAlive())
            count++;
    }

    return count;
};

Game.prototype.firstPlayerAlive = function() {
    var self = this;

    for(var player in self.players) {
        if(player.isAlive())
            return player;
    }
    return null;
};
