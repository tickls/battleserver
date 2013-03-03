/*!
 * constants
 *
 * http://stackoverflow.com/questions/8595509/how-do-you-share-constants-in-nodejs-modules
 * Copyright(c) 2013 tickls <tickls.nl>
 * MIT Licensed
 */
global.define = function ( name, value, exportsObject )
{
    if ( !exportsObject )
    {
        if ( exports.exportsObject )
            exportsObject = exports.exportsObject;
        else
            exportsObject = exports;
    }
    
    Object.defineProperty( exportsObject, name, {
                          'value': value,
                          'enumerable': true,
                          'writable': false,
                          });
}

exports.exportObject = null;