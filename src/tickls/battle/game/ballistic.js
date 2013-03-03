/**!
 * ballistic
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */


/**
 * Module dependencies.
 */
var util                = require('util'),
    log                 = require('tickls/util/logger'),
    MovableObject      = require('./movable_object');


////////////////////
// module exports
////////////////////
module.exports = Ballistic;


function Ballistic(power, speed, direction, firedByTank) {
    var self = this;
    Ballistic.super_.call(self, true, false);

    self.type = 'Ballistic';
    self.power = power;
    self.direction = direction;
    self.moveWithSpeed(speed);
    self.firedBy = firedByTank;

    log.d("New ballistic with power: " + power + " speed: " + speed + " direction: " + direction);
}

util.inherits(Ballistic, MovableObject);
