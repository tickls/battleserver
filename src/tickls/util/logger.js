/*!
 * message_validator
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var colorize = require('colorize');
var settings = require('tickls/util/settings');


var LOG_LEVEL_DEFAULT   = 0;
var LOG_LEVEL_VERBOSE   = 1;
var LOG_LEVEL_DEBUG     = 2;
var LOG_LEVEL_INFO      = 3;
var LOG_LEVEL_WARNING   = 4;
var LOG_LEVEL_ERROR     = 5;


function Logger() {
    var self = this;
    self.logLevel = settings.get('server.logLevel', 3);
}

/**
 * @param str The (colored) data to log
 */
Logger.prototype.write = function(str) {
    console.log(colorize.ansify(str));
};

/**
 * @param data The (colored) data to log
 */
Logger.prototype.writePlain = function(str) {
    console.log(str);
};

Logger.prototype.v = function(str) {
    if(this.logLevel <= LOG_LEVEL_VERBOSE) {
        this.writePlain("[" + colorize.ansify('#bold[#blue[VERBOSE]]') + "] " + colorize.ansify(str));
    }
};

Logger.prototype.d = function(str) {
    if(this.logLevel <= LOG_LEVEL_DEBUG) {
        this.writePlain(" [" + colorize.ansify('#bold[#green[DEBUG]]') + "] " + colorize.ansify(str));
    }
};

Logger.prototype.i = function(str) {
    if(this.logLevel <= LOG_LEVEL_INFO) {
        this.writePlain("   [" + colorize.ansify('#bold[#cyan[INFO]]') + "] " + colorize.ansify(str));
    }
};

Logger.prototype.w = function(str) {
    if(this.logLevel <= LOG_LEVEL_WARNING) {
        this.writePlain("[" + colorize.ansify('#bold[#yellow[WARNING]]') + "] " + colorize.ansify(str));
    }
};

Logger.prototype.e = function(str) {
    if(this.logLevel <= LOG_LEVEL_ERROR) {
        this.writePlain("  [" + colorize.ansify('#bold[#red[ERROR]]') + "] " + colorize.ansify(str));
    }
};


/**
 * Module exports
 */
var loggerInstance = new Logger();
module.exports = loggerInstance;
