const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = `postgres://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.DATABASEPORT}/${process.env.DATABASE}`;

const connection = {
    connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL : connectionString,
    ssl: { rejectUnauthorized: false }
}

const pool = new Pool(connection);

let store = {
    getSearch: (search_term, user_location, radius_filter, maximum_results_to_return, category_filter, sort) => {
        //user_location will be a string with two comma separated values, latitude and longitude
        //required: search_term, user_location, maximum_results_to_return
        //optional: radius_filter, category_filter, sort
        let query = `select l.name as name, CONCAT(l.latitude,',', l.longitude) as location, c.name as category, r.rating as rating, p.file as thumbnail 
                    from findnearbyplaces.locations l 
                    join findnearbyplaces.category c on c.id = l.category_id   
                    join findnearbyplaces.reviews r on r.location_id = l.id
                    join findnearbyplaces.place_photo pp on pp.location_id = l.id
                    join findnearbyplaces.photo p on p.id = pp.photo_id
                    where l.name like '%$1%'  
                    `;
        if (category_filter) {
            query += ` or c.name like '%$5%'`;
        } else {
            query += ` or c.name like '%$1%'`;
        }

        //if (radius_filter) {
        //    query += ` and CONCAT(l.latitude,',', l.longitude) <= $2 + $3 and location >= $2 - $3`;
        //} else {
        //    query += ` and CONCAT(l.latitude,',', l.longitude) like $2`;
        //}

        if (maximum_results_to_return) {
            query += ` limit $4`;
        }

        return pool.query(query,[search_term, user_location, radius_filter, maximum_results_to_return, category_filter, sort])
        .then(x => {
            console.log('from store: ', x);
            if (x.rows.length >0) {
                return {done: true, result: x.rows};
            } else {
                return {done: false, result: x.rows};
            }
        })
        .catch(e => {
            console.log(e);
            alert('something went wrong getting search');
        })
    },

    addCustomer: (email, password) => {
        const hash = bcrypt.hashSync(password, 10);
        return pool.query('INSERT INTO findnearbyplaces.customer (email, password) VALUES ($1, $2)', [email, hash]);
    },

    login: (email, password) => {
        return pool.query('SELECT id, email, password FROM findnearbyplaces.customer WHERE email = $1', [email])
            .then(x => {
                if (x.rows.length == 1) {
                    let valid = bcrypt.compareSync(password, x.rows[0].password);
                    if (valid) {
                        return { valid: true, user: {id: x.rows[0].id, username: x.rows[0].email}};
                    } else {
                        return { valid: false, message: 'Credentials are not valid.' };
                    }
                } else {
                    return { valid: false, message: 'Email not found.' };
                }
            });
    },
}

module.exports = {store};