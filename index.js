const express = require('express');
var cors = require('cors');

const app = express();

const port = process.env.PORT || 4002;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});