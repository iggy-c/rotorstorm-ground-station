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
        updateChart();
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
const ctx_v = document.getElementById('Voltage').getContext('2d');
const chart_v = new Chart(ctx_v, {
    type: 'line',
    data: {
        labels: [], // X-axis labels (e.g., 0, 1, 2, ...)
        datasets: [{
            label: 'Volts (V)',
            data: [], // Y-axis data
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: { display: true, text: 'Time' }
            },
            y: {
                title: { display: true, text: 'Volts' },
                beginAtZero: true
            }
        }
    }
});

const ctx_p = document.getElementById('Pressure').getContext('2d');
const chart_p = new Chart(ctx_p, {
    type: 'line',
    data: {
        labels: [], // X-axis labels (e.g., 0, 1, 2, ...)
        datasets: [{
            label: 'Presssure (kPa)',
            data: [], // Y-axis data
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: { display: true, text: 'Time' }
            },
            y: {
                title: { display: true, text: 'Pressure' },
                beginAtZero: true
            }
        }
    }
});

const ctx_a = document.getElementById('Altitude').getContext('2d');
const chart_a = new Chart(ctx_a, {
    type: 'line',
    data: {
        labels: [], // X-axis labels (e.g., 0, 1, 2, ...)
        datasets: [{
            label: 'Altitude (m)',
            data: [], // Y-axis data
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: { display: true, text: 'Time' }
            },
            y: {
                title: { display: true, text: 'Altitude' },
                beginAtZero: true
            }
        }
    }
});

const ctx_t = document.getElementById('Temperature').getContext('2d');
const chart_t = new Chart(ctx_t, {
    type: 'line',
    data: {
        labels: [], // X-axis labels (e.g., 0, 1, 2, ...)
        datasets: [{
            label: 'Temperature (C)',
            data: [], // Y-axis data
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: { display: true, text: 'Time' }
            },
            y: {
                title: { display: true, text: 'Temperature' },
                beginAtZero: true
            }
        }
    }
});

const chartlst = [chart_v, chart_p, chart_a, chart_t];
const chart_data = []

// Function to update the chart with new data
function updateChart() {
    // Ensure we have at least 9 elements in msgArr to prevent undefined access
    if (msgArr.length >= 9) {
        // Add new x-axis label (based on the length of the labels array)
        chartlst.forEach((chart, index) => {
            chart.data.labels.push(chart.data.labels.length); // Increment x-axis labels
            
            // Update chart with new y-axis data
            const chart_data = [msgArr[8], msgArr[7], msgArr[5], msgArr[6]]; // Extract data for each chart
            chart.data.datasets[0].data.push(chart_data[index]); // Assign the correct value to the chart

            // Update the chart
            chart.update();
        });
    } else {
        console.error("Not enough data in msgArr to update the charts");
    }
}

function darkMode() {
    var element = document.body;
    element.classList.toggle("dark-mode");
} 

document.getElementById('darkModeToggle').addEventListener('click',()=>{
    if (document.documentElement.getAttribute('data-bs-theme') == 'dark') {
        document.documentElement.setAttribute('data-bs-theme','light')
    }
    else {
        document.documentElement.setAttribute('data-bs-theme','dark')
    }
})