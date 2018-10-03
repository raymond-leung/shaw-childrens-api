'use strict';

exports.login = async (request, h) => {
    const pool = request.mysql.pool;

    try {
        const [rows, fields] = await pool.query('SELECT employeeId, isAdmin FROM childrens_employees WHERE employeeId = ? AND lastName = ? LIMIT 1', [request.payload.empId, request.payload.empLname]);

        if(rows[0] && rows[0].employeeId !== undefined) {
            const JWT = require('jsonwebtoken');
            const jwtPayload = { 
                empId: request.payload.empId,
                empLname: request.payload.empLname,
                scope: rows[0].isAdmin ? 'admin' : 'user'
            };
            const token = JWT.sign(
                jwtPayload, 
                process.env.JWT_SECRET,
                { expiresIn: 60 * 30 } //60 seconds * 30 minutes
            );
            return { isValid: true, token };
        }
    } catch(err) {
        return Promise.reject(`authenticateUser error: ${err}`);
        return h.response({ isValid: false, err }).code(401);
    }

    return h.response({ isValid: false, err: { message: 'generic' } }).code(401);
};

exports.logout = async (request, h) => {
    console.log('logout here', request.auth.credentials);

    return null;
};
