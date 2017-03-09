'use strict';

const flow = require('./');

let myFlow = flow()
    .label('loop')
    .do(v => {
        console.log('first', v);
        return v + 1;
    })
    .if(v => {
        console.log('if', v);
        return v > 20;
    })
    .yes((v, cb) => {
        console.log('yes', v);
        cb(null, 33);
    })
    .no(flow().goto('loop'))
    .then(v => {
        console.log('end', v);
    })
    .catch(err => {
        console.error('error:', err.message);
    })
    .finally(v => {
        console.log('finally', v);
    });

myFlow.run(0);

