/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }
  /** get best customers: reservations # high -> low limit 10 */
  static async getBest(){
    const results = await db.query(`
      SELECT id, first_name AS "firstName", last_name AS "lastName", phone, notes, r.count AS "count"
      FROM (SELECT customer_id, COUNT(customer_id) AS "count" FROM reservations
      GROUP BY reservations.customer_id) AS r
      LEFT JOIN customers AS c
      ON r.customer_id = c.id
      ORDER BY r.count desc
      LIMIT 10;
    `);
    const best = results.rows.map(c => new Customer(c));
    for (let i = 0; i<results.rows.length; i++) {
      best[i].count = results.rows[i].count;
    }
    return best
  }

  /** search customers by name */

  static async searchName(name){
    const results = await db.query(`
      SELECT id, first_name AS "firstName", last_name AS "lastName", phone, notes FROM customers WHERE CONCAT(LOWER(first_name), ' ', LOWER(last_name)) LIKE CONCAT('%',$1::text,'%') ORDER BY last_name, first_name ;`,[name]);
    console.log(name)
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }
  // fullName(){
  //   return `${this.firstName} ${this.lastName}`
  // }
  // turn fullName() into a getter:
  get fullName(){
    return this.firstName + " " + this.lastName;
  }
}

module.exports = Customer;
