const express = require('express');
const path = require('path');


const app = express();

app.use(express.static('./build'));


app.use(function logger(req, res, next) {
    console.log('New Request - ' + Date.now());
    console.log(`
        Type: ${req.method}
        URL: ${req.originalUrl}
    `);
    next();
});


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, './build', 'index.html'));
})

app.listen(process.env.PORT || 3000, () => console.log(`App Listening On Port: ${process.env.PORT || 3000}`));