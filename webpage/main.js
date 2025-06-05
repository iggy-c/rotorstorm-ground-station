let socket;
const logDiv = document.getElementById('log');
let msgArr = [];
var border_width = 3
var radius_width = 0
var xlabel_disp = false
var ylabel_disp = false

let csvRows = [];  // Will store all CSV rows as strings
let csvIndex = 0;  // Track the current row
let csvInterval = null;  // Interval timer

//map
var map = L.map('map').setView([37.3854661, -79.0655761], 14);
var wmap = L.map('wmap').setView([37.3854661, -79.0655761], 14);
// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
//     // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// }).addTo(map);
// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
//     // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// }).addTo(wmap);
// L.tileLayer.mbTiles('webpage/osm-2020-02-10-v3.11_us_virginia.mbtiles').addTo(map);
// L.tileLayer.mbTiles('webpage/osm-2020-02-10-v3.11_us_virginia.mbtiles').addTo(wmap);
L.tileLayer('http://localhost:3000/services/va/tiles/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 14
}).addTo(map);
L.tileLayer('http://localhost:3000/services/va/tiles/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 14
}).addTo(wmap);


var latlngs = [];

var polyline = L.polyline(latlngs, {color: 'red', weight: 8,}).addTo(map);
var polyline = L.polyline(latlngs, {color: 'red', weight: 8,}).addTo(wmap);

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
    // polyline.addLatLng([msgArr[21].slice(0,2) + "." + msgArr[21].slice(2), msgArr[22].slice(0,3) + "." + msgArr[22].slice(3)]); //FIX
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

document.getElementById('prime-btn').addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("CMD,3194,MEC,RELEASE,OFF");
        logMessage(`Sent command: CMD,3194,MEC,RELEASE,OFF`);
    } else {
        logMessage('WebSocket is not connected');
    }
});

document.getElementById('disengage-btn').addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("CMD,3194,MEC,RELEASE,ON");
        logMessage(`Sent command: CMD,3194,MEC,RELEASE,ON`); //todo
    } else {
        logMessage('WebSocket is not connected');
    }
});

document.getElementById('cal-btn').addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("CMD,3194,CAL");
        logMessage(`Sent command: CMD,3194,CAL`);
    } else {
        logMessage('WebSocket is not connected');
    }
});

document.getElementById("switch3").addEventListener("change", function() {
        if (this.checked) {
            socket.send("CMD,3194,CX,ON");
            // todo
        } else {
            socket.send("CMD,3194,CX,OFF");
        }
});

document.getElementById('clr-btn').addEventListener('click', () => {
    var chart_full_lst = [chart_a, chart_acc, chart_m, chart_v, chart_t]
    // removeData(chart_v)
    chart_full_lst.forEach((item) => {
        removeData(item);
    });
    latlngs = [] //TODO
});

document.getElementById('sim-enable-btn').addEventListener('click', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("CMD,3194,SIM,ENABLE");
        logMessage(`Sent command: CMD,3194,SIM,ENABLE`); //todo
    } else {
        logMessage('WebSocket is not connected');
    }
    displayFile();

});

document.getElementById('sim-activate-btn').addEventListener('click', () => {
    
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("CMD,3194,SIM,ACTIVATE");
        logMessage(`Sent command: CMD,3194,SIM,ACTIVATE`); //todo
    } else {
        logMessage('WebSocket is not connected');
    }
    
    if (csvRows.length === 0) {
        logMessage("No CSV data loaded.");
        return;
    }

    if (csvInterval !== null) return; // Prevent multiple intervals

    csvInterval = setInterval(() => {
        if (csvIndex >= csvRows.length) {
            clearInterval(csvInterval);
            csvInterval = null;
            return;
        }

        const currentRow = csvRows[csvIndex];
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(`CMD,3194,SIMP,${currentRow}`);
            logMessage(`CMD,3194,SIMP,${currentRow}`);
        }

        csvIndex++;
    }, 1000); // 1 second interval
});

document.getElementById('sim-disable-btn').addEventListener('click', () => {
    
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("CMD,3194,SIM,DISABLE");
        logMessage(`Sent command: CMD,3194,SIM,DISABLE`); //todo
    } else {
        logMessage('WebSocket is not connected');
    }
    
    if (csvInterval !== null) {
        clearInterval(csvInterval);
        csvInterval = null;
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
                title: { display: xlabel_disp, text: 'Time' }
            },
            y: {
                title: { display: ylabel_disp, text: 'Volts' },
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
                title: { display: xlabel_disp, text: 'Time' }
            },
            y: {
                title: { display: ylabel_disp, text: 'Altitude' },
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
                title: { display: xlabel_disp, text: 'Time' }
            },
            y: {
                title: { display: ylabel_disp, text: 'Temperature' },
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
                title: { display: xlabel_disp, text: 'Time' }
            },
            y: {
                title: { display: ylabel_disp, text: 'Magnetism' },
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
                label: 'Acceleration R (m/s²)',
                data: [], // Y-axis data
                borderColor: 'rgba(0, 255, 0, 1)',
                backgroundColor: 'rgba(0, 255, 0, 1)',
                borderWidth: border_width
            },
            {
                label: 'Acceleration P (m/s²)',
                data: [], // Y-axis data
                borderColor: 'rgba(255, 0, 0, 1)',
                backgroundColor: 'rgba(255, 0, 0, 1)',
                borderWidth: border_width
            },
            {
                label: 'Acceleration Y (m/s²)',
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
                title: { display: xlabel_disp, text: 'Time' }
            },
            y: {
                title: { display: ylabel_disp, text: 'Acceleration' },
                beginAtZero: true
            }
        }
    }
});


const chartlst = [chart_v, chart_a, chart_t];
const chart_data = []

// Function to update the chart with new data
function updateChart() {
    // prevent undefined access
    if (msgArr.length >= 9 && msgArr[0].toString().includes("3194")) {
        // Add new x-axis label (based on the length of the labels array)
        chartlst.forEach((chart, index) => {
            chart.data.labels.push(chart.data.labels.length); // Increment x-axis labels
            
            // Update chart with new y-axis data
            const chart_data = [msgArr[8], msgArr[5], msgArr[6]]; // Extract data for each chart
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

function removeData(chart) {
    chart.data.labels = [];
    chart.data.datasets.forEach((dataset) => {
        dataset.data = [];
    });
    chart.update();
}


document.addEventListener("DOMContentLoaded", () => {
    function displayFile() {
        const fileInput = document.getElementById('fileInput');
        const target = document.querySelector('#last-command .dynamic');

        if (fileInput && target && fileInput.files.length > 0) {
            const file = fileInput.files[0];

            if (file.type === "text/csv" || file.name.endsWith('.csv')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const lines = e.target.result.split('\n').filter(line => line.trim().length > 0);
                    csvRows = lines;
                    csvIndex = 0;

                    target.textContent = lines[0]?.trim() || "CSV is empty.";
                };
                reader.readAsText(file);
            } else {
                target.textContent = "Please select a CSV file.";
            }
        }
    }

    window.displayFile = displayFile;
});
