'use strict';

const ManageHandler = require('./../handlers/manage');

const apiPath = 'api';
const version = 'v1';

module.exports = [
    {
        method: 'GET',
        path: `/${apiPath}/${version}/manage/list/{status}`,
        config: {
            cors: true,
            auth: {
                strategy: 'jwt',
                scope: ['+admin']
            }
        },
        handler: ManageHandler.list
    },
    {
        method: 'GET',
        path: `/${apiPath}/${version}/manage/employee/{searchTerm}`,
        config: {
            cors: true,
            auth: {
                strategy: 'jwt',
                scope: ['+admin']
            }
        },
        handler: ManageHandler.getEmployee
    },
    {
        method: 'GET',
        path: `/${apiPath}/${version}/manage/counts`,
        config: {
            cors: true,
            auth: {
                strategy: 'jwt',
                scope: ['+admin']
            }
        },
        handler: ManageHandler.getCounts
    },
    {
        method: 'PUT',
        path: `/${apiPath}/${version}/manage/employee/{employeeId}`,
        config: { 
            cors: true,
            auth: {
                strategy: 'jwt',
                scope: ['+admin']
            }
        },
        handler: ManageHandler.updateEmployee
    },
    {
        method: 'POST',
        path: `/${apiPath}/${version}/manage/employee`,
        config: {
            cors: true,
            auth: {
                strategy: 'jwt',
                scope: ['+admin']
            }
        },
        handler: ManageHandler.addEmployee
    },
];
