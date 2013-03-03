/*!
 * message_validator
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var log                 = require('tickls/util/logger'),
    settings            = require('tickls/util/settings'),
    jsonParser          = require('tickls/util/json_parser');


/**
 * Module exports
 */
// Parse method
exports.parse = parse;
exports.protocolVersion = "0.4.0";


// Errors
exports.ackForMessage = ackForMessage;
exports.errorWithReason = errorWithReason;
exports.errorMessageFromException = errorMessageFromException;
exports.InvalidValueError = errorWithReason('InvalidValue');
exports.InvalidCommand = errorWithReason('InvalidCommand');


// Connection messages
exports.welcome = welcome;
exports.stoppedMoving = stoppedMoving;
exports.gotKilledBy = gotKilledBy;
exports.killed = killed;
exports.gotKilledBy = gotKilledBy;
exports.hit = hit;
exports.gotHitBy = gotHitBy;
exports.gameWillStartIn = gameWillStartIn;


function parse(data) {

    var obj;

    if(data) {
        obj = jsonParser.parse(data);

        if(obj) {
            if(Object.keys(obj).length == 1) {
                rootKey = getObjRootKey(obj);

                if(rootKey) {
                    var message = {};
                    message[rootKey] = obj[rootKey];
                    message._key = rootKey;

                    return message;
                }
            }
            else {
                log.w("Message data contains more than 1 message, ignoring");
            }
        }
    }

    return null;
}

function getObjRootKey(obj) {
    var messageKeys = Object.keys(obj);

    // We only expect to receive one message per line
    if(messageKeys.length == 1) {
        var messageKey = messageKeys[0];
        return messageKey;
    }

    return false;
}

function ackForMessage(msg) {
    return {
        ack: msg._key
    };
}

function errorMessageFromException(e) {
    return {
        error: {
            withReason: e.name
        }
    };
}

function errorWithReason(reason) {
    return {
        error: {
            withReason: reason
        }
    };
}

function welcome(gameState, playerNames) {
    return {
        welcomeToGame: {
            withState: gameState,
            rules: settings.get("game.rules"),
            currentPlayers: playerNames
        }
    };
}

function gameWillStartIn(delay, playerNames, map, obstacles) {
    return {
        gameWillStart: {
            in: delay,
            withPlayers: playerNames,
            onMap: {
                withSize: {
                    width: map.size.width,
                    height: map.size.height
                },
                havingObstacles: (obstacles != undefined ? obstacles : [])
            }
        }
    }
}

function stoppedMoving(position, reason) {
    return {
        stoppedMoving: {
            atPosition: {
                x: position.elements[0],
                y: position.elements[1]
            },
            reason: reason
        }
    };
}

function gotKilledBy(player) {
    return {
        gotKilled: {
            byUser: player.client.username
        }
    };
}

function killed(player) {
    return {
        killed: {
            user: player.client.username
        }
    };
}

function gotHitBy(player, hp) {
    return {
        tankIsHitByBallistic: {
            fireByUser: player.client.username,
            hpLeft: hp
        }
    };
}

function hit(player) {
    return {
        ballisticHitTank: {
            ofUser: player.client.username
        }
    };
}