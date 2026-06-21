// Function to handle tab switching
function openTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(button => button.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Function to fetch REAL weather data
async function fetchRealData() {
    // Coordinates for Pinos Altos
    const lat = 32.864;
    const lon = -108.222;

    try {
        // UPDATED API URL: Now explicitly asking for dewpoint_2m directly from the source
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,dewpoint_2m,wind_speed_10m,surface_pressure&temperature_unit=fahrenheit&wind_speed_unit=mph`);
        const data = await response.json();
        const current = data.current;

        // 1. Get exact Dew Point and Humidity directly from API
        const dewPoint = current.dewpoint_2m;
        const humidity = current.relative_humidity_2m;

        // Update Skincare UI
        document.getElementById('live-dew').innerText = `${dewPoint.toFixed(1)}°F`;
        document.getElementById('live-wind').innerText = `${current.wind_speed_10m} mph`;

        // Dynamic Skincare Logic
        let skinAction = "";
        if (humidity < 30) {
            skinAction = "Action: Occlusive Day! Skip exfoliants, grab the heavy ceramides.";
        } else if (humidity > 60) {
            skinAction = "Action: High Humidity. Opt for lighter gel moisturizers today to prevent congestion.";
        } else {
            skinAction = "Action: Balanced atmosphere! Your standard routine is safe today.";
        }
        document.getElementById('live-skin-action').innerText = skinAction;

        // 2. Update Flexibility UI (Convert hPa pressure to inHg)
        const pressure_inHg = (current.surface_pressure * 0.02953).toFixed(2);
        document.getElementById('live-pressure').innerText = `${pressure_inHg} inHg`;

        // Dynamic Flexibility Logic
        let flexAction = "";
        if (current.surface_pressure < 1010) { 
            flexAction = "Focus: High resistance today. Tissues are expanding. Do an extended heat warm-up before deep oversplits.";
        } else {
            flexAction = "Focus: Prime conditioning weather! Great day to push active flexibility.";
        }
        document.getElementById('live-flex-action').innerText = flexAction;

    } catch (error) {
        console.error("Error fetching the API data:", error);
        document.getElementById('live-skin-action').innerText = "Data error. Check connection.";
    }
}

// Function to handle logging data
function logData(type) {
    const date = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let listId, input1Id, input2Id;

    if (type === 'skin') {
        listId = 'skin-log-list';
        input1Id = 'skin-feel';
        input2Id = 'skin-products';
    } else if (type === 'flex') {
        listId = 'flex-log-list';
        input1Id = 'flex-focus';
        input2Id = 'flex-notes';
    }

    const input1 = document.getElementById(input1Id);
    const input2 = document.getElementById(input2Id);

    if (input1.value === '' && input2.value === '') {
        alert("Please enter something to log!");
        return;
    }

    const ul = document.getElementById(listId);
    const li = document.createElement('li');
    li.innerHTML = `<strong>[${date}]</strong> ${input1.value} <br> <em>Notes/Products:</em> ${input2.value}`;
    
    ul.prepend(li);
    input1.value = '';
    input2.value = '';
}

// Digital Oracle Logic
const oracleDeck = [
    { name: "The Static", meaning: "A day of high noise. Clear your mind, turn off notifications, and focus strictly on your physical body." },
    { name: "The Dew Drop", meaning: "Embrace moisture and flexibility. Drink water, focus on hydration in your routine, and flow gently into your stretches." },
    { name: "The Pressure Drop", meaning: "Atmospheric shifts are causing tension. Take it easy today; do not push past your normal limits. Rest is productive." },
    { name: "The Sun Flare", meaning: "High energy day. Perfect for pushing into new active flexibility goals. Protect your skin, but embrace the heat." },
    { name: "The Root System", meaning: "Focus on grounding. Look at the foundation of your routines rather than the final results. Check your basics." }
];

function drawCard() {
    const randomCard = oracleDeck[Math.floor(Math.random() * oracleDeck.length)];
    document.getElementById('card-name').innerText = `🎴 ${randomCard.name}`;
    document.getElementById('card-meaning').innerText = randomCard.meaning;
}

// Fetch the real weather data on load
fetchRealData();
