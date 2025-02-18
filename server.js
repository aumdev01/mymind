const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use(express.json());

let links = [];

io.on('connection', (socket) => {
    console.log('A user connected');

    // Send initial links to the newly connected client
    socket.emit('links', links);

    // Handle new link addition
    socket.on('addLink', (link) => {
        links.push(link);
        io.emit('links', links);
    });

    // Handle link update
    socket.on('updateLink', (updatedLink) => {
        links = links.map(link => link.id === updatedLink.id ? updatedLink : link);
        io.emit('links', links);
    });

    // Handle link deletion
    socket.on('deleteLink', (linkId) => {
        links = links.filter(link => link.id !== linkId);
        io.emit('links', links);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});