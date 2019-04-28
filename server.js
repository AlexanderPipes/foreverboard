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
        var connectionPath = url.parse(socket.request.headers.referer).pathname;

        initNewUrlIfNeeded(connectionPath);

        socket.on('Drawn', (line, path) => {
            addLineToUrl(line, path);
            io.sockets.emit('Drawn', line, path)
        });

        socket.on('Clear', (path) => {
            resetLinesForUrl(path);
            getLinesForUrl(connectionPath, (lines) => {
                io.sockets.emit('fullRefresh', lines, connectionPath);
            });
        });

        getLinesForUrl(connectionPath, (lines) => {
            io.sockets.emit('fullRefresh', lines, connectionPath);
        });
    })
}

function initNewUrlIfNeeded(path) {
    var queryString = "insert ignore into boards values ('" + path + "','[]');";
    con.query(queryString, function(err, rows, fields) {
        if (err) throw err;
    });
}

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

function resetLinesForUrl(path) {
    var queryString = "update boards set drawing = '[]' where path = '" + path + "';";
    con.query(queryString, function(err, rows, fields) {
        if (err) throw err;
    });
}

function getLinesForUrl(path, successFunc) {
    var queryString = "select drawing from boards where path = '" + path + "';";
    con.query(queryString, function(err, rows, fields) {
        if (err) throw err;
        for (var i in rows)
            successFunc(JSON.parse(rows[i].drawing));
    });
}

server.listen(port, () => console.log(`Listening on port ${port}`))