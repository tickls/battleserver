/**!
 * map
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var sylvester = require('sylvester'),
    Vector = sylvester.Vector;



/**
 * Module exports
 */
module.exports = Map;
//exports.hasUpstreamAwaitingClientWithUID = hasUpstreamAwaitingClientWithUID;

function Map(mapSize) {
    var self = this;

    if(false === (self instanceof Map)) {
        return new Map();
    }

    if(mapSize) {
        self.size = mapSize;
    }
    else {
        self.size = {
            width: 10.0,
            height: 10.0
        };
    }
}

/**
 * Sets the position of the given units
 * @param units An array containing the units (of type GameObject) to place on the map
 */
Map.prototype.spawnUnits = function(units) {
    var self = this;
    var mapSize = $V([self.size.width, self.size.height]);

    for(var unit in units) {
        // Calculate random position on map
        var randPos = Vector.Random(2);

        // TODO: Bug in Vector lib (or using it wrong?), doesn't seem to work:/ at some point the elements in the array become a 'number' value
        //var position = randPos.multiply(mapSize);
        var position = $V([0,0]);// $V([randPos.elements[0] * mapSize.elements[0], randPos.elements[1] * mapSize.elements[1]]);

        units[unit].position = position;
    }
};

Map.prototype.positionIsOutsideMap = function(position) {
    var self = this;

    var x = position.elements[0];
    var y = position.elements[1];

    if(x >= 0 && x <= self.size.width && y >= 0 && y <= self.size.height) {
        return false;
    }

    return true;
};
