var express = require('express')
var app = express()
var port = 80;
var path = require('path')

// serve up static files if needed
app.use(express.static('build'))

// send the same index.html for all urls
app.all('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(port, () => console.log(`Serving react app listening on port ${port}!`))