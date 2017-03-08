'use strict';

const flow = require('./');

let subFlow = flow(v => {
    console.log('subflow', v);
    throw new Error('subflow');
    return 99;
}).catch(err => {
    console.error('subflow error:', err.message);
});

let myFlow = flow(v => {
    console.log('first', v);
    return 11;
}).if(v => {
    console.log('if', v);
    return 0;
}).yes((v, cb) => {
    console.log('yes', v);
    cb(null, 33);
}).no(subFlow).then(v => {
    console.log('then', v);
    return 22;
}).catch(err => {
    console.error('error:', err.message);
}).finally(v => {
    console.log('finally', v);
});

myFlow.run(0);

