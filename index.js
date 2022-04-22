const express = require('express');
var cors = require('cors');
import store from './data/store';

const app = express();

const port = process.env.PORT || 4002;

//middlewares
app.use(express.json());
app.use(cors());

app.get('/', (req,res) => {
    console.log(navigator);
    res.status(200).json({done: true, message: 'This is the backend for findnearbyplaces 1'});
});
 
app.get('/search/:search_term/:user_location/:radius_filter/:maximum_results_to_return/:category_filter/:sort', (req, res) => {
    let search_term = req.params.search_term;
    let user_location = req.params.user_location;
    let radius_filter = req.params.radius_filter;
    let maximum_results_to_return = req.params.maximum_results_to_return;
    let category_filter = req.params.category_filter;
    let sort = req.params.sort;
    store.getSearch(search_term, user_location, radius_filter, maximum_results_to_return, category_filter, sort)
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});