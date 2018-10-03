'use strict';

const fs = require('fs');
const csv = require('fast-csv');

const employees = [];
fs.createReadStream('./ShawChildrens2018.csv')
    .pipe(csv())
    .on("data", (data) => {
        employees.push({
            id: data[0],
            lastName: data[1],
            firstName: data[2],
            email: data[3]
        });
    })
    .on("end", () => {
        fs.open('outputFile.sql', 'w', (err, fd) => {
            if(err) { console.log('error opening output file: ', err) }

            employees.forEach((employee) => {
                fs.write(fd, `INSERT INTO childrens_employees VALUES(${employee.id}, "${employee.firstName}", "${employee.lastName}", "${employee.email}", 0);\r\n`);
            })
        })
    });
