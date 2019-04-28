const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const url = require('url')
const port = 4001

const app = express()

const server = http.createServer(app)
var currentLines = {};
const io = socketIO(server)

function initNewUrlIfNeeded(path) {
    if (typeof currentLines[path] === 'undefined')
        currentLines[path] = [];
}

function addLineToUrl(line, path) {
    currentLines[path].push(line);
}

function resetLinesForUrl(path) {
    currentLines[path] = [];
}

function getLinesForUrl(path) {
    return currentLines[path];
}

io.on('connection', socket => {
    var connectionPath = url.parse(socket.request.headers.referer).pathname;

    initNewUrlIfNeeded(connectionPath);

    socket.on('Drawn', (line, path) => {
        addLineToUrl(line, path);
        io.sockets.emit('Drawn', line, path)
    });

    socket.on('Clear', (path) => {
        resetLinesForUrl(path);
        io.sockets.emit('fullRefresh', getLinesForUrl(path), path)
    });

    io.sockets.emit('fullRefresh', getLinesForUrl(connectionPath), connectionPath);
})

server.listen(port, () => console.log(`Listening on port ${port}`))