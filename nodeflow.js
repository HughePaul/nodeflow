'use strict';

class NodeFlow {
    constructor(prev, context) {
        this._first = this;
        this._catch = [];
        this._finally = [];
        this._context = context || this;
        if (prev) {
            this._prev = prev;
            this._first = prev._first;
            this._catch = prev._catch;
            this._finally = prev._finally;
            this._context = prev._context;
        }
    }

    _setFn(type, fn) {
        if (fn instanceof NodeFlow) {
            this[type] = fn._first;
        } else {
            this[type] = new NodeFlow(this).do(fn);
        }
        return this[type];
    }

    _setBranch(type, fn) {
        let branch = this._setFn(type, fn);
        branch._return = this;
        return this;
    }

    _doCatch(err) {
        if (!this._catch.length) throw err;
        this._catch.forEach(fn => {
            fn.call(this._context, err);
        });
    }

    _doFinally(result) {
        this._finally.forEach(fn => {
            fn.call(this._context, result);
        });
    }

    _run(value) {
        if (!this._do) {
            return this._result(null, value);
        }
        let result;
        try {
            result = this._do.call(this._context, value, this._result.bind(this));
        } catch (e) {
            return this._result(e);
        }
        if (this._do.length < 2) {
            this._result(null, result);
        }
    }

    _result(err, result) {
        let next;
        if (result && this._yes) {
            next = this._yes;
        }
        if (!result && this._no) {
            next = this._no;
        }

        this._doNext(err, result, next);
    }

    _doNext(err, result, next) {
        next = next || this._next;

        if (err) {
            this._doCatch(err);
        } else if (next) {
            return next._run(result);
        }

        this._doFinally(result);

        if (!next && this._return) {
            this._return._doNext(err, result);
        }
    }

    do(fn) {
        if (this._do || fn instanceof NodeFlow) {
            return this._setFn('_next', fn);
        }
        this._do = fn;
        return this;
    }

    yes(fn) {
        return this._setBranch('_yes', fn);
    }

    no(fn) {
        return this._setBranch('_no', fn);
    }

    catch(fn) {
        this._catch.push(fn);
        return this;
    }

    finally(fn) {
        this._finally.push(fn);
        return this;
    }

    run(value) {
        this._first._run(value);
        return this;
    }
}

NodeFlow.prototype.then = NodeFlow.prototype.do;
NodeFlow.prototype.if = NodeFlow.prototype.do;
NodeFlow.prototype.question = NodeFlow.prototype.do;

module.exports = NodeFlow;
