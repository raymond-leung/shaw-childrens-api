'use strict';

const Hapi = require('hapi');
const fs = require('fs');

require('dotenv').config();

process.on('uncaughtException', (err) => {
    console.error(`${(new Date).toUTCString()} uncaughtException: ${err.message}`);
    console.error(err.stack);

    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`${(new Date).toUTCString} unhandled promise rejection: ${reason.message || reason}`);
    console.error(promise);

    process.exit(1);
});

const jwtValidate = async (decoded, request) => {
    if(!decoded.empId || !decoded.empLname) { 
        return { isValid: false };
    }

    const pool = request.mysql.pool;
    try {
        const [rows, fields] = await pool.query('SELECT COUNT(*) AS cnt FROM childrens_employees WHERE employeeId = ? AND lastName = ? LIMIT 1', [decoded.empId, decoded.empLname]);

        return { isValid: (rows[0].cnt === 1 ? true : false) };
    } catch(err) {
        request.logger.error('jwtValidate error: ', err);
        return { isValid: false };
    }
};

const init = async () => {
    const hapiOptions = {
        port: process.env.SERVER_PORT,
        host: process.env.SERVER_HOST,
        tls: {
            cert: fs.readFileSync('/etc/ssl/certs/rsvp_vancouver_shaw_ca.crt'),
            key: fs.readFileSync('/etc/ssl/private/private-hapi.key'),
        }, 
        router: {
            stripTrailingSlash: true
        },
        routes: {
            files: {
                relativeTo: __dirname
            }
        }
    };

    const server = Hapi.server(hapiOptions);
    await server.start();

    await server.register(require('hapi-auth-jwt2'));
    server.auth.strategy('jwt', 'jwt', {
        key: process.env.JWT_SECRET,
        validate: jwtValidate,
        verifyOptions: { algorithms: ['HS256'] }
    });
    server.auth.default('jwt');

    await server.register({
        plugin: require('hapi-pino'),
        options: {
            prettyPrint: process.env.NODE_ENV !== 'production'
        }
    });
    await server.register({
        plugin: require('hapi-mysql2'),
        options: {
            settings: `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_DATABASE}`,
            decorate: true
        }
    });

    server.route(require('./routes/auth'));
    server.route(require('./routes/rsvp'));
    server.route(require('./routes/manage'));

    return server;
};

init()
    .then(server => {
        server.logger().info(`Node.js version ${process.version}`);
        server.logger().info(`Server started at ${server.info.uri} with [${Object.keys(server.plugins).join(', ')}] enabled`);
        server.logger().info(`Process ID: ${process.pid}`);
        if(process.ppid) {
            server.logger().info(`Parent PID: ${process.ppid}`);
        }
    })
    .catch(err => {
        console.error('init error: ', err);
        throw err;
    })
