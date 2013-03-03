/*!
 * message_validator
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var log = require('tickls/util/logger');


/**
 * Module exports
 */
exports.parse = parse;


function parse(str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    }
    catch(e) {
        return false;
    }
}