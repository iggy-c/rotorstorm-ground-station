let socket;
const logDiv = document.getElementById('log');
let msgArr = [];


// Add a log message
function logMessage(message) {
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight; // Auto-scroll
}

function update() {
    const elements = document.querySelectorAll('[data-label]'); // Select labeled elements
    const chunkSize = Math.ceil(msgArr.length / elements.length);

    elements.forEach((element, index) => {
        const chunk = msgArr.slice(index * chunkSize, (index + 1) * chunkSize);
        const dynamicPart = element.querySelector('.dynamic');
        dynamicPart.textContent = chunk.join(', '); // Update only the dynamic part
    }); 

}

function foo(message_arr) {
    console.log("foo() called with:", message_arr);
    if (message_arr.length > 0) {
        document.getElementById("teamnum").innerHTML = message_arr[0];
    } else {
        console.error("message_arr is empty or invalid");
        document.getElementById("teamnum").innerHTML = "No data";
    }
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

        // Attempt to split the data from websocket
        try {
            msgArr = event.data.split(",");
            foo(msgArr);
        } catch (error) {
            console.error("Error splitting data:", error);
        }

        update();
        updateChart(msgArr[0]);
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

// Initialize the chart
const ctx = document.getElementById('myChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // X-axis labels (e.g., 0, 1, 2, ...)
        datasets: [{
            label: 'Dynamic Data',
            data: [], // Y-axis data
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: { display: true, text: 'Index' }
            },
            y: {
                title: { display: true, text: 'Value' },
                beginAtZero: true
            }
        }
    }
});

// Function to update the chart with new data
function updateChart(newData) {
    // Add new x-axis labels (index based)
    chart.data.labels.push(chart.data.labels.length);

    // Add new y-axis data
    chart.data.datasets[0].data.push(newData);

    // Update the chart
    chart.update();
}
