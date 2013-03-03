/**!
 * movable_object
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var util                = require('util'),
    GameObject          = require('./game_object');


////////////////////
// module exports
////////////////////
module.exports = MovableObject;


function MovableObject(movable, rotatable) {
    var self = this;
    MovableObject.super_.call(self);

    self.type = 'MovableObject';

    if(movable) {
        self.isMoving = false;
        self.direction = 0;
    }

    if(rotatable) {
        self.isRotating = false;
        self.direction = 0;
    }
}

util.inherits(MovableObject, GameObject);

MovableObject.prototype.moveWithSpeed = function(speed) {
    var self = this;
    self.isMoving = true;
    self.movementSpeed = speed;
};

MovableObject.prototype.moveForwardWithSpeed = function(speed) {
    var self = this;
    self.moveWithSpeed(speed);
};

MovableObject.prototype.moveBackwardWithSpeed = function(speed) {
    var self = this;
    self.moveWithSpeed(-speed);
};

MovableObject.prototype.stopMoving = function() {
    var self = this;
    self.isMoving = false;
    self.movementSpeed = 0;
};

MovableObject.prototype.rotateWithSpeed = function(speed) {
    var self = this;
    self.isRotating = true;
    self.rotateSpeed = speed;
};

MovableObject.prototype.stopRotating = function() {
    var self = this;

    self.isRotating = false;
    self.rotateSpeed = 0;
};


/**
 * Calculates the degrees on a circle from the given absolute value. We expect the absoluteValue to be > -360 && < 720
 * @param absoluteValue
 * @return {*}
 */
MovableObject.prototype.degreesOnCircle = function(absoluteValue) {

    if(absoluteValue < 0)
        return 360 + absoluteValue;
    else if(absoluteValue > 360)
        return absoluteValue - 360;

    return absoluteValue;
}