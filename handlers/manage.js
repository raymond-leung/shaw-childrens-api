'use strict';

exports.list = async (request, h) => {
    const pool = request.mysql.pool;
    const status = request.params.status;

    try {
        if(status === null || status === 'null') {
            const [notRespondedRows, notRespondedFields] = await pool.query('SELECT e.employeeId, e.firstName, e.lastName, e.email, r.guestName, r.dietary, r.assistance, r.status FROM employees e LEFT JOIN rsvp r ON e.employeeId=r.employeeId WHERE r.status IS NULL ORDER BY e.firstName ASC, e.lastName ASC');

            return notRespondedRows;
        } else {
            const [rsvpRows, rsvpFields] = await pool.query('SELECT e.employeeId, e.firstName, e.lastName, e.email, r.guestName, r.dietary, r.assistance, r.status FROM employees e LEFT JOIN rsvp r ON e.employeeId=r.employeeId WHERE r.status=? ORDER BY e.firstName ASC, e.lastName ASC', [status]);

            return rsvpRows;
        }
    } catch(err) {
        return h.response({ success: false, err }).code(400);
    }
};

exports.getEmployee = async (request, h) => {
    const pool = request.mysql.pool;
    const searchTerm = request.params.searchTerm;

    try {
        let searchRows = [];
        let searchFields = [];
        if(Number.isInteger(parseInt(searchTerm))) {
            [searchRows, searchFields] = await pool.query('SELECT e.employeeId, e.firstName, e.lastName, e.email, r.guestName, r.dietary, r.assistance, r.status FROM employees e LEFT JOIN rsvp r ON e.employeeId=r.employeeId WHERE e.employeeId=? ORDER BY e.firstName ASC, e.lastName ASC', [searchTerm]);
        } else {
            [searchRows, searchFields] = await pool.query('SELECT e.employeeId, e.firstName, e.lastName, e.email, r.guestName, r.dietary, r.assistance, r.status FROM employees e LEFT JOIN rsvp r ON e.employeeId=r.employeeId WHERE e.lastName=? ORDER BY e.firstName ASC, e.lastName ASC', [searchTerm]);
        }

        return searchRows;
    } catch(err) {
         return h.response({ success: false, err }).code(400);
    };
}

exports.updateEmployee = async(request, h) => {
    const pool = request.mysql.pool;
    const employeeId = request.params.employeeId;

    request.payload.guestEmployeeId = request.guestEmployeeId || null;

    try {
        const [rsvpRows, rsvpFields] = await pool.query('INSERT INTO rsvp (employeeId, status, guestName, guestEmployeeId, dietary, assistance, rsvpDateTime) VALUES (?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE status=?, guestName=?, guestEmployeeId=?, dietary=?, assistance=?, updateDateTime=NOW()', [employeeId, request.payload.status, request.payload.guestName, request.payload.guestEmployeeId, request.payload.dietary, request.payload.assistance, request.payload.status, request.payload.guestName, request.payload.guestEmployeeId, request.payload.dietary, request.payload.assistance]);

        const [updateRows, updateFields] = await pool.query('UPDATE employees SET firstName=?, lastName=?, email=? WHERE employeeId=?  LIMIT 1', [request.payload.firstName, request.payload.lastName, request.payload.email, employeeId]);

        return { success: true };
    } catch(err) {
        return h.response({ success: false, err }).code(400)
    }
};

exports.addEmployee = async (request, h) => {
    const pool = request.mysql.pool;

    try {
        const [addRows, addFields] = await pool.query("INSERT INTO employees (employeeId, firstName, lastName, email) VALUES (?, ?, ?, ?)", [request.payload.employeeId, request.payload.firstName, request.payload.lastName, request.payload.email]);

        return addRows;
    } catch(err) {
        return h.response({ success:false, err }).code(400);
    }

    return {};
};

exports.getCounts = async (request, h) => {
    const pool = request.mysql.pool;

    try {
        const promiseArray = [];
        promiseArray.push(
            pool.query("SELECT COUNT(*) AS cnt FROM employees e LEFT JOIN rsvp r ON e.employeeId=r.employeeId WHERE r.status IS NULL")
        );
        promiseArray.push(
            pool.query("SELECT COUNT(*) AS cnt FROM employees e LEFT JOIN rsvp r ON e.employeeId=r.employeeId WHERE r.status = 0")
        );
        promiseArray.push(
            pool.query("SELECT SUM(IF(guestName IS NULL or guestName = '', 1, 2)) AS cnt FROM employees e LEFT JOIN rsvp r ON e.employeeId=r.employeeId WHERE r.status = 1")
        );
        promiseArray.push(
            pool.query("SELECT COUNT(*) AS cnt FROM employees e LEFT JOIN rsvp r ON e.employeeId=r.employeeId WHERE r.status = 2")
        );
        
        return Promise.all(promiseArray)
            .then((response) => {
                const notRespondedRows = response[0][0][0];
                const cancelledRows = response[1][0][0];
                const attendingRows = response[2][0][0];
                const notAttendingRows = response[3][0][0];

                const returnObj = {
                    notResponded: notRespondedRows.cnt,
                    cancelled: cancelledRows.cnt,
                    attending: attendingRows.cnt,
                    notAttending: notAttendingRows.cnt
                };

                return returnObj;
            })
            .catch((err) => {
                return h.response({ success:false, err }).code(400);
            })
    } catch(err) {
    }    
};
