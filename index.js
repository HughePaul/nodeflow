'use strict';

const NodeFlow = require('./nodeflow');

module.exports = function (fn) {
    return new NodeFlow(null).do(fn);
};
