'use strict';

const AuthHandler = require('./../handlers/auth');

const apiPath = 'api';
const version = 'v1';

module.exports = [
    {
        method: 'POST',
        path: `/${apiPath}/${version}/childrens/login`,
        config: { auth: false, cors: true },
        handler: AuthHandler.login,
    },
];
