'use strict';

exports.get = async (request, h) => {
    const pool = request.mysql.pool;

    try {
        const [configRows, configFields] = await pool.query('SELECT startDate, endDate FROM configs ORDER BY id ASC LIMIT 1'); 

        return configRows;
    } catch(err) {
        return h.response({ success: false, err }).code(400);
    };
};

exports.update = async (request, h) => {
};

