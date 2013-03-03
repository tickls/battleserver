/*!
 * message_validator
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
    jsonParser          = require('tickls/util/json_parser'),
    Client              = require('./client'),
    messageCenter       = require('tickls/battle/message/message_center'),
    message             = require('tickls/battle/message/message'),
    Validator           = require('tickls/battle/message/validator'),
    ClientState         = require('tickls/battle/client/client_state'),
    ClientChannel       = require('tickls/battle/client/client_channel');


////////////////////
// module exports
////////////////////
exports.startAcceptingClients = startAcceptingClients;
//exports.hasUpstreamAwaitingClientWithUID = hasUpstreamAwaitingClientWithUID;

var acceptorInstance;
var upstreamAwaitingClients = {};

function ClientAcceptor() {
    var self = this;

    events.EventEmitter.call(self);

    if(false === (self instanceof ClientAcceptor)) {
        return new ClientAcceptor();
    }
}


sys.inherits(ClientAcceptor, events.EventEmitter);

ClientAcceptor.super_ = events.EventEmitter;
ClientAcceptor.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value: ClientAcceptor,
        enumerable: false
    }
});

function startAcceptingClients() {
    var acceptor = new ClientAcceptor();

    if(acceptorInstance) {
        log.w("An ClientAcceptor instance is already active");
        // TODO: shutdown existing
    }
    acceptorInstance = acceptor;
    acceptor.startListening();
    return acceptor;
}


////////////////////
// Register the messages we can process
////////////////////


////////////////////
// vars
////////////////////

////////////////////
// methods
////////////////////

ClientAcceptor.prototype.startListening = function() {
    var self = this;

    var downstreamPort = settings.get('server.clientDownstreamPort', 1359);
    var upstreamPort = settings.get('server.clientUpstreamPort', 1360);
    var retryInterval = settings.get('server.portInUseRetryInterval', 5) * 1000;
    
    log.i('Start listening on downstream channel port #magenta[' + downstreamPort + ']...');

    var downstreamServer = net.createServer(self.handleDownstreamClientConnected)
        .on('error', function (e) {
            if (e.code == 'EADDRINUSE') {
                log.e('Downstream port #magenta[' + downstreamPort + '] in use, retrying...');
                setTimeout(function () {
                    //downstreamServer.close();
                    downstreamServer.listen(downstreamPort);
                }, retryInterval);
            }
        })
        .listen(downstreamPort);

    var upstreamServer = net.createServer(self.handleUpstreamClientConnected)
        .on('error', function (e) {
            if (e.code == 'EADDRINUSE') {
                log.e('Upstream port #magenta[' + upstreamPort + '] in use, retrying...');
                setTimeout(function () {
                    //upstreamServer.close();
                    upstreamServer.listen(upstreamPort);
                }, retryInterval);
            }
        })
        .listen(upstreamPort);


    log.i('Start listening on upstream channel port #magenta[' + upstreamPort + ']...');

}


ClientAcceptor.prototype.handleDownstreamClientConnected = function (socket) {

    log.i('Client connected on downstream channel');

    var client = Client.create(socket);

    messageCenter.registerMessageForClient(client, 'connect', ClientChannel.DOWN, ClientState.AwaitWelcome,
        function(msg) {
            new Validator(msg)
                .shouldBeLongerThan("connect.asUser", 3);
        },
        false); // Don't send ACK response on this message

    client.on('downstreamAccepted', function(c) {
        log.i("Accepted client downstream (UID: #magenta[" + client.UID + "] name: #green[" + client.username + "])");
        upstreamAwaitingClients[client.UID] = client;
    })
    .on('upstreamAccepted', function(client) {
        log.i("Accepted client upstream (UID: #magenta[" + client.UID + "] name: #green[" + client.username + "])");
        acceptorInstance.emit('acceptedClient', client);
    })
    .on('connect', function(msg, channel) {
        client.username = msg.connect.asUser;
        client.tankColor = msg.connect.withTankColor;
        client.protocolVersion = msg.connect.usingProtocolVersion;

        var acceptMessage = {
            connectionAccepted: {
                forUser: msg.connect.asUser,
                withUID: client.UID
            }
        };

        client.writeMessageToDownstreamChannel(acceptMessage, function() {
            client.state = ClientState.AwaitUpstream;
            client.emit('downstreamAccepted', client);
        });
    });
}

ClientAcceptor.prototype.handleUpstreamClientConnected = function(socket) {
    var self = this;
    
    log.i('Client connected on upstream channel');

    // Surpass the message center parsing/validating facilities for once because we're not yet bound to a client
    socket.once('data', function(data) {
        log.v("Received data: " + data);

        var msg = message.parse(data);

        try {
            new Validator(msg)
                .shouldBeInRange('connect.asUserWithUID', 10000000, 999999999)
                .shouldBeFalse('connect.asUserWithUID', upstreamAwaitingClients[msg.connect.asUserWithUID] == undefined);

            var client = upstreamAwaitingClients[msg.connect.asUserWithUID];

            client.setUpstreamSocket(socket);
        }
        catch(e) {
            var errorMsg = message.errorMessageFromException(e);
            socket.write(errorMsg.toString(), 'utf8', function() {
                log.w("Client upstream connected rejected, closing connection: " + e.toString());
                socket.end();
            });
        }
    });
}
