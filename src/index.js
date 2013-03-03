/**!
 * moveable_object
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */


/**
 * Module dependencies.
 */
var settings    = require('tickls/util/settings');
var log         = require('tickls/util/logger');
var Server      = require('tickls/battle/server');

log.write('');
log.write('#red[*** Battle RoAIe Server #green[' + settings.get('server.version') + '] ***]');
log.write('#red[*** Protocol Version #green[' + settings.get('server.protocolVersion') + '] ***]');
log.write('');

log.i('Starting server...');

new Server().start();
