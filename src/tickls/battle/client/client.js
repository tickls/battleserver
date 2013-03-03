/*!
 * message_validator
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var util                = require('util'),
    events              = require('events'),
    log                 = require('tickls/util/logger'),
    messageCenter       = require('tickls/battle/message/message_center'),
    message             = require('tickls/battle/message/message'),
    ClientState         = require('tickls/battle/client/client_state'),
    ClientChannel       = require('tickls/battle/client/client_channel');


/**
 * Module exports
 */
exports.create = create;


/**
 * Constants
 */

/**
 * Client class definition
 */
function Client(downstreamSocket) {
    var self = this;

    events.EventEmitter.call(self);

    if(false === (self instanceof Client)) {
        return new Client();
    }

    self.UID = parseInt((new Number(10000000 + (Math.random() * 99999999)).toFixed(0)));
    self.username = "";
    self.tankColor = message.withTankColor;
    self.state = ClientState.AwaitWelcome;
    self.downstreamSocket = downstreamSocket;
    self.downstreamSocket.on('data', function(data) {
        var response = messageCenter.handleClientMessage(self, ClientChannel.DOWN, message.parse(data));

        if(response && response !== true) {
            self.writeMessageToDownstreamChannel(response);
        }
    })
    .on('error', function(data) {
        self.doDisconnect();
     })
    .on('end', function(data) {
        self.doDisconnect();
    });

    // This will be set later on by the client acceptor
    self.upstreamSocket = null;
}

util.inherits(Client, events.EventEmitter);



function create(downstreamSocket) {
    var client = new Client(downstreamSocket);

    return client;
}


Client.prototype.setUpstreamSocket = function(socket) {
    var self = this;

    self.upstreamSocket = socket;
    self.upstreamSocket.on('data', function(data) {
        var response = messageCenter.handleClientMessage(client, ClientChannel.UP, message.parse(data));

        if(response) {
            client.writeMessageToUpstreamChannel(response);
        }
    }).on('error', function(e) {
        self.doDisconnect();
    }).on('end', function(data) {
        self.doDisconnect();
    });


    self.emit('upstreamAccepted', self);
};


Client.prototype.handleOnDownstreamSocketData = function (data) {
    var self = this;

    log.v("#cyan[ <<< ]" + data);
    var message = Message.parse(data);

    if(messageCenter.handle() .validate(this.state, message)) {
        this.handleMessage(message);
    }
    else {
        log.e('invalid msg');
    }
};


Client.prototype.writeMessageToDownstreamChannel = function(message, callback) {
    var self = this;

    var cmdStr = JSON.stringify(message);
    log.v("#yellow[ >>> ]" + cmdStr);

    self.downstreamSocket.write(cmdStr + '\n', 'UTF8', function(data) {

        if(callback) {
            process.nextTick(function() {
                callback();
            });
        }
    });
};


Client.prototype.writeMessageToUpstreamChannel = function(message, callback) {
    var self = this;

    var cmdStr = JSON.stringify(message);
    log.v("#blue[ >>> ]" + cmdStr);

    self.upstreamSocket.write(cmdStr + '\n', 'UTF8', function(data) {
        if(callback) {
            process.nextTick(function() {
                callback();
            });
        }
    });
};

/**
 * Handle Message
 * @param message
 */
Client.prototype.handleMessage = function(message) {
    var self = this;

    switch(message._key) {
        case 'connect':
            self.handleConnectMessage(message);
            break;

        default:
            log.w("Invalid command");
            break;
    }
};

Client.prototype.handleConnectMessage = function(message) {
    var self = this;

    self.username = message.asUser;
    self.tankColor = message.withTankColor;
    self.protocolVersion = message.usingProtocolVersion;

    var acceptMessage = {
        connectionAccepted: {
            forUser: message.asUser,
            withUID: self.UID
        }
    };

    self.writeMessageToDownstreamChannel(acceptMessage, function() {
        self.setState(ClientState.AwaitUpstream);
        self.emit('downstreamAccepted', self);
    });
};


Client.prototype.setState = function(state) {
    var self = this;

    log.v("Changing client state to: #green[" + state + "]");

    var oldState = self.state;
    self.state = state;

    self.emit('changedState', self, oldState, self.state);
};


Client.prototype.doDisconnect = function(reason) {
    var self = this;

    // Check if one of the sockets is already closed
    if(self.state != ClientState.Disconnected) {
        log.w("Connection closed by foreign host");
        if(self.downstreamSocket)
            self.downstreamSocket.end();

        if(self.upstreamSocket)
            self.upstreamSocket.end();

        self.setState(ClientState.Disconnected);
        self.emit('disconnected', self);
    }
};



