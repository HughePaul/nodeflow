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

    it('should set the context if supplied', () => {
        let context = {};
        index(null, context)._context.should.equal(context);
    });

    it('should use the running context if a context argument isnt supplied', () => {
        let context = {};
        index.call(context)._context.should.equal(context);
    });
});
