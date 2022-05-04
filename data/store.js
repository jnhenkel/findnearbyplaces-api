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

    postLocation: (name,category_id,latitude,longitude,description) => {
        return pool.query('INSERT INTO findnearbyplaces.locations (name,category_id,latitude,longitude,description) VALUES ($1, $2, $3, $4, $5)', [name,category_id,latitude,longitude,description])
    },

    getLocationId: (name) => {
        return pool.query('SELECT l.id FROM findnearbyplaces.locations l WHERE name LIKE $1', [name])
    },

    postCategory: (name) => {
        return pool.query('INSERT INTO findnearbyplaces.category (name) VALUES ($1)', [name])
    },

    getCategoryId: (name) => {
        return pool.query('SELECT c.id FROM findnearbyplaces.category c WHERE name LIKE $1', [name])
    },

    postPhoto: (photo) => {
        return pool.query('INSERT INTO findnearbyplaces.photo (file) VALUES ($1)', [photo])
    },

    getPhotoId: (photo) => {
        return pool.query('SELECT p.id FROM findnearbyplaces.photo p WHERE file = $1', [photo])
    },

    postPlacePhoto: (place_id, photo_id) => {
        return pool.query('INSERT INTO findnearbyplaces.place_photo (location_id, photo_id) VALUES ($1, $2)', [place_id, photo_id])
    },

    postReviewPhoto: (review_id, photo_id) => {
        return pool.query('INSERT INTO findnearbyplaces.review_photo (review_id, photo_id) VALUES ($1, $2)', [review_id, photo_id])
    },

    postReview: (location_id, text, rating) => {
        return pool.query('INSERT INTO findnearbyplaces.reviews (location_id, text, rating) VALUES ($1, $2, $3)', [location_id, text, rating])
    },

    getReviewId: (location_id, text, rating) => {
        return pool.query('SELECT r.id FROM findnearbyplaces.reviews r WHERE location_id = $1 AND text = $2 AND rating = $3', [location_id, text, rating])
    },

    putPlace: (place_id, name, category_id, latitude, longitude, description) => {
        let result = [place_id];
        let query = 'UPDATE findnearbyplaces.locations SET';
        if (name) {
            query += ' name = $2';
            result.push(name);
        }
        if (category_id) {
            query += ', category_id = $3';
            result.push(category_id);
        }
        if (latitude) {
            query += ', latitude = $4';
            result.push(latitude);
        }
        if (longitude) {
            query += ', longitude = $5';
            result.push(longitude);
        }
        if (description) {
            query += ', description = $6';
            result.push(description);
        }
        query += ' WHERE id = $1';
        return pool.query(query, result)
    }
}

module.exports = {store};