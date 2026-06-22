// Global State
let userProfile = { skinType: 'balanced', wakeTime: '', sleepTime: '' };
let loggedFaceZones = {}; // Stores { id: color }
let loggedBodyZones = {}; 
let currentPressure = 0;

// PREDEFINED ZONES BASED ON UPLOADED IMAGES
const faceZones = [
    { id: 'f1', name: 'Forehead Center (1)', x: 50, y: 15 },
    { id: 'f2', name: 'Forehead Left (2)', x: 30, y: 22 },
    { id: 'f3', name: 'Forehead Right (1)', x: 70, y: 22 },
    { id: 'f4', name: 'Nose Bridge (4)', x: 50, y: 46 },
    { id: 'f5', name: 'Nose Tip (5)', x: 50, y: 64 },
    { id: 'f6', name: 'Under Eye Left (6)', x: 35, y: 52 },
    { id: 'f7', name: 'Under Eye Right (6)', x: 65, y: 52 },
    { id: 'f8', name: 'Cheek Left (8)', x: 25, y: 65 },
    { id: 'f9', name: 'Cheek Right (8)', x: 75, y: 65 },
    { id: 'f10', name: 'Jaw/Lower Cheek Left (9)', x: 28, y: 80 },
    { id: 'f11', name: 'Jaw/Lower Cheek Right (9)', x: 72, y: 80 },
    { id: 'f12', name: 'Chin (11)', x: 50, y: 88 }
];

const bodyZones = [
    // Anterior (Left half of image)
    { id: 'b1', name: 'Neck Anterior', x: 25, y: 15 },
    { id: 'b2', name: 'Left Shoulder', x: 15, y: 24 },
    { id: 'b3', name: 'Right Shoulder', x: 35, y: 24 },
    { id: 'b4', name: 'Left Pec', x: 19, y: 30 },
    { id: 'b5', name: 'Right Pec', x: 31, y: 30 },
    { id: 'b6', name: 'Abs', x: 25, y: 45 },
    { id: 'b7', name: 'Left Quad', x: 20, y: 65 },
    { id: 'b8', name: 'Right Quad', x: 30, y: 65 },
    { id: 'b9', name: 'Left Shin', x: 21, y: 85 },
    { id: 'b10', name: 'Right Shin', x: 29, y: 85 },
    // Posterior (Right half of image)
    { id: 'b11', name: 'Traps', x: 75, y: 18 },
    { id: 'b12', name: 'Left Lat', x: 68, y: 35 },
    { id: 'b13', name: 'Right Lat', x: 82, y: 35 },
    { id: 'b14', name: 'Left Glute', x: 70, y: 55 },
    { id: 'b15', name: 'Right Glute', x: 80, y: 55 },
    { id: 'b16', name: 'Left Hamstring', x: 70, y: 70 },
    { id: 'b17', name: 'Right Hamstring', x: 80, y: 70 },
    { id: 'b18', name: 'Left Calf', x: 71, y: 85 },
    { id: 'b19', name: 'Right Calf', x: 79, y: 85 }
];

window.onload = () => {
    loadData();
    fetchRealData();
    renderMapTargets('face');
    renderMapTargets('body');
    renderLogs();
    renderPAO();
    checkWeeklyAura();
};

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

function saveProfile() {
    userProfile.skinType = document.getElementById('skin-type-select').value;
    userProfile.wakeTime = document.getElementById('wake-time').value;
    userProfile.sleepTime = document.getElementById('sleep-time').value;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

function loadData() {
    const savedProf = localStorage.getItem('userProfile');
    if (savedProf) {
        userProfile = JSON.parse(savedProf);
        document.getElementById('skin-type-select').value = userProfile.skinType;
        document.getElementById('wake-time').value = userProfile.wakeTime;
        document.getElementById('sleep-time').value = userProfile.sleepTime;
    }
    loggedFaceZones = JSON.parse(localStorage.getItem('loggedFaceZones')) || {};
    loggedBodyZones = JSON.parse(localStorage.getItem('loggedBodyZones')) || {};
    
    let pillowDate = localStorage.getItem('pillowDate');
    if(pillowDate) document.getElementById('pillowcase-date').innerText = pillowDate;
}

async function fetchRealData() {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=32.864&longitude=-108.222&current=temperature_2m,relative_humidity_2m,dewpoint_2m,surface_pressure&temperature_unit=fahrenheit`);
        const data = await response.json();
        
        document.getElementById('live-dew').innerText = `${data.current.dewpoint_2m.toFixed(1)}°F`;
        let skinAction = data.current.relative_humidity_2m < 30 ? "Occlusive Day! Barrier risk high." : "Atmosphere balanced.";
        document.getElementById('live-skin-action').innerText = skinAction;

        currentPressure = (data.current.surface_pressure * 0.02953).toFixed(2);
        document.getElementById('live-pressure').innerText = `${currentPressure} inHg`;
        document.getElementById('live-flex-action').innerText = data.current.surface_pressure < 1010 ? "High environmental resistance today." : "Prime conditioning weather!";
    } catch (error) { console.error("API Error"); }
}

// 2D Map Rendering & Logic
function renderMapTargets(mapType) {
    const container = document.getElementById(`${mapType}-map-container`);
    container.querySelectorAll('.target-dot').forEach(el => el.remove());

    const zones = mapType === 'face' ? faceZones : bodyZones;
    const loggedData = mapType === 'face' ? loggedFaceZones : loggedBodyZones;

    zones.forEach(zone => {
        let dot = document.createElement('div');
        dot.className = 'target-dot';
        dot.style.left = `${zone.x}%`;
        dot.style.top = `${zone.y}%`;
        dot.title = zone.name;

        // If it's already logged, set the solid color
        if (loggedData[zone.id]) {
            dot.style.backgroundColor = loggedData[zone.id];
            dot.style.borderStyle = 'solid';
            dot.style.borderColor = '#fff';
        }

        dot.onclick = () => handleZoneClick(mapType, zone.id);
        container.appendChild(dot);
    });
}

function handleZoneClick(mapType, zoneId) {
    if (mapType === 'face') {
        let type = prompt("Type 'P' for Purge or 'R' for Reaction:");
        if (!type) return;
        loggedFaceZones[zoneId] = type.toUpperCase() === 'P' ? '#33cc33' : '#ff3333';
        localStorage.setItem('loggedFaceZones', JSON.stringify(loggedFaceZones));
    } else {
        let type = prompt("Type 'M' for Muscle (dull) or 'N' for Nerve (sharp):");
        if (!type) return;
        loggedBodyZones[zoneId] = type.toUpperCase() === 'M' ? '#3399ff' : '#ffcc00';
        localStorage.setItem('loggedBodyZones', JSON.stringify(loggedBodyZones));
        if (type.toUpperCase() === 'N') {
            alert("🚨 NERVE TENSION DETECTED! Stop static stretching in this area immediately.");
        }
    }
    renderMapTargets(mapType);
}

function clearMarkers(mapType) {
    if(mapType === 'face') { 
        loggedFaceZones = {}; 
        localStorage.removeItem('loggedFaceZones'); 
    } else { 
        loggedBodyZones = {}; 
        localStorage.removeItem('loggedBodyZones'); 
    }
    renderMapTargets(mapType);
}

// Trackers & Calculations
function logPAO() {
    let prod = document.getElementById('pao-product').value;
    let months = parseInt(document.getElementById('pao-months').value);
    if(!prod || !months) return;

    let expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + months);
    
    let paos = JSON.parse(localStorage.getItem('paoLogs')) || [];
    paos.push({ name: prod, expire: expireDate.toLocaleDateString() });
    localStorage.setItem('paoLogs', JSON.stringify(paos));
    renderPAO();
}

function renderPAO() {
    let paos = JSON.parse(localStorage.getItem('paoLogs')) || [];
    let ul = document.getElementById('pao-list');
    ul.innerHTML = '';
    paos.forEach(p => {
        let li = document.createElement('li');
        li.innerHTML = `🧴 <strong>${p.name}</strong> - Expires: <span style="color:red;">${p.expire}</span>`;
        ul.appendChild(li);
    });
}

function logHygiene(type) {
    let d = new Date().toLocaleDateString();
    localStorage.setItem('pillowDate', d);
    document.getElementById('pillowcase-date').innerText = d;
}

function calculateFascia() {
    let sleep = document.getElementById('sleep-hours').value;
    let water = document.getElementById('water-oz').value;
    let res = document.getElementById('fascia-result');
    res.style.display = 'block';
    
    if(sleep < 5 && currentPressure < 29.8) {
        res.innerText = "🚨 HIGH STIFFNESS. Low sleep + dropping pressure. Extend warm-up by 15 mins.";
    } else if (water < 30) {
        res.innerText = "⚠️ POOR FASCIA GLIDE. Tissues are dehydrated and sticky. Do not push static oversplits.";
    } else {
        res.innerText = "✨ Fascia is primed and lubricated! Safe to push peaks.";
    }
}

function checkAsymmetry() {
    let l = parseInt(document.getElementById('left-side').value);
    let r = parseInt(document.getElementById('right-side').value);
    let res = document.getElementById('asymmetry-result');
    res.style.display = 'block';
    
    if(Math.abs(l - r) >= 3) {
        let weak = l < r ? "Left" : "Right";
        res.innerText = `⚖️ Imbalance Detected. Start routine on the ${weak} side, hold 20% longer, and end on the ${weak} side.`;
    } else {
        res.innerText = "✨ Fluidity is balanced today.";
    }
}

// Master Logs
function saveMasterLog() {
    let b = document.getElementById('barrier-rating').value;
    let f = document.getElementById('flex-rating').value;
    let n = document.getElementById('master-notes').value;
    
    let logs = JSON.parse(localStorage.getItem('masterLogs')) || [];
    logs.unshift({ date: new Date().toLocaleString(), timestamp: new Date().getTime(), barrier: b, flex: f, notes: n, pressure: currentPressure });
    localStorage.setItem('masterLogs', JSON.stringify(logs));
    renderLogs();
}

function renderLogs() {
    let logs = JSON.parse(localStorage.getItem('masterLogs')) || [];
    let ul = document.getElementById('master-log-list');
    ul.innerHTML = '';
    logs.forEach(l => {
        let li = document.createElement('li');
        li.innerHTML = `<span class="log-date">${l.date} | ${l.pressure} inHg</span>Barrier: ${l.barrier}/10 | Flex: ${l.flex}/10<br><em>${l.notes}</em>`;
        ul.appendChild(li);
    });
}

// Intuitive Oracle
const deck = [
    { suit: "Lunar", name: "The Void Moon", meaning: "A period of darkness. Rest completely. No active holds." },
    { suit: "Lunar", name: "The Eclipse", meaning: "Sudden shifting of energy. Expect unusual tension today." },
    { suit: "Botanical", name: "The Variegation", meaning: "A mutation. Introduce a new active ingredient or stretch." },
    { suit: "Botanical", name: "Root Rot", meaning: "You are suffocating your routine. Pull back, do less." },
    { suit: "Barrier", name: "The Occlusive", meaning: "Seal things in. Protect your energy and your skin." },
    { suit: "Barrier", name: "The Acid", meaning: "Burn away the dead weight. A day for harsh truths and deep cleanses." },
    { suit: "Vessel", name: "The Fascia", meaning: "Drink water. Focus entirely on fluidity and gliding motions." },
    { suit: "Vessel", name: "The Nerve", meaning: "Do not push. If it burns or tingles, back away immediately." }
];

function drawCard() {
    let card = deck[Math.floor(Math.random() * deck.length)];
    document.getElementById('card-name').innerText = `🎴 ${card.name}`;
    document.getElementById('card-suit').innerText = `Suit of ${card.suit}`;
    document.getElementById('card-meaning').innerText = card.meaning;
}

// Weekly Aura Stamp Check
function checkWeeklyAura() {
    let now = new Date();
    if (now.getDay() === 0 && now.getHours() >= 12) {
        let lastStampStr = localStorage.getItem('lastAuraStampDate');
        let generateNew = false;
        
        if (!lastStampStr) { generateNew = true; } 
        else {
            let lastDate = new Date(parseInt(lastStampStr));
            if (now.toDateString() !== lastDate.toDateString()) { generateNew = true; }
        }

        if (generateNew) { generateAuraLogic(now); } 
        else { loadCurrentAura(); }
    } else { loadCurrentAura(); }
}

function forceAuraGeneration() { generateAuraLogic(new Date()); }

function generateAuraLogic(now) {
    let logs = JSON.parse(localStorage.getItem('masterLogs')) || [];
    let oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    let recentLogs = logs.filter(l => l.timestamp >= oneWeekAgo);

    let name = "The Blank Slate Stamp";
    let advice = "You didn't log enough data this week to form an Aura!";

    if (recentLogs.length > 0) {
        let avgBarrier = recentLogs.reduce((sum, l) => sum + parseInt(l.barrier || 0), 0) / recentLogs.length;
        let avgFlex = recentLogs.reduce((sum, l) => sum + parseInt(l.flex || 0), 0) / recentLogs.length;

        if (avgBarrier >= 7 && avgFlex >= 7) {
            name = "✨ The Dew Drop Stamp ✨";
            advice = "A highly fluid week. Your barrier is thriving and your active oversplits should feel lubricated. Keep it up.";
        } else if (avgBarrier < 5) {
            name = "🏜️ The Scorched Earth Stamp 🏜️";
            advice = "The atmosphere baked you. Drop the active exfoliants, switch to passive backbends, and hydrate your fascia.";
        } else {
            name = "⚖️ The Equilibrium Stamp ⚖️";
            advice = "A balanced week. You navigated the pressure shifts well. Focus on maintaining your current routines.";
        }
    }

    let auraData = { name: name, advice: advice };
    localStorage.setItem('currentAura', JSON.stringify(auraData));
    localStorage.setItem('lastAuraStampDate', now.getTime().toString());
    displayAura(name, advice);
}

function loadCurrentAura() {
    let saved = localStorage.getItem('currentAura');
    if (saved) {
        let parsed = JSON.parse(saved);
        displayAura(parsed.name, parsed.advice);
    }
}

function displayAura(name, advice) {
    document.getElementById('aura-name').innerText = name;
    document.getElementById('aura-advice').innerText = advice;
}
