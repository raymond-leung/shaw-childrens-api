'use strict';

const RsvpHandler = require('./../handlers/rsvp');

const apiPath = 'api';
const version = 'v1';

module.exports = [
    {
        method: 'PUT',
        path: `/${apiPath}/${version}/childrens/rsvp`,
        config: { auth: 'jwt', cors: true },
        handler: RsvpHandler.rsvp
    },
    {
        method: 'GET',
        path: `/${apiPath}/${version}/childrens/rsvp`,
        config: { auth: 'jwt', cors: true },
        handler: RsvpHandler.getRsvp
    },
    {
        method: 'GET',
        path: `/${apiPath}/${version}/childrens/allAttending`,
        config: { auth: 'jwt', cors: true },
        handler: RsvpHandler.getAllAttending
    },
    {
        method: 'DELETE',
        path: `/${apiPath}/${version}/childrens/rsvp`,
        config: { auth: 'jwt', cors: true },
        handler: RsvpHandler.cancelRsvp
    }
];
