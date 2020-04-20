// Require needed modules and initialize Express app
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware for GET /events endpoint
function eventsHandler(req, res, next) {
  // Mandatory headers and http status to keep connection open
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  // After client opens connection send all nests as string
  const data = `data: ${JSON.stringify(conversations[req.params.id])}\n\n`;
  res.write(data);

  // Generate an id based on timestamp and save res
  // object of client connection on clients list
  // Later we'll iterate it and send updates to each client
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients[req.params.id] = clients[req.params.id] ? [...clients[req.params.id], newClient] : [newClient];

  // When client closes connection we update the clients list
  // avoiding the disconnected one
  req.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients[req.params.id] = clients[req.params.id].filter(c => c.id !== clientId);
  });
}

// Iterate clients list and use write res object method to send new nest
function sendEventsToAll(id, newMessage) {
  if (clients[id]) {
    clients[id].forEach(c => c.res.write(`data: [${JSON.stringify(newMessage)}]\n\n`))
  }
}

// Middleware for POST /:id endpoint
async function addMessage(req, res, next) {
  const newMessage = req.body;
  conversations[req.params.id] = conversations[req.params.id] && conversations[req.params.id]? [...conversations[req.params.id], newMessage] : [newMessage]
  // Send recently added nest as POST result
  res.json(newMessage)

  // Invoke iterate and send function
  return sendEventsToAll(req.params.id, newMessage);
}

// Set cors and bodyParser middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


// Define endpoints
app.post('/:id', addMessage);
app.get('/:id', eventsHandler);
app.get('/status', (req, res) => res.json({clients: clients.length}));
const distDir = __dirname;
console.log(distDir);
app.use(express.static(distDir));

const PORT = 3000;

let clients = {};
let conversations = {}

// Start server on 3000 port
app.listen(PORT, () => console.log(`Swamp Events service listening on port ${PORT}`));