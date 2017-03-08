'use strict';

const NodeFlow = require('./nodeflow');

module.exports = function (fn, context) {
    let flow = new NodeFlow(null, context || this);
    return flow.do(fn);
};
