/**!
 * tank
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var events              = require('events'),
    util                = require('util'),
    settings            = require('tickls/util/settings'),
    MovableObject       = require('./movable_object');


////////////////////
// module exports
////////////////////
module.exports = ObjectMover;
//exports.hasUpstreamAwaitingClientWithUID = hasUpstreamAwaitingClientWithUID;


function ObjectMover(map) {
    var self = this;
    events.EventEmitter.call(self);

    self.map = map;
}

util.inherits(ObjectMover, events.EventEmitter);

// TODO: Improve collision detection 'algorithm', for now this super simple radial detection thingy will dü
ObjectMover.prototype.collidesWithOneOfThese = function(object, newPos, allObjects) {

    for(var otherObjUID in allObjects) {
        var otherObj = allObjects[otherObjUID].obj;

        // ...
        if(object.UID != otherObj.UID) {
            var distance = newPos.distanceFrom(otherObj.position);
            distance = distance * 0.9;

            if(distance < object.size + otherObj.size) {
                // Collision
                return otherObj;
            }
        }
    }

    return false;
};

ObjectMover.prototype.moveObjects = function(objects, delta) {
    var self = this;

    for(var objUID in objects) {
        var gameObject = objects[objUID].obj;

        if(gameObject.isMoving != undefined && gameObject.isMoving) {
            var radians = ((gameObject.direction * Math.PI) / 180.0);
            var uv = $V([Math.cos(radians), -Math.sin(radians)]);

            uv = uv.multiply(delta * gameObject.movementSpeed);
            var newPos = gameObject.position.add(uv);
            var moveIsValid = true;

            if(self.map.positionIsOutsideMap(newPos)) {
                gameObject.stopMoving();
                self.emit('objectStoppedMoving', gameObject, 'EndOfMapReached');
            }
            else if((collisionObj = self.collidesWithOneOfThese(gameObject, newPos, objects)) !== false) {
                gameObject.stopMoving();
                self.emit('objectCollidedWithOther', gameObject, collisionObj, 'CollidedWithObject');
            }
            else {
                gameObject.position = newPos;

                var pos = gameObject.position;
                var x = gameObject.position.elements[0];
                var y = gameObject.position.elements[1];

                log.d("Object " + gameObject.UID + " is moving, position is: " + x + ", " + y);
            }
        }

        if(gameObject.isRotating != undefined && gameObject.isRotating) {
            var deltaRotation = delta * gameObject.rotateSpeed;

            log.d("Object " + gameObject.UID + " is still rotating with speed: " + deltaRotation + " direction: " + gameObject.direction);
            gameObject.direction = gameObject.degreesOnCircle(gameObject.direction + deltaRotation);
        }

        if(gameObject.subObjects.length > 0) {
            self.moveObjects(gameObject.subObjects, delta);
        }
    }
};