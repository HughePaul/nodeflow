'use strict';

const NodeFlow = require('../nodeflow');

describe('NodeFlow', () => {
    it('should be a class', () => {
        NodeFlow.should.be.a('function');
    });

    describe('#constructor', () => {
        it('should set up an empty set of internal data', () => {
            let f = new NodeFlow();
            f._first.should.equal(f);
            f._catch.should.be.an('array').and.be.empty;
            f._finally.should.be.an('array').and.be.empty;
            f._labels.should.deep.equal([{}]);
        });

        it('should inherit internal data from a previous flow', () => {
            let prev = {
                _first: {},
                _catch: {},
                _finally: {},
                _labels: []
            };
            let f = new NodeFlow(prev);
            f._first.should.equal(prev._first);
            f._catch.should.equal(prev._catch);
            f._finally.should.equal(prev._finally);
            f._labels.should.deep.equal(prev._labels);
        });
    });

    describe('#_mergeArrays', () => {
        it('should synchronise content of the two arrays', () => {
            let f = new NodeFlow();
            let a = [1, 2, 3, 4];
            let b = [3, 2, 5, 7];
            f._mergeArrays(a, b);
            a.should.deep.equal([1, 2, 3, 4, 5, 7]);
            b.should.deep.equal([3, 2, 5, 7, 1, 4]);
            a.should.not.equal(b);
        });
    });

    describe('#_setFn', () => {
        let f;
        beforeEach(() => {
            f = new NodeFlow();
        });

        it('should create a new NodeFlow and add it as a function type', () => {
            f._setFn('__test__', 'func');
            f.__test__.should.be.an.instanceOf(NodeFlow);
        });

        it('should set the do function of the new NodeFlow', () => {
            f._setFn('__test__', 'func');
            f.__test__._do.should.equal('func');
        });

        it('should return the new NodeFlow', () => {
            let newFlow = f._setFn('__test__', 'func');
            newFlow.should.not.equal(f);
            newFlow.should.be.an.instanceOf(NodeFlow);
            newFlow.should.equal(f.__test__);
        });

        it('should set a given NodeFlow as a function type', () => {
            let branchFlow = new NodeFlow();
            f._setFn('__test__', branchFlow);
            f.__test__.should.equal(branchFlow);
        });

        it('should return the given NodeFlow', () => {
            let branchFlow = new NodeFlow();
            let newFlow = f._setFn('__test__', branchFlow);
            newFlow.should.not.equal(f);
            newFlow.should.equal(branchFlow);
        });

        it('should merge the labels of the two flows', () => {
            let branchFlow = new NodeFlow();
            let labelsA = {a:1, b:2};
            let labelsB = {c:3, d:4};
            let labelsC = {e:5, f:6};
            f._labels = [labelsA, labelsC];
            branchFlow._labels = [labelsB, labelsC];

            f._setFn('__test__', branchFlow);

            f._labels.should.deep.equal([labelsA, labelsC, labelsB]);
            branchFlow._labels.should.deep.equal([labelsB, labelsC, labelsA]);
        });
    });

    describe('#_setBranch', () => {
        let f, b;
        beforeEach(() => {
            f = new NodeFlow();
            b = new NodeFlow();
            sinon.stub(NodeFlow.prototype, '_setFn').returns(b);
        });

        afterEach(() => {
            NodeFlow.prototype._setFn.restore();
        });

        it('should create a branch and set the return flow', () => {
            f._setBranch('__test__', 'func');
            NodeFlow.prototype._setFn.should.have.been.calledWithExactly('__test__', 'func');
            b._return.should.equal(f);
        });

        it('should return the original flow', () => {
            let newFlow = f._setBranch('__test__', 'func');
            newFlow.should.equal(f);
        });
    });

    describe('#_doCatch', () => {
        let f, context, err;
        beforeEach(() => {
            f = new NodeFlow();
            context = {};
            err = new Error;
        });

        it('should throw the error if there are no catchers', () => {
            expect(() => f._doCatch(err, context)).to.throw(err);
        });

        it('should not throw if catchers are available', () => {
            f._catch = [ sinon.stub() ];
            expect(() => f._doCatch(err, context)).to.not.throw();
        });

        it('should call each catcher with the error', () => {
            let catcher1 = sinon.stub();
            let catcher2 = sinon.stub();
            f._catch = [ catcher1, catcher2 ];

            f._doCatch(err, context);

            catcher1.should.have.been.calledWithExactly(err);
            catcher2.should.have.been.calledWithExactly(err);
            catcher1.should.have.been.calledBefore(catcher2);
            catcher1.should.have.been.calledOn(context);
            catcher2.should.have.been.calledOn(context);
        });

    });

    describe('#_doFinally', () => {
        it('should call each finally with the value', () => {
            let finally1 = sinon.stub();
            let finally2 = sinon.stub();

            let f = new NodeFlow();
            let context = {};
            f._finally = [ finally1, finally2 ];

            f._doFinally(1234, context);

            finally1.should.have.been.calledWithExactly(1234);
            finally2.should.have.been.calledWithExactly(1234);
            finally1.should.have.been.calledBefore(finally2);
            finally1.should.have.been.calledOn(context);
            finally2.should.have.been.calledOn(context);
        });

    });
});

    describe('#_run', () => {
        let f, context;
        beforeEach(() => {
            f = new NodeFlow();
            context = {};
            sinon.stub(NodeFlow.prototype, '_result');
        });

        afterEach(() => {
            NodeFlow.prototype._result.restore();
        })

        it('should call _result if there is no _do function', () => {
            f._run(1234, context);
            NodeFlow.prototype._result.should.have.been.calledWithExactly(null, 1234, context);
        });

        it('should run _do function and call _result with return value', () => {
            f._do = sinon.stub().returns(5678);
            f._run(1234, context);
            f._do.should.have.been.calledWithExactly(1234);
            f._do.should.have.been.calledOn(context);
            NodeFlow.prototype._result.should.have.been.calledOnce;
            NodeFlow.prototype._result.should.have.been.calledWithExactly(null, 5678, context);
        });

        it('should call _result with an error thrown from the _do function', () => {
            let err = new Error;
            f._do = sinon.stub().throws(err);
            f._run(1234, context);
            f._do.should.have.been.calledWithExactly(1234);
            f._do.should.have.been.calledOn(context);
            NodeFlow.prototype._result.should.have.been.calledOnce;
            NodeFlow.prototype._result.should.have.been.calledWithExactly(err, null, context);
        });

        it('should call the _do function asynchronously if it has 2 args', () => {
            let fn = sinon.stub().yields(null, 5678);
            f._do = (a, b) => fn(a, b);
            f._run(1234, context);
            fn.should.have.been.calledWithExactly(1234, sinon.match.func);
            NodeFlow.prototype._result.should.have.been.calledOnce;
            NodeFlow.prototype._result.should.have.been.calledWithExactly(null, 5678, context);
        });
    });
