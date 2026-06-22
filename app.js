// Global State
let userProfile = { 
    lat: '32.864', lon: '-108.222', // Defaults
    skinType: 'combination', allergies: '', concerns: [], goals: [], wakeTime: '', sleepTime: '' 
};
let loggedFaceZones = {}; let loggedBodyZones = {}; 
let liveData = { dew: 0, uv: 0, aqi: 0, pressure: 0 };
let currentDrawnCard = "None Drawn Today";

// ZONES
const faceZones = [
    { id: 'f1', name: 'Forehead Center', x: 50, y: 15 }, { id: 'f2', name: 'Forehead Left', x: 30, y: 22 },
    { id: 'f3', name: 'Forehead Right', x: 70, y: 22 }, { id: 'f4', name: 'Nose Bridge', x: 50, y: 46 },
    { id: 'f5', name: 'Nose Tip', x: 50, y: 64 }, { id: 'f6', name: 'Under Eye Left', x: 35, y: 52 },
    { id: 'f7', name: 'Under Eye Right', x: 65, y: 52 }, { id: 'f8', name: 'Cheek Left', x: 25, y: 65 },
    { id: 'f9', name: 'Cheek Right', x: 75, y: 65 }, { id: 'f10', name: 'Jaw Left', x: 28, y: 80 },
    { id: 'f11', name: 'Jaw Right', x: 72, y: 80 }, { id: 'f12', name: 'Chin', x: 50, y: 88 }
];

const bodyZones = [
    { id: 'b1', name: 'Chest/Pecs', x: 25, y: 35 }, { id: 'b2', name: 'Abs', x: 25, y: 48 },
    { id: 'b3', name: 'L. Ant. Shoulder', x: 15, y: 32 }, { id: 'b4', name: 'R. Ant. Shoulder', x: 35, y: 32 },
    { id: 'b5', name: 'L. Quad', x: 20, y: 68 }, { id: 'b6', name: 'R. Quad', x: 30, y: 68 },
    { id: 'b7', name: 'L. Shin', x: 21, y: 85 }, { id: 'b8', name: 'R. Shin', x: 29, y: 85 },
    { id: 'b9', name: 'Traps', x: 75, y: 30 }, { id: 'b10', name: 'Lats', x: 75, y: 42 },
    { id: 'b11', name: 'Glutes', x: 75, y: 55 }, { id: 'b12', name: 'L. Hamstring', x: 70, y: 70 },
    { id: 'b13', name: 'R. Hamstring', x: 80, y: 70 }, { id: 'b14', name: 'L. Calf', x: 70, y: 85 }, { id: 'b15', name: 'R. Calf', x: 80, y: 85 }
];

window.onload = () => {
    setTimeout(() => { document.getElementById('enter-btn').style.display = 'block'; }, 1500);
    loadData();
    fetchRealData();
    setTimeout(() => { renderMapTargets('face'); renderMapTargets('body'); }, 100);
    renderJournals(); renderPAO(); checkWeeklyAura();
};

function enterApp() {
    const loader = document.getElementById('loading-screen');
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
}

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// LOCATION & SETTINGS
function grabLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            document.getElementById('lat-input').value = position.coords.latitude.toFixed(4);
            document.getElementById('lon-input').value = position.coords.longitude.toFixed(4);
            saveSettings();
            fetchRealData(); // Refresh data with new location
            alert("Location grabbed! APIs updated for hyper-local accuracy.");
        }, (error) => { alert("Location access denied or failed. Please type manually."); });
    } else { alert("Geolocation not supported by this browser."); }
}

function saveSettings() {
    userProfile.lat = document.getElementById('lat-input').value;
    userProfile.lon = document.getElementById('lon-input').value;
    userProfile.skinType = document.getElementById('skin-type-select').value;
    userProfile.allergies = document.getElementById('allergy-input').value;
    userProfile.concerns = Array.from(document.querySelectorAll('#profile-tags input:checked')).map(cb => cb.value);
    userProfile.wakeTime = document.getElementById('wake-time').value;
    userProfile.sleepTime = document.getElementById('sleep-time').value;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

function loadData() {
    const savedProf = localStorage.getItem('userProfile');
    if (savedProf) {
        userProfile = JSON.parse(savedProf);
        document.getElementById('lat-input').value = userProfile.lat || '';
        document.getElementById('lon-input').value = userProfile.lon || '';
        document.getElementById('skin-type-select').value = userProfile.skinType || 'combination';
        document.getElementById('allergy-input').value = userProfile.allergies || '';
        document.getElementById('wake-time').value = userProfile.wakeTime || '';
        document.getElementById('sleep-time').value = userProfile.sleepTime || '';
        document.querySelectorAll('#profile-tags input').forEach(cb => {
            if(userProfile.concerns && userProfile.concerns.includes(cb.value)) cb.checked = true;
        });
    }
    loggedFaceZones = JSON.parse(localStorage.getItem('loggedFaceZones')) || {};
    loggedBodyZones = JSON.parse(localStorage.getItem('loggedBodyZones')) || {};
    let pillowDate = localStorage.getItem('pillowDate');
    if(pillowDate) document.getElementById('pillowcase-date').innerText = pillowDate;
}

// WEATHER, AQI, UV LOGIC
async function fetchRealData() {
    let lat = userProfile.lat || '32.864'; let lon = userProfile.lon || '-108.222';
    try {
        // Fetch Weather & UV
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=relative_humidity_2m,dewpoint_2m,surface_pressure,uv_index&temperature_unit=fahrenheit`);
        const weatherData = await weatherRes.json();
        const cur = weatherData.current;
        
        // Fetch Air Quality
        const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5`);
        const aqiData = await aqiRes.json();
        const pm25 = aqiData.current.pm2_5;

        // Store live data
        liveData.dew = cur.dewpoint_2m;
        liveData.uv = cur.uv_index;
        liveData.aqi = pm25;
        liveData.pressure = (cur.surface_pressure * 0.02953).toFixed(2);

        // Update UI
        document.getElementById('live-dew').innerText = `${liveData.dew.toFixed(1)}°F`;
        document.getElementById('live-uv').innerText = liveData.uv;
        document.getElementById('live-aqi').innerText = `${liveData.aqi} µg/m³`;
        document.getElementById('live-pressure').innerText = `${liveData.pressure} inHg`;

        // Biological Impact Warnings
        let dewAction = cur.relative_humidity_2m < 30 ? "Barrier Risk: Occlusive day. Transepidermal water loss is high." : "Atmosphere balanced. Humectants are safe.";
        document.getElementById('action-dew').innerText = dewAction;

        let uvEl = document.getElementById('action-uv');
        if (liveData.uv >= 5) {
            uvEl.style.display = 'block';
            uvEl.innerText = "UV Risk: Lipid barrier degradation active. Reapply SPF every 2 hours.";
        } else { uvEl.style.display = 'none'; }

        let aqiEl = document.getElementById('action-aqi');
        if (liveData.aqi > 12) {
            aqiEl.style.display = 'block';
            aqiEl.innerText = "Air Quality Risk: High PM2.5. Particles penetrating pores causing oxidative stress. PM double cleanse mandated. Restrict deep breathing contortion holds.";
        } else { aqiEl.style.display = 'none'; }

        document.getElementById('live-flex-action').innerText = cur.surface_pressure < 1010 ? "High environmental resistance today. Tissues expanding." : "Prime conditioning weather!";
    } catch (error) { console.error("API Error", error); }
}

// MAP RENDERING
function renderMapTargets(mapType) {
    const container = document.getElementById(`${mapType}-map-container`);
    container.querySelectorAll('.target-dot').forEach(el => el.remove());
    const zones = mapType === 'face' ? faceZones : bodyZones;
    const loggedData = mapType === 'face' ? loggedFaceZones : loggedBodyZones;
    zones.forEach(zone => {
        let dot = document.createElement('div');
        dot.className = 'target-dot'; dot.style.left = `${zone.x}%`; dot.style.top = `${zone.y}%`; dot.title = zone.name;
        if (loggedData[zone.id]) { dot.style.backgroundColor = loggedData[zone.id]; dot.style.borderStyle = 'solid'; dot.style.borderColor = '#fff'; }
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
        if (type.toUpperCase() === 'N') alert("🚨 NERVE TENSION DETECTED! Stop static stretching here.");
    }
    renderMapTargets(mapType);
}

function clearMarkers(mapType) {
    if(mapType === 'face') { loggedFaceZones = {}; localStorage.removeItem('loggedFaceZones'); } 
    else { loggedBodyZones = {}; localStorage.removeItem('loggedBodyZones'); }
    renderMapTargets(mapType);
}

// HYGIENE & PAO
function logHygiene(type) {
    let d = new Date().toLocaleDateString(); localStorage.setItem('pillowDate', d); document.getElementById('pillowcase-date').innerText = d;
}
function logPAO() {
    let prod = document.getElementById('pao-product').value; let months = parseInt(document.getElementById('pao-months').value);
    if(!prod || !months) return;
    let expireDate = new Date(); expireDate.setMonth(expireDate.getMonth() + months);
    let paos = JSON.parse(localStorage.getItem('paoLogs')) || [];
    paos.push({ name: prod, expire: expireDate.toLocaleDateString() });
    localStorage.setItem('paoLogs', JSON.stringify(paos)); renderPAO();
}
function renderPAO() {
    let paos = JSON.parse(localStorage.getItem('paoLogs')) || [];
    let ul = document.getElementById('pao-list'); ul.innerHTML = '';
    paos.forEach(p => { ul.innerHTML += `<li>🧴 <strong>${p.name}</strong> - Expires: <span style="color:red;">${p.expire}</span></li>`; });
}

function calculateFascia() {
    let sleep = document.getElementById('sleep-hours').value; let water = document.getElementById('water-oz').value;
    let res = document.getElementById('fascia-result'); res.style.display = 'block';
    if(sleep < 5 && liveData.pressure < 29.8) res.innerText = "🚨 HIGH STIFFNESS. Extend warm-up.";
    else if (water < 30) res.innerText = "⚠️ POOR FASCIA GLIDE. Tissues are dehydrated.";
    else res.innerText = "✨ Fascia is primed and lubricated!";
}

// 50 CARD DECK
const deck = [
    // Lunar
    { suit: "Lunar", name: "🌑 The Void Moon", meaning: "A period of darkness. Rest completely. No active holds." },
    { suit: "Lunar", name: "🌓 The Waxing Pull", meaning: "Building energy. Prep, hydrate, and gather resources." },
    { suit: "Lunar", name: "🌕 The Full Pull", meaning: "Maximum intensity. Push your peaks." },
    { suit: "Lunar", name: "🌗 The Waning Crescent", meaning: "Declutter. Change pillowcases, stretch passively." },
    { suit: "Lunar", name: "🩸 The Blood Moon", meaning: "Harsh internal shift. Expect unusual tension/reactions." },
    { suit: "Lunar", name: "🌔 The Gibbous", meaning: "Hold your contortion poses just a few seconds longer." },
    { suit: "Lunar", name: "🌒 The Sliver", meaning: "Fragile state. Treat barrier and joints delicately." },
    { suit: "Lunar", name: "💫 The Halo", meaning: "Protection. Maintain exactly what you are doing." },
    { suit: "Lunar", name: "🌊 The High Tide", meaning: "Fluidity. Fascia will glide beautifully." },
    { suit: "Lunar", name: "🏜️ The Neap Tide", meaning: "Stagnation. Stiff and dry. Double hydration." },
    { suit: "Lunar", name: "☄️ The Meteor", meaning: "Sudden spark. Try a brand new technique." },
    { suit: "Lunar", name: "🌌 The Deep Sky", meaning: "Introspection. Focus entirely on physical sensation." },
    { suit: "Lunar", name: "☀️ The Solstice", meaning: "Peak heat. Primed for deep conditioning." },
    // Botanical
    { suit: "Botanical", name: "🌿 The Node", meaning: "Cut dead weight from your life or routine." },
    { suit: "Botanical", name: "🍂 Root Rot", meaning: "Suffocation. Strip routine back to the bare minimum." },
    { suit: "Botanical", name: "🧬 The Variegation", meaning: "Mutation. Introduce a new active or goal." },
    { suit: "Botanical", name: "🪢 The Aerial Root", meaning: "Reaching for support. Use props today." },
    { suit: "Botanical", name: "🍄 The Spore", meaning: "Hidden growth beneath the surface." },
    { suit: "Botanical", name: "🥀 The Blight", meaning: "Environmental stress is compromising your system." },
    { suit: "Botanical", name: "🌲 The Taproot", meaning: "Deep grounding. Focus strictly on foundation." },
    { suit: "Botanical", name: "🌱 The Sapling", meaning: "Fragile new beginnings. Protect progress." },
    { suit: "Botanical", name: "🌳 The Canopy", meaning: "Over-extension. Stop spreading energy too thin." },
    { suit: "Botanical", name: "🪨 Dormancy", meaning: "A natural biological pause. Wait it out." },
    { suit: "Botanical", name: "✂️ The Graft", meaning: "Forced integration. Combining routines." },
    { suit: "Botanical", name: "🌻 Phototropism", meaning: "Chasing light. Follow what brings joy today." },
    { suit: "Botanical", name: "🪴 The Rhizome", meaning: "Lateral movement. Becoming more stable." },
    // Barrier
    { suit: "Barrier", name: "🛡️ The Occlusive", meaning: "Seal it in. Protect your energy and moisture." },
    { suit: "Barrier", name: "🧪 The Acid", meaning: "Burn it away. Deep cleanses and harsh truths." },
    { suit: "Barrier", name: "💧 The Humectant", meaning: "Draw it in. Absorb positive energy." },
    { suit: "Barrier", name: "🧈 The Lipid", meaning: "Structural repair. Thick moisturizers, soft stretching." },
    { suit: "Barrier", name: "🌋 The Purge", meaning: "Push through the current breakout or emotional block." },
    { suit: "Barrier", name: "🧼 The Cleanse", meaning: "Wash the slate clean. Forgive yourself, start fresh." },
    { suit: "Barrier", name: "🧱 The Matrix", "meaning": "Foundation cracked. Halt intense actives." },
    { suit: "Barrier", name: "🧫 The Microbiome", meaning: "Delicate balance. Highly reactive today." },
    { suit: "Barrier", name: "🫧 The Ferment", meaning: "Slow progress. Trust daily habits." },
    { suit: "Barrier", name: "🧴 The Emollient", meaning: "Smoothing things over. Diplomacy and massage." },
    { suit: "Barrier", name: "☀️ The Shield", meaning: "Absolute defense. Impenetrable boundaries." },
    { suit: "Barrier", name: "🩹 The Patch", meaning: "Spot treatment. Fix the one specific thing bothering you." },
    // Vessel
    { suit: "Vessel", name: "🕸️ The Fascia", meaning: "Everything is connected. Look at the whole chain." },
    { suit: "Vessel", name: "⚡ The Nerve", meaning: "Danger. Back away from what causes stress." },
    { suit: "Vessel", name: "⚓ The Resistance", meaning: "Heavy gravity. Today will feel harder. Rest is okay." },
    { suit: "Vessel", name: "〰️ Fluidity", meaning: "Zero friction. Push limits and enjoy the glide." },
    { suit: "Vessel", name: "🌬️ The Breath", meaning: "Oxygen deficit. Inhale, reset, down-regulate." },
    { suit: "Vessel", name: "🦴 The Joint", meaning: "Structural limits. Do not force past the wall." },
    { suit: "Vessel", name: "🧠 The Synapse", meaning: "Mental block. Regulate before stretching." },
    { suit: "Vessel", name: "🩸 The Marrow", meaning: "Cellular exhaustion. Cancel active conditioning." },
    { suit: "Vessel", name: "🩰 Alignment", meaning: "Symmetry. Left and right are in harmony." },
    { suit: "Vessel", name: "🫀 The Pulse", meaning: "High heart rate required. Do cardio prep." },
    { suit: "Vessel", name: "🌊 The Lymph", meaning: "Stagnant fluid. Do inversions or massage." },
    { suit: "Vessel", name: "⚖️ The Anchor", meaning: "Stability over flexibility. Work muscle engagement." }
];

function drawCard() {
    let card = deck[Math.floor(Math.random() * deck.length)];
    currentDrawnCard = `${card.name} (${card.suit})`;
    document.getElementById('card-name').innerText = card.name;
    document.getElementById('card-suit').innerText = `Suit of ${card.suit}`;
    document.getElementById('card-meaning').innerText = card.meaning;
}

// AUTO-SYNTHESIS JOURNAL
function compileJournal() {
    const warning = document.getElementById('journal-warning');
    const dump = document.getElementById('brain-dump').value;
    
    // Check missing crucial routine steps
    let missing = [];
    if (!document.getElementById('step-pm-cleanse').checked) missing.push("PM Double Cleanse");
    if (!document.getElementById('step-spf').checked) missing.push("SPF");
    
    if (missing.length > 0) {
        warning.style.display = "block";
        warning.innerText = `🚨 Clinical Warning: You are synthesizing without completing critical steps: ${missing.join(", ")}. Barrier risk elevated.`;
    } else { warning.style.display = "none"; }

    let routineChecked = Array.from(document.querySelectorAll('.routine-checklist input:checked')).map(cb => cb.parentNode.innerText.trim());

    let j = {
        date: new Date().toLocaleString(),
        weather: `Dew: ${liveData.dew}°F | UV: ${liveData.uv} | PM2.5: ${liveData.aqi} | Press: ${liveData.pressure}`,
        routine: routineChecked.length > 0 ? routineChecked.join(", ") : "None Logged",
        card: currentDrawnCard,
        thoughts: dump || "No notes today."
    };

    let journals = JSON.parse(localStorage.getItem('journals')) || [];
    journals.unshift(j);
    localStorage.setItem('journals', JSON.stringify(journals));
    
    // Reset inputs
    document.querySelectorAll('.routine-checklist input').forEach(cb => cb.checked = false);
    document.getElementById('brain-dump').value = '';
    renderJournals();
}

function renderJournals() {
    let journals = JSON.parse(localStorage.getItem('journals')) || [];
    let ul = document.getElementById('journal-list');
    ul.innerHTML = '';
    journals.forEach(j => {
        let li = document.createElement('li');
        li.innerHTML = `
            <span class="journal-header">${j.date}</span>
            <div class="journal-data">
                <strong>Atmosphere:</strong> ${j.weather}<br>
                <strong>Routine Completed:</strong> ${j.routine}<br>
                <strong>Oracle Alignment:</strong> ${j.card}
            </div>
            <em>"${j.thoughts}"</em>
        `;
        ul.appendChild(li);
    });
}

function checkWeeklyAura() {
    let now = new Date();
    if (now.getDay() === 0 && now.getHours() >= 12) {
        let lastStampStr = localStorage.getItem('lastAuraStampDate');
        if (!lastStampStr || now.toDateString() !== new Date(parseInt(lastStampStr)).toDateString()) {
            generateAuraLogic(now);
        } else { loadCurrentAura(); }
    } else { loadCurrentAura(); }
}
function forceAuraGeneration() { generateAuraLogic(new Date()); }

function generateAuraLogic(now) {
    let journals = JSON.parse(localStorage.getItem('journals')) || [];
    let name = "The Blank Slate Stamp";
    let advice = "Not enough journal synthesis this week to form an Aura!";
    
    if (journals.length > 0) {
        // Simple mock logic for now based on if they logged at all
        name = "✨ The Synthesis Stamp ✨";
        advice = "You successfully compiled journals this week. Keep tracking.";
    }
    localStorage.setItem('currentAura', JSON.stringify({ name, advice }));
    localStorage.setItem('lastAuraStampDate', now.getTime().toString());
    displayAura(name, advice);
}
function loadCurrentAura() {
    let saved = localStorage.getItem('currentAura');
    if (saved) { let p = JSON.parse(saved); displayAura(p.name, p.advice); }
}
function displayAura(name, advice) {
    document.getElementById('aura-name').innerText = name;
    document.getElementById('aura-advice').innerText = advice;
}
