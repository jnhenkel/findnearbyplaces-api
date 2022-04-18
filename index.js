const express = require('express');
var cors = require('cors');

const app = express();

const port = process.env.PORT || 4002;

//middlewares
app.use(express.json());
app.use(cors());

app.get('/', (req,res) => {
    console.log(navigator);
    res.status(200).json({done: true, message: 'This is the backend for findnearbyplaces'});
});
 

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});