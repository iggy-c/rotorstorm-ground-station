let socket;
const logDiv = document.getElementById('log');
let msgArr = [];
var border_width = 3
var radius_width = 0


//map
var map = L.map('map').setView([38, -78], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var latlngs = [
    [37.13, -78.60],
    [37.15, -78.61],
    [37.14, -78.62],
    [37.145, -78.625],
    [37.15, -78.685],
    [37.16, -78.701],
    [37.155, -78.705],
    [37.158, -78.71],
    [37.159, -78.709],
];

var polyline = L.polyline(latlngs, {color: 'red', weight: 8,}).addTo(map);

// // zoom the map to the polyline
// map.fitBounds(polyline.getBounds());


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

    //map update
    polyline.addLatLng([msgArr[21], msgArr[22]]);

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
            // foo(msgArr);
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

// Charts
const ctx_v = document.getElementById('Voltage').getContext('2d');
const chart_v = new Chart(ctx_v, {
    type: 'line',
    data: {
        labels: [], // X-axis labels (e.g., 0, 1, 2, ...)
        datasets: [{
            label: 'Volts (V)',
            data: [], // Y-axis data
            borderColor: 'rgb(107, 107, 189)',
            backgroundColor: 'rgba(107, 107, 189, 1)',
            borderWidth: border_width 
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        elements: {
            point:{
                radius: radius_width
            }
        },
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
            borderColor: 'rgb(107, 107, 189)',
            backgroundColor: 'rgba(107, 107, 189, 1)',
            borderWidth: border_width
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        elements: {
            point:{
                radius: radius_width
            }
        },
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
            borderColor: 'rgb(107, 107, 189)',
            backgroundColor: 'rgba(107, 107, 189, 1)',
            borderWidth: border_width
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        beginAtZero: false,
        elements: {
            point:{
                radius: radius_width
            }
        },
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
            borderColor: 'rgb(107, 107, 189)',
            backgroundColor: 'rgba(107, 107, 189, 1)',
            borderWidth: border_width
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        elements: {
            point:{
                radius: radius_width
            }
        },
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

const ctx_m = document.getElementById('Magnetism').getContext('2d');
const chart_m = new Chart(ctx_m, {
    type: 'line',
    data: {
        labels: [], // X-axis labels (e.g., 0, 1, 2, ...)
        datasets: [
            {
                label: 'Magnetism R (gauss)',
                data: [], // Y-axis data
                borderColor: 'rgba(0, 255, 0, 1)',
                backgroundColor: 'rgba(0, 255, 0, 1)',
                borderWidth: border_width
            },
            {
                label: 'Magnetism P (gauss)',
                data: [], // Y-axis data
                borderColor: 'rgba(255, 0, 0, 1)',
                backgroundColor: 'rgba(255, 0, 0, 1)',
                borderWidth: border_width
            },
            {
                label: 'Magnetism Y (gauss)',
                data: [], // Y-axis data
                borderColor: 'rgb(0, 0, 255)',
                backgroundColor: 'rgba(0, 0, 255, 1)',
                borderWidth: border_width
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        elements: {
            point:{
                radius: radius_width
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Time' }
            },
            y: {
                title: { display: true, text: 'Magnetism' },
                beginAtZero: true
            }
        }
    }
});

const ctx_acc = document.getElementById('Acceleration').getContext('2d');
const chart_acc = new Chart(ctx_acc, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Acceleration R (m/s^2)',
                data: [], // Y-axis data
                borderColor: 'rgba(0, 255, 0, 1)',
                backgroundColor: 'rgba(0, 255, 0, 1)',
                borderWidth: border_width
            },
            {
                label: 'Acceleration P (m/s^2)',
                data: [], // Y-axis data
                borderColor: 'rgba(255, 0, 0, 1)',
                backgroundColor: 'rgba(255, 0, 0, 1)',
                borderWidth: border_width
            },
            {
                label: 'Acceleration Y (m/s^2)',
                data: [], // Y-axis data
                borderColor: 'rgb(0, 0, 255)',
                backgroundColor: 'rgba(0, 0, 255, 1)',
                borderWidth: border_width
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        elements: {
            point:{
                radius: radius_width
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Time' }
            },
            y: {
                title: { display: true, text: 'Acceleration' },
                beginAtZero: true
            }
        }
    }
});


const chartlst = [chart_v, chart_p, chart_a, chart_t];
const chart_data = []

// Function to update the chart with new data
function updateChart() {
    // prevent undefined access
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
        chart_acc.data.labels.push(chart_acc.data.labels.length);
        chart_acc.data.datasets[0].data.push(msgArr[12]);
        chart_acc.data.datasets[1].data.push(msgArr[13]);
        chart_acc.data.datasets[2].data.push(msgArr[14]);
        chart_acc.update();
        chart_m.data.labels.push(chart_m.data.labels.length);
        chart_m.data.datasets[0].data.push(msgArr[15]);
        chart_m.data.datasets[1].data.push(msgArr[16]);
        chart_m.data.datasets[2].data.push(msgArr[17]);
        chart_m.update();
        

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

