const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;

// Store connected players
let players = [];

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket server is running");
});

// Attach WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (socket) => {
  console.log('🟢 New client connected');

  socket.id = generateId(); // Assign unique ID

  // Listen for messages from this client
  socket.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      // Handle join request
      if (msg.type === 'join' && msg.name) {
        players.push({ id: socket.id, name: msg.name });
        console.log(`👤 ${msg.name} joined`);

        // Broadcast updated player list to all
        broadcast({
          type: 'player_list',
          players: players
        });
      }

      if (msg.type === "ready") {
        const player = players.find(p => p.id === socket.id);
        if (player) player.isReady = true;
    
        // Broadcast updated ready states
        broadcast({ type: "player_ready", players });
    
        // Check if both players are ready
        if (players.length === 2 && players.every(p => p.isReady)) {
          broadcast({ type: "start_game" });
        }
      }
      
      // Future: handle game actions, etc.
    } catch (err) {
      console.error('❌ Error parsing message:', err);
    }
  });

  socket.on('close', () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
    players = players.filter(p => p.id !== socket.id);

    broadcast({
      type: 'player_list',
      players: players
    });
  });
});

// Utility: Broadcast to all clients
function broadcast(obj) {
  const message = JSON.stringify(obj);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Utility: Generate unique ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
