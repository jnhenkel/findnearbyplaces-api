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
                    where l.name like '%${search_term}%'  
                    `;
        if (category_filter) {
            query += `or c.name like '%${category_filter}%`;
        } else {
            query += `or c.name like '%${search_term}%'`;
        }

        if (radius_filter) {
            query += `and location <= ${user_location} + ${radius_filter}
                        and location >= ${user_location} - ${radius_filter}`;
        } else {
            query += `and location like ${user_location}`;
        }

        if (maximum_results_to_return) {
            query += `limit ${maximum_results_to_return}`;
        }
    }
}

module.exports = {store};