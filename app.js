// Initialization & State
let userProfile = {
    skinType: 'balanced',
    nightOwl: false,
    stamps: 0
};

// Load saved data on startup
window.onload = () => {
    loadProfile();
    fetchRealData();
    renderStamps();
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

        const pressure = (current.surface_pressure * 0.02953).toFixed(2);
        document.getElementById('live-pressure').innerText = `${pressure} inHg`;
        
        let flexAction = current.surface_pressure < 1010 ? "Focus: High resistance today. Warm up well." : "Focus: Prime conditioning weather!";
        document.getElementById('live-flex-action').innerText = flexAction;

    } catch (error) {
        console.error("API Error", error);
    }
}

// Ingredient Scanner Clash Detector
function scanIngredients() {
    const input = document.getElementById('ingredient-input').value.toLowerCase();
    const resultBox = document.getElementById('scanner-result');
    resultBox.style.display = 'block';

    if (input.trim() === '') {
        resultBox.innerText = "Please paste an ingredient list first.";
        return;
    }

    let clashes = [];
    if (userProfile.skinType === 'compromised') {
        if (input.includes('alcohol denat') || input.includes('salicylic acid') || input.includes('glycolic')) {
            clashes.push("Harsh Exfoliants/Alcohols detected. Skip this while barrier is compromised!");
        }
    } else if (userProfile.skinType === 'congested') {
        if (input.includes('coconut oil') || input.includes('shea butter') || input.includes('mineral oil')) {
            clashes.push("Heavy comedogenics detected. May increase congestion today.");
        }
    }

    if (clashes.length > 0) {
        resultBox.innerText = `⚠️ CLASH DETECTED: ${clashes.join(" ")}`;
        resultBox.style.color = "#cc0000";
    } else {
        resultBox.innerText = "✨ Clear! No major profile clashes found in this formulation.";
        resultBox.style.color = "#009933";
    }
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
            alert("Hold complete! Where did you map tension today?");
            // Here we can later trigger the visual body map pop-up
        }
    }, 1000);
}

// Habit Logging
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

// Digital Oracle (Framework for the 50-card deck)
const oracleDeck = [
    { suit: "Botanical", name: "The Node", meaning: "A sign to propagate a new idea or cut dead weight." },
    { suit: "Botanical", name: "Root Rot", meaning: "Over-watering a situation. Pull back and let things dry out." },
    { suit: "Barrier", name: "The Occlusive", meaning: "Seal things in. Protect your energy and lock in your work." },
    { suit: "Cosmos", name: "The Waning Crescent", meaning: "A period of rest and decluttering before a new cycle." }
    // You can paste the remaining 46 cards directly into this array following this exact format!
];

function drawCard() {
    // Intuitive Draw Logic: If profile is compromised, slightly increase chances of Barrier/Botanical cards
    let deckToDrawFrom = [...oracleDeck];
    if (userProfile.skinType === 'compromised') {
        const soothingCards = oracleDeck.filter(c => c.suit === "Barrier" || c.suit === "Botanical");
        deckToDrawFrom = deckToDrawFrom.concat(soothingCards); // Weighs the deck
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
    grid.innerHTML = ''; // Clear current
    for (let i = 0; i < userProfile.stamps; i++) {
        const stamp = document.createElement('div');
        stamp.className = 'pixel-stamp';
        stamp.innerText = '✨ STAMP'; // Eventually, you can link background images here
        grid.appendChild(stamp);
    }
}
