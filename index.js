const express = require('express');
var cors = require('cors');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);
const {store} = require('./data/store');
const req = require('express/lib/request');
const { Pool } = require('pg/lib');

const app = express();

const port = process.env.PORT || 4002;


//middlewares
app.use(cors({
    origin: "https://jnhenkel.github.io",
    credentials: true
}));
app.use(express.json());




app.use((request, response, next) => {
    console.log(`request url: ${request.url}`);
    console.log(`request method: ${request.method}`);
    //only for development. Remove the next two lines when you deploy your final version.
    console.log(`request body:`);
    console.log(request.body);
    next();
})

passport.use(
    new LocalStrategy({ usernameField: 'email' }, function verify(username, password, cb) {
        store.login(username, password)
            .then(x => {
                if (x.valid) {
                    return cb(null, x.user);
                } else {
                    return cb(null, false, { message: 'Incorrect username or password.' });
                }
            })
            .catch(e => {
                console.log(e);
                cb('Something went wrong!');
            });

    }));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: 'sessions.db', dir: './sessions' })
}));
app.use(passport.authenticate('session'));

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

app.get('/', (req,res) => {
    res.status(200).json({done: true, message: 'This is the backend for findnearbyplaces'});
});
 
//1
app.get('/search/:search_term/:user_location/:radius_filter/:maximum_results_to_return/:category_filter/:sort', (req, res) => {
    let search_term = req.params.search_term;
    let user_location = req.params.user_location;
    let radius_filter = req.params.radius_filter;
    let maximum_results_to_return = req.params.maximum_results_to_return;
    let category_filter = req.params.category_filter;
    let sort = req.params.sort;
    store.getSearch(search_term, user_location, radius_filter, maximum_results_to_return, category_filter, sort)
    .then(x => {
        console.log(x);
        if (x.done) {
            res.status(200).json(x);
        } else {
            res.status(404).json(x);
        }
    })
})

//2
app.post('/register', (req, res) => {
    let email = req.body.email;
    let password = req.body.password; /* store will handle encryption */
    store.addCustomer(email, password)
        .then(x => {
            //console.log(x);
            res.status(200).json({ done: true, message: 'A customer has been added successfully' })
        })
        .catch(e => {
            console.log(e);
            res.status(500).json({ done: false, message: 'Customer not added due to an error.' });
        });

});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/login/succeeded',
    failureRedirect: '/login/failed'
}));
app.get('/login/succeeded', (request, response) => {
    response.status(200).json({ done: true, message: 'The customer logged in successfully.' });
});

app.get('/login/failed', (request, response) => {
    response.status(401).json({ done: false, message: 'The credentials are not valid.' });
});

//3
app.post('/place', (req, res) => {
    let name = req.body.name;
    let category_id = req.body.category_id;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let description = req.body.description;
    store.postLocation(name,category_id,latitude,longitude,description)
    .then(x => {
        return store.getLocationId(name)
    })
    .then(x => {
        res.status(200).json({done: true, id: x.rows[0].id, message: 'Location added successfully'});
    })
    .catch(e => {
        console.log(e);
        res.status(500).json({ done: false, message: 'Location not added due to an error.' });
    })
});

//3.1
app.post('/category', (req, res) => {
    let name = req.body.name;
    store.postCategory(name)
    .then(x => {
        return store.getCategoryId(name)
    })
    .then(x => {
        res.status(200).json({done: true, id: x.rows[0].id, message: 'Category added successfully'});
    })
    .catch(e => {
        console.log(e);
        res.status(500).json({ done: false, message: 'Category not added due to an error.' });
    })
});

//4
app.post('/photo', (req, res) => {
    let photo = req.body.photo;
    let place_id = req.body.place_id;
    let review_id = req.body.review_id;
    var photo_id;
    store.postPhoto(photo)
    .then(x => {
        return store.getPhotoId(photo)
    })
    .then(x => {
        photo_id = x.rows[0].id;
        if (place_id) {
            return store.postPlacePhoto(place_id, photo_id)
        } else if (review_id) {
            return store.postReviewPhoto(review_id, photo_id)
        }
    })
    .then(x => {
        res.status(200).json({done: true, id: photo_id, message: 'Photo added successfully'});
    })
    .catch(e => {
        console.log(e);
        res.status(500).json({ done: false, message: 'Photo not added due to an error.' });
    })
});

//5
app.post('/review', (req, res) => {
    let location_id = req.body.place_id;
    let text = req.body.comment;
    let rating = req.body.rating;
    store.postReview(location_id, text, rating)
    .then(x => {
        return store.getReviewId(location_id, text, rating)
    })
    .then(x => {
        res.status(200).json({done: true, id: x.rows[0].id, message: 'Review added successfully'});
    })
    .catch(e => {
        console.log(e);
        res.status(500).json({ done: false, message: 'Review not added due to an error.' });
    })
});

//6
app.put('/place', (req, res) => {
    let place_id = req.body.place_id;
    let name = req.body.name;
    let category_id = req.body.category_id;
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let description = req.body.description;
    store.putPlace(place_id, name, category_id, latitude, longitude, description)
    .then(x => {
        res.status(200).json({done: true, message: 'Location updated successfully'});
    })
    .catch(e => {
        console.log(e);
        res.status(500).json({ done: false, message: 'Location not updated due to an error.' });
    })
});

//7
app.put('/review', (req, res) => {
    let review_id = req.body.review_id;
    let text = req.body.comment;
    let rating = req.body.rating;
    store.putReview(review_id, text, rating)
    .then(x => {
        res.status(200).json({done: true, message: 'Review updated successfully'});
    })
    .catch(e => {
        console.log(e);
        res.status(500).json({ done: false, message: 'Review not updated due to an error.' });
    })
});

//8
app.put('/photo', (req, res) => {
    let photo_id = req.body.photo_id;
    let file = req.body.photo;
    store.putPhoto(photo_id, file)
    .then(x => {
        res.status(200).json({done: true, message: 'Photo updated successfully'});
    })
    .catch(e => {
        console.log(e);
        res.status(500).json({ done: false, message: 'Photo not updated due to an error.' });
    })
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});