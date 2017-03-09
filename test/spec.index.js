'use strict';

const index = require('../');
const NodeFlow = require('../nodeflow');

describe('nodeflow index', () => {
    it('should be a function', () => {
        index.should.be.a('function');
    });

    it('should return an instance of NodeFlow', () => {
        index().should.be.an.instanceOf(NodeFlow);
    });

    it('should set the first function if supplied', () => {
        let fn = () => {};
        index(fn)._do.should.equal(fn);
    });
});
