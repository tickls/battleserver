/*!
 * message_validator
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var log         = require('tickls/util/logger'),
    message     = require('tickls/battle/message/message');


/**
 * Module exports
 */
exports.registerMessageForClient = registerMessageForClient;
exports.handleClientMessage = handleClientMessage;


var messageHandlers = {};



function registerMessageForClient(client, msgKey, channel, state, validationFunc, sendAck) {
    log.v("Registering message '#magenta[" + msgKey + "]' for channel: #magenta[" + channel + "] in state #magenta[" + state + "]");

    if(!messageHandlers[client.UID]) {
        messageHandlers[client.UID] = {};
    }

    if(!messageHandlers[client.UID][channel]) {
        messageHandlers[client.UID][channel] = {};
    }

    if(!messageHandlers[client.UID][channel][state]) {
        messageHandlers[client.UID][channel][state] = {};
    }

    if(sendAck == undefined)
        sendAck = true;

    var messageHandler ={
        key: msgKey,
        validate: validationFunc,
        sendAck: sendAck
    };

    messageHandlers[client.UID][channel][state][msgKey] = messageHandler;
};


function handleClientMessage(client, channel, msg) {

    var messageHandler = handlerForMessageFromClient(client, msg, channel, client.state);

    if(messageHandler) {

        var response;

        try {
            messageHandler.validate(msg, client.state);
            client.emit(msg._key, msg, channel);
        }
        catch(errorMessage) {
            log.d("Validation error");
            response = {};
            response[errorMessage.name] = errorMessage.message;
        }

        if(!response && messageHandler.sendAck) {
            response = message.ackForMessage(msg);
        }

        return response;
    }

    log.d("Error validating message: " + JSON.stringify(msg));
    return message.InvalidCommand;
};


function validate(message, channel, state) {

    if(message) {
        validator = validatorForMessage(message, channel, state);

        if(validator) {
            result = validator(state, message);

            return result;
        }
    }
    
    return false;
};


function handlerForMessageFromClient(client, message, channel, state) {

    if(message) {
        var clientHandlers = messageHandlers[client.UID];

        if(clientHandlers) {
            var channelHandlers = clientHandlers[channel];

            if(channelHandlers) {
                var stateHandlers = channelHandlers[state];

                if(stateHandlers) {
                    var messageHandler = stateHandlers[message._key];

                    if(messageHandler) {
                        return messageHandler;
                    }
                }
            }
        }
    }

    log.w("No validator found for message: " + message._key);
    
    return false;
};


function getMessageRootKey(message) {
    var messageKeys = Object.keys(message);
    
    // We only expect to receive one message per line
    if(messageKeys.length == 1) {
        var messageKey = messageKeys[0];
        return messageKey;
    }
    
    return false;
};