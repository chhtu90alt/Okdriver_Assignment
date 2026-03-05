// Connect to the WebSocket server
const socket = io('http://localhost:5000');

// Chart instances
let violationChart, riskChart;

// Initialize charts
function initCharts() {
    const ctx1 = document.getElementById('violationChart').getContext('2d');
    violationChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Speeding', 'Harsh Braking', 'Drowsiness'],
            datasets: [{
                label: 'Violations by Type',
                data: [0, 0, 0],
                backgroundColor: ['#e74c3c', '#f39c12', '#9b59b6']
            }]
        }
    });

    const ctx2 = document.getElementById('riskChart').getContext('2d');
    riskChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Average Risk Score Over Time',
                data: [],
                borderColor: '#3498db',
                fill: false
            }]
        },
        options: {
            scales: {
                x: { display: false }
            }
        }
    });
}

// Update statistics cards
function updateStats(stats) {
    document.getElementById('totalTrips').innerText = stats.totalTrips;
    document.getElementById('liveDrivers').innerText = stats.liveDrivers;
    document.getElementById('violationCount').innerText = stats.violationCount;
    document.getElementById('avgRiskScore').innerText = stats.avgRiskScore;
}

// Add a new alert card
function addAlert(event) {
    const alertsDiv = document.getElementById('alerts');
    const alertCard = document.createElement('div');
    alertCard.className = `alert-card ${event.type}`;
    
    let message = `${event.type.replace('_', ' ')} alert`;
    if (event.speed && event.speed > 80) {
        message += ` - Speed ${event.speed} km/h (⚠️ RED ALERT)`;
    } else {
        message += ` - ${event.details || 'no details'}`;
    }
    
    alertCard.innerText = message;
    alertsDiv.prepend(alertCard);

    // Keep only the latest 5 alerts
    if (alertsDiv.children.length > 5) {
        alertsDiv.removeChild(alertsDiv.lastChild);
    }
}

// Add a row to the events table
function addEventToTable(event) {
    const tbody = document.querySelector('#eventsTable tbody');
    const row = document.createElement('tr');
    
    const time = new Date(event.timestamp).toLocaleTimeString();
    const driver = event.Trip ? event.Trip.driverName : 'Unknown';
    const speed = event.speed ? `${event.speed} km/h` : '-';
    
    row.innerHTML = `
        <td>${time}</td>
        <td>${driver}</td>
        <td>${event.type}</td>
        <td>${speed}</td>
        <td>${event.details || '-'}</td>
    `;
    
    tbody.prepend(row);
    if (tbody.children.length > 10) {
        tbody.removeChild(tbody.lastChild);
    }
}

// Update the violation chart
function updateViolationChart(events) {
    const counts = { speeding: 0, harsh_braking: 0, drowsiness: 0 };
    events.forEach(e => {
        counts[e.type]++;
    });
    violationChart.data.datasets[0].data = [counts.speeding, counts.harsh_braking, counts.drowsiness];
    violationChart.update();
}

// Keep history of risk scores for the line chart
const riskHistory = [];

function updateRiskChart(avgRiskScore) {
    riskHistory.push(avgRiskScore);
    if (riskHistory.length > 20) riskHistory.shift();
    riskChart.data.datasets[0].data = riskHistory;
    riskChart.update();
}

// Fetch initial data from REST API
async function fetchInitialData() {
    try {
        const statsRes = await fetch('http://localhost:5000/api/stats');
        const stats = await statsRes.json();
        updateStats(stats);
        updateRiskChart(stats.avgRiskScore);

        const eventsRes = await fetch('http://localhost:5000/api/events/recent');
        const events = await eventsRes.json();
        
        events.forEach(addEventToTable);
        updateViolationChart(events);
        events.slice(0,5).forEach(addAlert);
    } catch (err) {
        console.error('Error fetching initial data:', err);
    }
}

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('new-event', (event) => {
    console.log('New event:', event);
    addAlert(event);
    addEventToTable(event);
    
    fetch('http://localhost:5000/api/stats')
        .then(res => res.json())
        .then(stats => {
            updateStats(stats);
            updateRiskChart(stats.avgRiskScore);
        })
        .catch(console.error);
    
    fetch('http://localhost:5000/api/events/recent')
        .then(res => res.json())
        .then(events => updateViolationChart(events))
        .catch(console.error);
});

socket.on('stats-update', (stats) => {
    updateStats(stats);
    updateRiskChart(stats.avgRiskScore);
});

// Initialize on page load
window.onload = () => {
    initCharts();
    fetchInitialData();
};