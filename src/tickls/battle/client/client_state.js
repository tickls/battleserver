/*!
 * Client State constants
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */

/**
 * Module exports
 */
exports.ClientState = this;

/**
 * Constants
 */
define('AwaitWelcome', 'ClientStateAwaitWelcome', this);
define('AwaitUpstream', 'ClientStateAwaitUpstream', this);

define('InLobby', 'ClientStateInLobby', this);
define('InGame', 'ClientStateInGame', this);

define('Disconnected', 'ClientStateDisconnected', this);