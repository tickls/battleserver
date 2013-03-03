/*!
 * message_validator
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var fs = require('fs'),
    colorize = require('colorize');

var settingsFilename = "battleconf.json";
var settings = {};
var contents;

try {
    contents = fs.readFileSync(settingsFilename);
    var settingsFromFile = JSON.parse(contents);

    if(settingsFromFile) {
        settings = settingsFromFile;
    }
}
catch(e) {
    var errStr = "Could not load settings from file '#magenta[" + settingsFilename + "]', falling back to defaults. Reason:";
    var reason = "";

    if('ENOENT' == e.code) {
        reason = "File not found";
    }
    else {
        reason = "Config parse error";
    }
    // Write to log directly because logger depends on the settings so we can not use it here, require inception
    console.log(colorize.ansify("#red[" + errStr + "] #yellow[" + reason + "]"));
}

settings.get = function(path, defaultValue) {

    var nodes = path.split('.');
    var value = {};

    for(var depth = 0; depth < nodes.length; depth++) {
        var nodeKey = nodes[depth];

        if(depth == 0 && settings[nodeKey]) {
            value = settings[nodeKey];
        }
        else if(value[nodeKey]) {
            value = value[nodeKey];
        }
        else {
            value = null;
            break;
        }
    }

    if(value)
        return value;

    return defaultValue;
};

/**
 * Module exports
 */
module.exports = settings;
