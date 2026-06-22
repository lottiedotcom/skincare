// Initialization & State
let userProfile = { skinType: 'balanced', nightOwl: false, stamps: 0 };
let currentPressure = 0; // Stored for logs

// Load saved data on startup
window.onload = () => {
    loadProfile();
    fetchRealData();
    renderStamps();
    renderLogs();
};

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Profile & LocalStorage Logic
function saveProfile() {
    userProfile.skinType = document.getElementById('skin-type-select').value;
    userProfile.nightOwl = document.getElementById('night-owl-toggle').checked;
    localStorage.setItem('wellnessProfile', JSON.stringify(userProfile));
}

function loadProfile() {
    const saved = localStorage.getItem('wellnessProfile');
    if (saved) {
        userProfile = JSON.parse(saved);
        document.getElementById('skin-type-select').value = userProfile.skinType;
        document.getElementById('night-owl-toggle').checked = userProfile.nightOwl;
    }
}

// Real Weather Fetching
async function fetchRealData() {
    const lat = 32.864; const lon = -108.222;
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,dewpoint_2m,wind_speed_10m,surface_pressure&temperature_unit=fahrenheit&wind_speed_unit=mph`);
        const data = await response.json();
        const current = data.current;

        document.getElementById('live-dew').innerText = `${current.dewpoint_2m.toFixed(1)}°F`;
        document.getElementById('live-wind').innerText = `${current.wind_speed_10m} mph`;
        
        let skinAction = current.relative_humidity_2m < 30 ? "Action: Occlusive Day! Grab heavy ceramides." : "Action: Atmosphere balanced.";
        document.getElementById('live-skin-action').innerText = skinAction;

        currentPressure = (current.surface_pressure * 0.02953).toFixed(2);
        document.getElementById('live-pressure').innerText = `${currentPressure} inHg`;
        
        let flexAction = current.surface_pressure < 1010 ? "Focus: High resistance today. Warm up well." : "Focus: Prime conditioning weather!";
        document.getElementById('live-flex-action').innerText = flexAction;

    } catch (error) {
        console.error("API Error", error);
    }
}

// Deep Ingredient Scanner
const toxicDict = {
    universalBad: ['hydrogen peroxide', 'baking soda', 'sodium bicarbonate', 'rubbing alcohol', 'isopropyl alcohol', 'lemon juice', 'walnut shell', 'bleach'],
    harshActives: ['glycolic acid', 'lactic acid', 'salicylic acid', 'retinol', 'tretinoin', 'ascorbic acid', 'vitamin c', 'witch hazel'],
    comedogenics: ['coconut oil', 'isopropyl myristate', 'cocoa butter', 'mineral oil', 'lanolin', 'algae extract', 'seaweed']
};

function scanIngredients() {
    const input = document.getElementById('ingredient-input').value.toLowerCase();
    const resultBox = document.getElementById('scanner-result');
    resultBox.style.display = 'block';
    resultBox.className = 'scanner-box'; // Reset classes
    resultBox.innerHTML = '';

    if (input.trim() === '') {
        resultBox.innerHTML = "Please paste an ingredient list first.";
        return;
    }

    let foundToxic = [];
    let foundHarsh = [];
    let foundCongesting = [];

    toxicDict.universalBad.forEach(ing => { if (input.includes(ing)) foundToxic.push(ing); });
    toxicDict.harshActives.forEach(ing => { if (input.includes(ing)) foundHarsh.push(ing); });
    toxicDict.comedogenics.forEach(ing => { if (input.includes(ing)) foundCongesting.push(ing); });

    let htmlOutput = "";

    if (foundToxic.length > 0) {
        htmlOutput += `🚨 <strong>ABSOLUTE NO-GO:</strong> Detected ${foundToxic.join(", ")}. Do not put this on your face.<br><br>`;
        resultBox.classList.add('scan-danger');
    }

    if (userProfile.skinType === 'compromised' && foundHarsh.length > 0) {
        htmlOutput += `⚠️ <strong>BARRIER CLASH:</strong> Detected ${foundHarsh.join(", ")}. Skip these while your barrier is compromised/dry!<br><br>`;
        if (!resultBox.classList.contains('scan-danger')) resultBox.classList.add('scan-warning');
    }

    if (userProfile.skinType === 'congested' && foundCongesting.length > 0) {
        htmlOutput += `⚠️ <strong>PORE CLOGGER:</strong> Detected ${foundCongesting.join(", ")}. Highly comedogenic for your profile.<br><br>`;
        if (!resultBox.classList.contains('scan-danger')) resultBox.classList.add('scan-warning');
    }

    if (htmlOutput === "") {
        htmlOutput = "✨ <strong>Clear!</strong> No severe red flags or profile clashes found in this formulation.";
        resultBox.classList.add('scan-safe');
    }

    resultBox.innerHTML = htmlOutput;
}

// Contortion Hold Timer
let timerInterval;
function startTimer() {
    let timeLeft = 60;
    const display = document.getElementById('timer-display');
    const btn = document.getElementById('timer-btn');
    
    clearInterval(timerInterval);
    btn.innerText = "Hold...";
    
    timerInterval = setInterval(() => {
        timeLeft--;
        display.innerText = `00:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            display.innerText = "01:00";
            btn.innerText = "Start 60s Hold";
            alert("Hold complete! Log your tension mapping in the Daily Logs tab.");
        }
    }, 1000);
}

// Comprehensive Master Logging
function saveComprehensiveLog() {
    const sleep1 = document.getElementById('sleep-block-1').value;
    const sleep2 = document.getElementById('sleep-block-2').value;
    const barrier = document.getElementById('barrier-rating').value;
    const skinNotes = document.getElementById('routine-notes').value;
    const flexRating = document.getElementById('flex-rating').value;
    const flexNotes = document.getElementById('contortion-notes').value;

    if (!barrier && !flexRating) {
        alert("Please enter at least a barrier or flexibility rating to save a log.");
        return;
    }

    const logEntry = {
        date: new Date().toLocaleString(),
        pressureAtTime: currentPressure,
        sleep: `${sleep1} | ${sleep2}`,
        barrier: barrier,
        skinNotes: skinNotes,
        flexRating: flexRating,
        flexNotes: flexNotes
    };

    let logs = JSON.parse(localStorage.getItem('wellnessLogs')) || [];
    logs.unshift(logEntry); // Add to beginning
    localStorage.setItem('wellnessLogs', JSON.stringify(logs));
    
    // Reward for logging
    awardStamp();
    renderLogs();

    // Clear inputs
    document.querySelectorAll('#logs input, #logs textarea').forEach(el => el.value = '');
}

function renderLogs() {
    const logs = JSON.parse(localStorage.getItem('wellnessLogs')) || [];
    const ul = document.getElementById('master-log-list');
    ul.innerHTML = '';

    logs.forEach(log => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="log-date">${log.date} (Pressure: ${log.pressureAtTime} inHg)</span>
            <strong>Rest:</strong> ${log.sleep || "Not logged"}<br>
            <strong>Barrier Rating:</strong> ${log.barrier}/10 - ${log.skinNotes}<br>
            <strong>Flexibility Rating:</strong> ${log.flexRating}/10 - ${log.flexNotes}
        `;
        ul.appendChild(li);
    });
}

// Habit Logging (Propagations)
function logHabit() {
    const plant = document.getElementById('plant-name').value;
    const goal = document.getElementById('flex-goal').value;
    if(plant && goal) {
        const ul = document.getElementById('habit-list');
        const li = document.createElement('li');
        li.innerHTML = `🌱 <strong>${plant}</strong> synced with 🧘‍♀️ <strong>${goal}</strong>`;
        ul.prepend(li);
        document.getElementById('plant-name').value = '';
        document.getElementById('flex-goal').value = '';
    }
}

// Digital Oracle
const oracleDeck = [
    { suit: "Botanical", name: "The Node", meaning: "A sign to propagate a new idea or cut dead weight." },
    { suit: "Botanical", name: "Root Rot", meaning: "Over-watering a situation. Pull back and let things dry out." },
    { suit: "Barrier", name: "The Occlusive", meaning: "Seal things in. Protect your energy and lock in your work." },
    { suit: "Cosmos", name: "The Waning Crescent", meaning: "A period of rest and decluttering before a new cycle." }
];

function drawCard() {
    let deckToDrawFrom = [...oracleDeck];
    if (userProfile.skinType === 'compromised') {
        const soothingCards = oracleDeck.filter(c => c.suit === "Barrier" || c.suit === "Botanical");
        deckToDrawFrom = deckToDrawFrom.concat(soothingCards);
    }
    const randomCard = deckToDrawFrom[Math.floor(Math.random() * deckToDrawFrom.length)];
    document.getElementById('card-name').innerText = `🎴 ${randomCard.name}`;
    document.getElementById('card-meaning').innerText = randomCard.meaning;
}

// Aura Board Stamp Logic
function awardStamp() {
    userProfile.stamps += 1;
    saveProfile();
    renderStamps();
}

function renderStamps() {
    const grid = document.getElementById('stamp-grid');
    grid.innerHTML = ''; 
    for (let i = 0; i < userProfile.stamps; i++) {
        const stamp = document.createElement('div');
        stamp.className = 'pixel-stamp';
        stamp.innerText = '✨'; 
        grid.appendChild(stamp);
    }
}
