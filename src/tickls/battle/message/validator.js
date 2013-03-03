/*!
 * message_validator
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
//var sys                 = require('sys');

/**
 * Module exports
 */
module.exports = Validator;


function Validator(message) {
    var self = this;

    if(typeof(message) != 'function') {
        self.message = message;
    }
    else {
        self.validateFunc = func;
    }
}

////////////////////
// methods
////////////////////

/**
 *
 * @param path
 * @param value If value is set (this being true or false) than the given path won't be used to retreive the value to
 * check, but the check is done on the given value. This is usefull to do custom value asserts of values that are not
 * properties of the message. Get it? ;P The given path is in this case 'virtual'.
 * @return {*}
 */
Validator.prototype.shouldBeTrue = function(path, value) {
    var self = this;

    if(value !== true && value !== false) {
        value = self.messageValueByPath(path); // Do 'normal' path value based check
    }

    if(value == true)
        return self;

    self.throwValidationException('InvalidValueError', path);
};

Validator.prototype.shouldBeFalse = function(path, value) {
    var self = this;

    if(value !== true && value !== false) {
        value = self.messageValueByPath(path); // Do 'normal' path value based check
    }

    if(value == false)
        return self;

    log.e("value: " + value + " in path: " + path + " is not false");

    self.throwValidationException('InvalidValueError', path);
};

Validator.prototype.shouldBeUndefined = function(path, value) {
    var self = this;

    if(value !== true && value !== false) {
        value = self.messageValueByPath(path); // Do 'normal' path value based check
    }

    if(value == false)
        return self;

    self.throwValidationException('InvalidValueError', path);
};

Validator.prototype.shouldBeLongerThan = function(path, count) {
    var self = this;
    var str = self.messageValueByPath(path);

    if(str) {
        if(str.length > count)
            return self;
    }

    self.throwValidationException('InvalidValueError', path);
};

Validator.prototype.shouldBeExactOfLength = function(path, length) {
    var self = this;
    var str = self.messageValueByPath(path);

    if(str) {
        if(str.length == length)
            return self;
    }

    self.throwValidationException('InvalidValueError', path);
};

Validator.prototype.shouldBe = function(path, value) {
    var self = this;
    var str = self.messageValueByPath(path);

    if(str) {
        if(str == value)
            return self;
    }

    self.throwValidationException('InvalidValueError', path);
};

Validator.prototype.shouldBeInRange = function(path, min, max) {
    var self = this;
    var value = self.messageValueByPath(path);

    if(value) {
        if(value >= min && value <= max)
            return self;
    }

    self.throwValidationException('InvalidValueError', path);
};

Validator.prototype.shouldBeAtLeast = function(path, min) {
    var self = this;
    var value = self.messageValueByPath(path);

    if(value) {
        if(value >= min)
            return self;
    }

    self.throwValidationException('InvalidValueError', path);
};

Validator.prototype.shouldBeOneOfThese = function(path, oneOfThese) {
    var self = this;
    var value = self.messageValueByPath(path);

    for(var item in oneOfThese) {
        if(oneOfThese[item] == value)
            return self;
    }

    self.throwValidationException('InvalidValueError', path);
};

Validator.prototype.doThis = function(doIt, errorMsg) {
    var self = this;

    if(doIt()) {
        return self;
    }

    self.throwValidationException('InvalidValueError', errorMsg);
};

Validator.prototype.throwValidationException = function(name, message) {
    throw {
        name: name,
        message: ((message != undefined) ? message : name) // Duplicate name as message if message has not been set
    };
};

// See if we can inject this method into the default object somehow
Validator.prototype.messageValueByPath = function(path, defaultValue) {
    var self = this;

    var nodes = path.split('.');
    var value = {};

    for(var depth = 0; depth < nodes.length; depth++) {
        var nodeKey = nodes[depth];

        if(depth == 0 && self.message[nodeKey]) {
            value = self.message[nodeKey];
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
