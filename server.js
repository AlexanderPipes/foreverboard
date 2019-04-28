const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const port = 4001

const app = express()

const server = http.createServer(app)
var currentLines = [];
const io = socketIO(server)

io.on('connection', socket => {

    socket.on('Drawn', (line) => {
        currentLines.push(line);
        io.sockets.emit('Drawn', line)
    });

    socket.on('Clear', () => {
        currentLines = [];
        io.sockets.emit('fullRefresh', currentLines)
    });
    io.sockets.emit('fullRefresh', currentLines);
})

server.listen(port, () => console.log(`Listening on port ${port}`))