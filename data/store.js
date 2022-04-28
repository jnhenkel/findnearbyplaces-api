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
        let query = 'select l.name from findnearbyplaces.locations l'
    }
}

module.exports = {store};