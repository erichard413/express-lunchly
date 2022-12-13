/** Database for lunchly */

const pg = require("pg");

const db = new pg.Client("postgresql:///lunchly");

db.password="pugsrcool"

db.connect();

module.exports = db;
