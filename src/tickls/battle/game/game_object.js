/**!
 * game
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var util                = require('util'),
    events              = require('events'),
    net                 = require('net'),
    sylvester           = require('sylvester');

////////////////////
// module exports
////////////////////
module.exports = GameObject;

var objectCount = 0;

function GameObject() {
    var self = this;
    events.EventEmitter.call(self);

    self.type = 'GameObject';
    self.UID = ++objectCount;
    self.position = $V([0,0]);
    self.size = 1;//$V([0,0]);

    self.subObjects = [];

    log.v("Created GameObject with UID: " + self.UID);
}

util.inherits(GameObject, events.EventEmitter);


GameObject.prototype.addSubObject = function(subObject) {
    var self = this;

    // TODO: How does javascript handle circular references? Will it be garbage collected
    subObject.superObj = self;

    // Compatibilty with game object structure so object mover can loop through sub objects
    self.subObjects[subObject.UID] = {
        obj: subObject
    };
};
