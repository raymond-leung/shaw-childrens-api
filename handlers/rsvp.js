'use strict';

exports.rsvp = async (request, h) => {
    const pool = request.mysql.pool;
    const credentials = request.auth.credentials;
console.log('payload: ', request.payload);
    try {
        const [employeeRow, employeeFields] = await pool.query("UPDATE childrens_employees SET firstName=?, lastName=?, email=? WHERE employeeId=? LIMIT 1", [request.payload.firstName, request.payload.lastName, request.payload.email, credentials.empId]);
        
        const [rsvpRow, rsvpFields] = await pool.query("INSERT INTO childrens_rsvp (employeeId, status, photoWithSanta, spouseName, rsvpDateTime, updateDateTime) VALUES (?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE status=?, photoWithSanta=?, spouseName=?, updateDateTime=NOW()", [credentials.empId, request.payload.status, request.payload.photoWithSanta, request.payload.spouseName, request.payload.status, request.payload.photoWithSanta, request.payload.spouseName]);
        
        //Remove Children
        const [deleteChildrenRows, deleteChildrenFields] = await pool.query("DELETE FROM childrens_children WHERE employeeId=? LIMIT 4", [credentials.empId]);
        
        //Add Children back in
        if(request.payload.children.length) {
            //request.payload.children.forEach((child) => {
            for(let ii=0; ii<request.payload.children.length; ii++) {
                const child = request.payload.children[ii];

                if(child.name.length) {
                    let [childrensRow, childrensField] = await pool.query("INSERT INTO childrens_children (id, employeeId, name, age, gender) VALUES (null, ?, ?, ?, ?)", [credentials.empId, child.name, child.age, child.gender]);
                }
            };
        }

        return h.response({ success: true, err: {} });
    } catch(err) {
        return h.response({ success: false, err }).code(400);
    }
};

exports.getRsvp = async (request, h) => {
    const pool = request.mysql.pool;
    const credentials = request.auth.credentials;

    try {
        const [rsvpRow, rsvpFields] = await pool.query('SELECT ce.employeeId, ce.firstName, ce.lastName, ce.email, cr.status, cr.spouseName, cr.photoWithSanta FROM childrens_employees ce LEFT JOIN childrens_rsvp cr ON ce.employeeId = cr.employeeId  WHERE ce.employeeId=? ', [credentials.empId]);

        const [childrenRows, childrenFields] = await pool.query('SELECT name, age, gender FROM childrens_children WHERE employeeId=? LIMIT 4', [credentials.empId]);

        return { employee: rsvpRow, children: childrenRows };
    } catch(err) {
        return h.response({ success: false, err }).code(400);
    }
};

exports.cancelRsvp = async (request, h) => {
    const pool = request.mysql.pool;
    const credentials = request.auth.credentials;

    try {
        const [rsvpRow, rsvpFields] = await pool.query('UPDATE childrens_rsvp SET status=0, updateDateTime=NOW() WHERE employeeId=? LIMIT 1', [credentials.empId]);

        const [childrenRows, childrenFields] = await pool.query('DELETE FROM childrens_children WHERE employeeId=? LIMIT 4', [credentials.empId]);

        return h.response({ success: true, err: {} });
    } catch(err) {
        return h.response({ success: false, err }).code(400);
    }
};

exports.getAllAttending = async (request, h) => {
    const pool = request.mysql.pool;

    try {
        const [countRow, countFields] = await pool.query('SELECT SUM(IF(spouseName IS NULL OR spouseName = "", 1, 2)) AS cnt FROM childrens_employees ce LEFT JOIN childrens_rsvp cr ON ce.employeeId=cr.employeeId WHERE cr.status=1');
        const [childrenRow, childrenFields] = await pool.query('SELECT COUNT(*) as cnt FROM childrens_rsvp cr LEFT JOIN childrens_children cc ON cr.employeeId=cc.employeeId WHERE cr.status=1');

        console.log('counts: ', countRow, childrenRow);
       
        return parseInt(countRow[0].cnt) + parseInt(childrenRow[0].cnt);
    } catch(err) {
    }
};
