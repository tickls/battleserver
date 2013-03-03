/**!
 * tank
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var util                = require('util'),
    settings            = require('tickls/util/settings'),
    MovableObject       = require('./movable_object');


////////////////////
// module exports
////////////////////
module.exports = Tank;
//exports.hasUpstreamAwaitingClientWithUID = hasUpstreamAwaitingClientWithUID;


function Tank() {
    var self = this;
    Tank.super_.call(self, true, true);

    self.type = 'Tank';
    self.hp = settings.get("game.rules.hp", 100);
    self.turret = new MovableObject(false, true);
    self.size = 10;

    self.addSubObject(self.turret);
}

util.inherits(Tank, MovableObject);



