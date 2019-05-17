const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const url = require('url')
const mysql = require('mysql')
const port = 4001

const app = express()

// connect to a database on localhost 
// table must be boards with unique column
// paths and longtext column drawings
var con = mysql.createConnection({
    host: "localhost",
    user: "forever_board",
    password: "",
    database: "foreverboard"
});

con.connect(function (err) {
    if (err) throw err;
    setUpSocket();
});

const server = http.createServer(app);
const io = socketIO(server);
function setUpSocket() {
    io.on('connection', socket => {
        // On connection get the url
        var connectionPath = url.parse(socket.request.headers.referer).pathname;

        // add url if it isnt in the database already
        initNewUrlIfNeeded(connectionPath);

        // listener to recieve lines drawn from the client 
        socket.on('Drawn', (line, path) => {
            addLineToUrl(line, path);
            io.sockets.emit('Drawn', line, path)
        });

        // listener for clear signals sent from the client
        socket.on('Clear', (path) => {
            resetLinesForUrl(path);
            getLinesForUrl(connectionPath, (lines) => {
                io.sockets.emit('fullRefresh', lines, connectionPath);
            });
        });

        // does a refresh of the page when someone connects to the url
        // to give them the current state of the drawing
        getLinesForUrl(connectionPath, (lines) => {
            io.sockets.emit('fullRefresh', lines, connectionPath);
        });
    })
}

// Adds the new url to the database and sets empty lines for the drawing
function initNewUrlIfNeeded(path) {
    var queryString = "insert ignore into boards values ('" + path + "','[]');";
    con.query(queryString, function(err, rows, fields) {
        if (err) throw err;
    });
}

// Adds the last line to the drawing in the database relating to the specific url
function addLineToUrl(line, path) {
    getLinesForUrl(path, (lines) => {
        lines.push(line);
        var queryString = "update boards set drawing = '" + JSON.stringify(lines) + 
            "' where path = '" + path + "';";
        con.query(queryString, function(err, rows, fields) {
            if (err) throw err;
        });
    });
}

// clears the drawing in the database.
function resetLinesForUrl(path) {
    var queryString = "update boards set drawing = '[]' where path = '" + path + "';";
    con.query(queryString, function(err, rows, fields) {
        if (err) throw err;
    });
}

// retrieves the lines for the url that is specified
// this function is asynchronous and could possibly take a while
// If you want to do something with the lines retrieved pass in a successFunc
// that takes a signle line
function getLinesForUrl(path, successFunc) {
    var queryString = "select drawing from boards where path = '" + path + "';";
    con.query(queryString, function(err, rows, fields) {
        if (err) throw err;
        for (var i in rows)
            successFunc(JSON.parse(rows[i].drawing));
    });
}

server.listen(port, () => console.log(`Listening on port ${port}`))