'use strict';

const ManageHandler = require('./../handlers/manage');

const apiPath = 'api';
const version = 'v1';

module.exports = [
    {
        method: 'GET',
        path: `/${apiPath}/${version}/childrens/manage/list/{status}`,
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
        path: `/${apiPath}/${version}/childrens/manage/employee/{searchTerm}`,
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
        path: `/${apiPath}/${version}/childrens/manage/counts`,
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
        path: `/${apiPath}/${version}/childrens/manage/employee/{employeeId}`,
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
        path: `/${apiPath}/${version}/childrens/manage/employee`,
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
