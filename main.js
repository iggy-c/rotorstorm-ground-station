let socket;
const logDiv = document.getElementById('log');

// Add a log message
function logMessage(message) {
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight; // Auto-scroll
}

// Connect to WebSocket
document.getElementById('connect-btn').addEventListener('click', () => {
    const url = document.getElementById('ws-url').value;

    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
    logMessage('Connected to WebSocket server');
    document.getElementById('send-btn').disabled = false;
    });

    socket.addEventListener('message', (event) => {
    logMessage(`Received: ${event.data}`);
    });

    socket.addEventListener('close', () => {
    logMessage('Disconnected from WebSocket server');
    document.getElementById('send-btn').disabled = true;
    });

    socket.addEventListener('error', (error) => {
    logMessage(`Error: ${error.message}`);
    });
});

// Send a message to the WebSocket server
document.getElementById('send-btn').addEventListener('click', () => {
    const message = document.getElementById('message').value;
    if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(message);
    logMessage(`Sent: ${message}`);
    document.getElementById('message').value = '';
    } else {
    logMessage('WebSocket is not connected');
    }
});