'use strict';

exports.list = async (request, h) => {
    const pool = request.mysql.pool;
    const status = request.params.status;

    try {
        if(status === null || status === 'null') {
            const [notRespondedRows, notRespondedFields] = await pool.query('SELECT ce.employeeId, ce.firstName, ce.lastName, ce.email, cr.spouseName, cr.dietary, cr.status, cr.photoWithSanta FROM childrens_employees ce LEFT JOIN childrens_rsvp cr ON ce.employeeId=cr.employeeId WHERE cr.status IS NULL ORDER BY ce.firstName ASC, ce.lastName ASC');

            return notRespondedRows;
        } else {
            const [rsvpRows, rsvpFields] = await pool.query('SELECT ce.employeeId, ce.firstName, ce.lastName, ce.email, cr.spouseName, cr.dietary, cr.status, cr.photoWithSanta, cc.name, cc.age, cc.gender, cc.relationship FROM childrens_employees ce LEFT JOIN childrens_rsvp cr ON ce.employeeId=cr.employeeId LEFT JOIN childrens_children cc ON cr.employeeId=cc.employeeId WHERE cr.status=? ORDER BY ce.firstName ASC, ce.lastName ASC', [status]);

            const returnObj = {};
            rsvpRows.forEach((rsvpRow) => {
                if(!returnObj[rsvpRow.employeeId]) {
                    returnObj[rsvpRow.employeeId] = {
                        employeeId: rsvpRow.employeeId,
                        firstName: rsvpRow.firstName,
                        lastName: rsvpRow.lastName,
                        email: rsvpRow.email,
                        spouseName: rsvpRow.spouseName,
                        dietary: rsvpRow.dietary,
                        status: rsvpRow.status,
                        photoWithSanta: rsvpRow.photoWithSanta,
                        children: [
                            {
                                name: rsvpRow.name,
                                age: rsvpRow.age,
                                gender: rsvpRow.gender,
                                relationship: rsvpRow.relationship
                            }
                        ]
                    }
                } else {
                    returnObj[rsvpRow.employeeId].children.push({
                        name: rsvpRow.name,
                        age: rsvpRow.age,
                        gender: rsvpRow.gender,
                        relationship: rsvpRow.relationship
                    });
                }
            });
            
            let returnArray = Object
                .keys(returnObj)
                .map(ii => returnObj[ii]);
            
            returnArray
                .sort((aa, bb) => {
                    if(aa.firstName < bb.firstName) {
                        return -1;
                    } else if(aa.firstName > bb.firstName) {
                        return 1;
                    } else if(aa.lastName < bb.lastName) {
                        return -1;
                    } else if(aa.lstName > bb.lastName) {
                        return 1;
                    }

                    return 0;
                });

            return returnArray;
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
            [searchRows, searchFields] = await pool.query('SELECT ce.employeeId, ce.firstName, ce.lastName, ce.email, cr.spouseName, cr.dietary, cr.status, cr.photoWithSanta, cc.name, cc.age, cc.gender, cc.relationship FROM childrens_employees ce LEFT JOIN childrens_rsvp cr ON ce.employeeId=cr.employeeId LEFT JOIN childrens_children cc ON cr.employeeId=cc.employeeId WHERE ce.employeeId=? ORDER BY ce.firstName ASC, ce.lastName ASC', [searchTerm]);
        } else {
            [searchRows, searchFields] = await pool.query('SELECT ce.employeeId, ce.firstName, ce.lastName, ce.email, cr.spouseName, cr.dietary, cr.status, cr.photoWithSanta, cc.name, cc.age, cc.gender, cc.relationship FROM childrens_employees ce LEFT JOIN childrens_rsvp cr ON ce.employeeId=cr.employeeId LEFT JOIN childrens_children cc ON cr.employeeId=cc.employeeId WHERE ce.lastName=? ORDER BY ce.firstName ASC, ce.lastName ASC', [searchTerm]);
        }

        const returnObj = {};
        searchRows.forEach((searchRow) => {
            if(!returnObj[searchRow.employeeId]) {
                returnObj[searchRow.employeeId] = {
                    employeeId: searchRow.employeeId,
                    firstName: searchRow.firstName,
                    lastName: searchRow.lastName,
                    email: searchRow.email,
                    spouseName: searchRow.spouseName,
                    dietary: searchRow.dietary,
                    status: searchRow.status,
                    photoWithSanta: searchRow.photoWithSanta,
                    children: [
                        {
                            name: searchRow.name,
                            age: searchRow.age,
                            gender: searchRow.gender,
                            relationship: searchRow.relationship
                        }
                    ]
                }
            } else {
                returnObj[searchRow.employeeId].children.push({
                    name: searchRow.name,
                    age: searchRow.age,
                    gender: searchRow.gender,
                    relationship: searchRow.relationship
                });
            }
        });

        return Object.keys(returnObj).map(ii => returnObj[ii]);
    } catch(err) {
         return h.response({ success: false, err }).code(400);
    };
}

exports.updateEmployee = async(request, h) => {
    const pool = request.mysql.pool;
    const employeeId = request.params.employeeId;

    if(!request.payload.lastName || !request.payload.children || request.payload.children.length === 0 || !request.payload.children[0].name) {
        return h.response({ success: false, err: { message: 'missing or invalid parameters' } }).code(400);
    }

    try {
        const [employeeRow, employeeFields] = await pool.query("UPDATE childrens_employees SET firstName=?, lastName=?, email=? WHERE employeeId=? LIMIT 1", [request.payload.firstName, request.payload.lastName, request.payload.email, employeeId]);
        
        const [rsvpRow, rsvpFields] = await pool.query("INSERT INTO childrens_rsvp (employeeId, status, photoWithSanta, dietary, spouseName, rsvpDateTime, updateDateTime) VALUES (?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE status=?, photoWithSanta=?, dietary=?, spouseName=?, updateDateTime=NOW()", [employeeId, request.payload.status, request.payload.photoWithSanta, request.payload.dietary, request.payload.spouseName, request.payload.status, request.payload.photoWithSanta, request.payload.dietary, request.payload.spouseName]);
        
        //Remove Children
        const [deleteChildrenRows, deleteChildrenFields] = await pool.query("DELETE FROM childrens_children WHERE employeeId=? LIMIT 4", [employeeId]);
        
        //Add Children back in
        if(request.payload.children && request.payload.children.length) {
            //request.payload.children.forEach((child) => {
            for(let ii=0; ii<request.payload.children.length; ii++) {
                let child = request.payload.children[ii];

                if(child.name && child.name.length) {
                    let [childrensRow, childrensField] = await pool.query("INSERT INTO childrens_children (id, employeeId, name, age, gender, relationship) VALUES (null, ?, ?, ?, ?, ?)", [employeeId, child.name, child.age, child.gender, child.relationship]);
                }
            };
        }

        return h.response({ success: true, err: {} });
    } catch(err) {
        return h.response({ success: false, err }).code(400)
    }
};

exports.addEmployee = async (request, h) => {
    const pool = request.mysql.pool;

    try {
        const [addRows, addFields] = await pool.query("INSERT INTO childrens_employees (employeeId, firstName, lastName, email) VALUES (?, ?, ?, ?)", [request.payload.employeeId, request.payload.firstName, request.payload.lastName, request.payload.email]);

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
            pool.query("SELECT COUNT(*) AS cnt FROM childrens_employees ce LEFT JOIN childrens_rsvp cr ON ce.employeeId=cr.employeeId WHERE cr.status IS NULL")
        );
        promiseArray.push(
            pool.query("SELECT COUNT(*) AS cnt FROM childrens_employees ce LEFT JOIN childrens_rsvp cr ON ce.employeeId=cr.employeeId WHERE cr.status = 0")
        );
        promiseArray.push(
            pool.query("SELECT SUM(IF(spouseName IS NULL or spouseName = '', 1, 2)) AS cnt FROM childrens_employees ce LEFT JOIN childrens_rsvp cr ON ce.employeeId=cr.employeeId WHERE cr.status = 1")
        );
        promiseArray.push(
            pool.query("SELECT COUNT(*) as cnt FROM childrens_rsvp cr LEFT JOIN childrens_children cc ON cr.employeeId=cc.employeeId WHERE cr.status=1")
        );
        promiseArray.push(
            pool.query("SELECT COUNT(*) as cnt FROM childrens_rsvp cr LEFT JOIN childrens_children cc ON cr.employeeId=cc.employeeId WHERE cr.status=1 AND cc.gender='male'")
        );
        promiseArray.push(
            pool.query("SELECT COUNT(*) as cnt FROM childrens_rsvp cr LEFT JOIN childrens_children cc ON cr.employeeId=cc.employeeId WHERE cr.status=1 AND cc.gender='female'")
        );


        return Promise.all(promiseArray)
            .then((response) => {
                const notRespondedRows = response[0][0][0];
                const cancelledRows = response[1][0][0];
                const attendingRows = response[2][0][0];
                const attendingChildrenRows = response[3][0][0];
                const boysRows = response[4][0][0];
                const girlsRows = response[5][0][0];

                const returnObj = {
                    notResponded: notRespondedRows.cnt,
                    cancelled: cancelledRows.cnt,
                    attending: parseInt(attendingRows.cnt) + parseInt(attendingChildrenRows.cnt),
                    adults: parseInt(attendingRows.cnt),
                    boys: parseInt(boysRows.cnt),
                    girls: parseInt(girlsRows.cnt)
                };

                return returnObj;
            })
            .catch((err) => {
                return h.response({ success:false, err }).code(400);
            })
    } catch(err) {
        console.log('getcounts error: ', err);
    } 
};
