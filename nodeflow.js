'use strict';

class NodeFlow {
    constructor(prev) {
        if (prev) {
            this._prev = prev;
            this._first = prev._first;
            this._catch = prev._catch;
            this._finally = prev._finally;
            this._labels = prev._labels;
        } else {
            this._first = this;
            this._catch = [];
            this._finally = [];
            this._labels = [{}];
        }
    }

    _mergeArrays(a, b) {
        let i;
        for (i of a) {
            if (b.indexOf(i) === -1) {
                b.push(i);
            }
        }
        for (i of b) {
            if (a.indexOf(i) === -1) {
                a.push(i);
            }
        }
    }

    _setFn(type, fn) {
        if (fn instanceof NodeFlow) {
            this[type] = fn._first;
            this._mergeArrays(this._labels, fn._labels);
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

    _doCatch(err, context) {
        if (!this._catch.length && !this._return) throw err;
        this._catch.forEach(fn => {
            fn.call(context, err);
        });
    }

    _doFinally(result, context) {
        this._finally.forEach(fn => {
            fn.call(context, result);
        });
    }

    _run(value, context) {
        if (!this._do) {
            return this._result(null, value, context);
        }
        let result;
        let args = [value];
        let asynchronous = this._do.length >= 2;
        if (asynchronous) {
            args.push((err, result) => this._result(err, result, context));
        }
        try {
            result = this._do.apply(context, args);
        } catch (e) {
            return this._result(e, null, context);
        }
        if (!asynchronous) {
            this._result(null, result, context);
        }
    }

    _result(err, result, context) {
        let next;
        if (result && this._yes) {
            next = this._yes;
        }
        if (!result && this._no) {
            next = this._no;
        }

        this._doNext(err, result, next, context);
    }

    _doNext(err, result, next, context) {
        next = next || this._next;

        if (!err && !next && this._goto) {
            let labels;
            for (labels of this._labels) {
                next = labels[this._goto];
                if (next) break;
            }
            if (!next) err = new Error('Goto not found: ' + this._goto);
        }

        if (err) {
            this._doCatch(err, context);
        } else if (next) {
            return setImmediate(() => next._run(result, context));
        }

        this._doFinally(result, context);

        if (!next && this._return) {
            this._return._doNext(err, result, context);
        }
    }

    label(name) {
        let flow = this._setFn('_next');
        this._labels[0][name] = flow;
        return flow;
    }

    goto(name) {
        let flow = this._setFn('_next');
        flow._goto = name;
        return flow;
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

    run(value, context) {
        this._first._run(value, context || this._context || this);
        return this;
    }

    bind(context) {
        this._context = context;
    }
}

NodeFlow.prototype.then = NodeFlow.prototype.do;
NodeFlow.prototype.if = NodeFlow.prototype.do;
NodeFlow.prototype.question = NodeFlow.prototype.do;

module.exports = NodeFlow;
