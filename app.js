// Global State
let userProfile = { 
    lat: '32.864', lon: '-108.222', routine: [],
    skinType: 'combination', allergies: '', concerns: [], goals: [], wakeTime: '', sleepTime: '' 
};
let loggedFaceZones = {}; let loggedBodyZones = {}; 
let liveData = { dew: 0, uv: 0, aqi: 0, pressure: 0 };
let currentDrawnCard = "None Drawn Today";

// 15 FACE ZONES
const faceZones = [
    { id: 1, name: 'Forehead Center', x: 50, y: 15 }, { id: 2, name: 'Forehead Left', x: 30, y: 18 },
    { id: 3, name: 'Forehead Right', x: 70, y: 18 }, { id: 4, name: 'Temple Left', x: 15, y: 35 },
    { id: 5, name: 'Temple Right', x: 85, y: 35 }, { id: 6, name: 'Nose Bridge', x: 50, y: 45 },
    { id: 7, name: 'Nose Tip', x: 50, y: 65 }, { id: 8, name: 'Upper Cheek L', x: 30, y: 55 },
    { id: 9, name: 'Upper Cheek R', x: 70, y: 55 }, { id: 10, name: 'Lower Cheek L', x: 25, y: 70 },
    { id: 11, name: 'Lower Cheek R', x: 75, y: 70 }, { id: 12, name: 'Jaw L', x: 28, y: 85 },
    { id: 13, name: 'Jaw R', x: 72, y: 85 }, { id: 14, name: 'Chin', x: 50, y: 92 },
    { id: 15, name: 'Upper Lip', x: 50, y: 75 }
];

// 31 BODY ZONES
const bodyZones = [
    { id: 1, name: 'Neck', x: 25, y: 15 }, { id: 2, name: 'L Shoulder', x: 15, y: 26 },
    { id: 3, name: 'R Shoulder', x: 35, y: 26 }, { id: 4, name: 'L Bicep', x: 12, y: 40 },
    { id: 5, name: 'R Bicep', x: 38, y: 40 }, { id: 6, name: 'L Forearm', x: 8, y: 55 },
    { id: 7, name: 'R Forearm', x: 42, y: 55 }, { id: 8, name: 'L Pec', x: 18, y: 32 },
    { id: 9, name: 'R Pec', x: 32, y: 32 }, { id: 10, name: 'Upper Abs', x: 25, y: 42 },
    { id: 11, name: 'Lower Abs', x: 25, y: 52 }, { id: 12, name: 'L Oblique', x: 18, y: 48 },
    { id: 13, name: 'R Oblique', x: 32, y: 48 }, { id: 14, name: 'L Quad', x: 18, y: 70 },
    { id: 15, name: 'R Quad', x: 32, y: 70 }, { id: 16, name: 'L Shin', x: 20, y: 88 },
    { id: 17, name: 'R Shin', x: 30, y: 88 }, { id: 18, name: 'Upper Traps', x: 75, y: 18 },
    { id: 19, name: 'L Rear Delt', x: 65, y: 26 }, { id: 20, name: 'R Rear Delt', x: 85, y: 26 },
    { id: 21, name: 'L Tricep', x: 62, y: 40 }, { id: 22, name: 'R Tricep', x: 88, y: 40 },
    { id: 23, name: 'L Lat', x: 68, y: 38 }, { id: 24, name: 'R Lat', x: 82, y: 38 },
    { id: 25, name: 'Lower Back', x: 75, y: 48 }, { id: 26, name: 'L Glute', x: 68, y: 58 },
    { id: 27, name: 'R Glute', x: 82, y: 58 }, { id: 28, name: 'L Hamstring', x: 68, y: 72 },
    { id: 29, name: 'R Hamstring', x: 82, y: 72 }, { id: 30, name: 'L Calf', x: 70, y: 88 },
    { id: 31, name: 'R Calf', x: 80, y: 88 }
];

window.onload = () => {
    setTimeout(() => { document.getElementById('enter-btn').style.display = 'block'; }, 1500);
    loadData();
    fetchRealData();
    setTimeout(() => { renderMapTargets('face'); renderMapTargets('body'); }, 100);
    renderRoutine(); renderProducts(); renderJournals(); checkWeeklyAura();
};

function enterApp() {
    const loader = document.getElementById('loading-screen');
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
}

// SCROLL TO TOP ON TAB CLICK
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// LOCATION & SETTINGS
function grabLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            document.getElementById('lat-input').value = position.coords.latitude.toFixed(4);
            document.getElementById('lon-input').value = position.coords.longitude.toFixed(4);
            saveSettings(); fetchRealData(); 
            alert("Location grabbed! APIs updated for hyper-local accuracy.");
        }, (error) => { alert("Location access denied or failed."); });
    } else { alert("Geolocation not supported."); }
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
        if(!userProfile.routine) userProfile.routine = ["AM Water Rinse", "SPF", "PM Double Cleanse"];
        document.getElementById('lat-input').value = userProfile.lat || '';
        document.getElementById('lon-input').value = userProfile.lon || '';
        document.getElementById('skin-type-select').value = userProfile.skinType || 'combination';
        document.getElementById('allergy-input').value = userProfile.allergies || '';
        document.getElementById('wake-time').value = userProfile.wakeTime || '';
        document.getElementById('sleep-time').value = userProfile.sleepTime || '';
        document.querySelectorAll('#profile-tags input').forEach(cb => {
            if(userProfile.concerns && userProfile.concerns.includes(cb.value)) cb.checked = true;
        });
    } else { userProfile.routine = ["AM Water Rinse", "SPF", "PM Double Cleanse"]; }
    
    loggedFaceZones = JSON.parse(localStorage.getItem('loggedFaceZones')) || {};
    loggedBodyZones = JSON.parse(localStorage.getItem('loggedBodyZones')) || {};
    let pillowDate = localStorage.getItem('pillowDate');
    if(pillowDate) document.getElementById('pillowcase-date').innerText = pillowDate;
}

// ROUTINE BUILDER
function addRoutineStep() {
    let step = document.getElementById('new-routine-step').value;
    if(!step) return;
    userProfile.routine.push(step);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    document.getElementById('new-routine-step').value = '';
    renderRoutine();
}
function removeRoutineStep(index) {
    userProfile.routine.splice(index, 1);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    renderRoutine();
}
function renderRoutine() {
    let setList = document.getElementById('settings-routine-list');
    let skinList = document.getElementById('custom-routine-list');
    setList.innerHTML = ''; skinList.innerHTML = '';
    userProfile.routine.forEach((step, idx) => {
        setList.innerHTML += `<li style="display:flex; justify-content:space-between;">${step} <button class="prod-del" onclick="removeRoutineStep(${idx})">X</button></li>`;
        skinList.innerHTML += `<label class="check-tag"><input type="checkbox" class="routine-chk" value="${step}"> ${step}</label>`;
    });
}

// WEATHER, AQI, UV LOGIC
async function fetchRealData() {
    let lat = userProfile.lat || '32.864'; let lon = userProfile.lon || '-108.222';
    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=relative_humidity_2m,dewpoint_2m,surface_pressure,uv_index&temperature_unit=fahrenheit`);
        const cur = (await weatherRes.json()).current;
        const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5`);
        const pm25 = (await aqiRes.json()).current.pm2_5;

        liveData.dew = cur.dewpoint_2m; liveData.uv = cur.uv_index; liveData.aqi = pm25; liveData.pressure = (cur.surface_pressure * 0.02953).toFixed(2);
        
        document.getElementById('live-dew').innerText = `${liveData.dew.toFixed(1)}°F`;
        document.getElementById('live-uv').innerText = liveData.uv;
        document.getElementById('live-aqi').innerText = `${liveData.aqi} µg/m³`;
        document.getElementById('live-pressure').innerText = `${liveData.pressure} inHg`;

        document.getElementById('action-dew').innerText = cur.relative_humidity_2m < 30 ? "Barrier Risk: Occlusive day. Transepidermal water loss is high." : "Atmosphere balanced. Humectants are safe.";
        let uvEl = document.getElementById('action-uv');
        if (liveData.uv >= 5) { uvEl.style.display = 'block'; uvEl.innerText = "UV Risk: Lipid barrier degradation active. Reapply SPF every 2 hours."; } else { uvEl.style.display = 'none'; }
        let aqiEl = document.getElementById('action-aqi');
        if (liveData.aqi > 12) { aqiEl.style.display = 'block'; aqiEl.innerText = "Air Quality Risk: High PM2.5. Particles penetrating pores causing oxidative stress. PM double cleanse mandated."; } else { aqiEl.style.display = 'none'; }
        document.getElementById('live-flex-action').innerText = cur.surface_pressure < 1010 ? "High environmental resistance today. Tissues expanding." : "Prime conditioning weather!";
    } catch (error) { console.error("API Error", error); }
}

// 2D MAPS (NUMBERED DOTS)
function renderMapTargets(mapType) {
    const container = document.getElementById(`${mapType}-map-container`);
    container.querySelectorAll('.target-dot').forEach(el => el.remove());
    const zones = mapType === 'face' ? faceZones : bodyZones;
    const loggedData = mapType === 'face' ? loggedFaceZones : loggedBodyZones;
    
    zones.forEach(zone => {
        let dot = document.createElement('div');
        dot.className = 'target-dot'; dot.style.left = `${zone.x}%`; dot.style.top = `${zone.y}%`; 
        dot.title = zone.name; dot.innerText = zone.id; // Adds number inside dot
        
        if (loggedData[zone.id]) { 
            dot.style.backgroundColor = loggedData[zone.id].color; 
            dot.style.color = '#fff'; dot.style.borderStyle = 'solid'; 
        }
        dot.onclick = () => handleZoneClick(mapType, zone.id);
        container.appendChild(dot);
    });
}

function handleZoneClick(mapType, zoneId) {
    if (mapType === 'face') {
        let input = prompt("Acne Type:\n1: Cystic\n2: Whitehead\n3: Blackhead\n4: Pustule\n5: Papule");
        if (!input) return;
        let types = {"1":"Cystic", "2":"Whitehead", "3":"Blackhead", "4":"Pustule", "5":"Papule"};
        let colors = {"1":"#cc0000", "2":"#e6e6e6", "3":"#333333", "4":"#ff9933", "5":"#ff66b2"};
        if(types[input]) {
            loggedFaceZones[zoneId] = { type: types[input], color: colors[input] };
            localStorage.setItem('loggedFaceZones', JSON.stringify(loggedFaceZones));
        }
    } else {
        let input = prompt("Tension:\n1: Muscle (Dull)\n2: Nerve (Sharp/Tingly)");
        if (!input) return;
        let types = {"1":"Muscle", "2":"Nerve"};
        let colors = {"1":"#3399ff", "2":"#ffcc00"};
        if(types[input]) {
            loggedBodyZones[zoneId] = { type: types[input], color: colors[input] };
            localStorage.setItem('loggedBodyZones', JSON.stringify(loggedBodyZones));
            if (input === "2") alert("🚨 NERVE TENSION DETECTED! Stop static stretching here.");
        }
    }
    renderMapTargets(mapType);
}

function saveMapToJournal(mapType) {
    let logs = JSON.parse(localStorage.getItem('journals')) || [];
    let zones = mapType === 'face' ? faceZones : bodyZones;
    let logged = mapType === 'face' ? loggedFaceZones : loggedBodyZones;
    let details = [];
    
    for (const [id, data] of Object.entries(logged)) {
        let zName = zones.find(z => z.id == id).name;
        details.push(`${zName}: ${data.type}`);
    }
    
    if(details.length === 0) { alert("Nothing logged on map to save."); return; }
    
    let j = {
        date: new Date().toLocaleString(),
        weather: `Map Snapshot Saved`,
        routine: `Map Type: ${mapType.toUpperCase()}`,
        card: "N/A",
        thoughts: details.join(" | ")
    };
    logs.unshift(j);
    localStorage.setItem('journals', JSON.stringify(logs));
    
    // Clear map after saving
    if(mapType === 'face') { loggedFaceZones = {}; localStorage.removeItem('loggedFaceZones'); }
    else { loggedBodyZones = {}; localStorage.removeItem('loggedBodyZones'); }
    renderMapTargets(mapType); renderJournals();
    alert(`${mapType.toUpperCase()} Map saved to Journal! Markers cleared.`);
}

// NOTION PRODUCT DATABASE
function addProduct() {
    let name = document.getElementById('prod-name').value; let brand = document.getElementById('prod-brand').value;
    let type = document.getElementById('prod-type').value; let pao = parseInt(document.getElementById('prod-pao').value);
    let price = document.getElementById('prod-price').value; let url = document.getElementById('prod-url').value;
    let wish = document.getElementById('prod-wishlist').checked; let fav = document.getElementById('prod-fav').checked;
    
    if(!name) return;
    let exp = "N/A";
    if(pao && !wish) {
        let d = new Date(); d.setMonth(d.getMonth() + pao);
        exp = d.toLocaleDateString();
    }
    
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    prods.push({ name, brand, type, pao, price, url, wish, fav, exp });
    localStorage.setItem('products', JSON.stringify(prods));
    
    // Reset form
    document.querySelectorAll('#skincare input[type="text"], #skincare input[type="number"]').forEach(i => i.value = '');
    document.getElementById('prod-wishlist').checked = false; document.getElementById('prod-fav').checked = false;
    renderProducts();
}

function removeProduct(idx) {
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    prods.splice(idx, 1); localStorage.setItem('products', JSON.stringify(prods)); renderProducts();
}

function renderProducts() {
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    let list = document.getElementById('product-database-list'); list.innerHTML = '';
    prods.forEach((p, idx) => {
        let w = p.wish ? '<span class="prod-tag" style="background:#fff0b3; color:#cc8800;">Wishlist</span>' : '';
        let f = p.fav ? '❤️ ' : '';
        let e = p.exp !== "N/A" ? `<br>⏳ Expires: <span style="color:red;">${p.exp}</span>` : '';
        let l = p.url ? `<br>🔗 <a href="${p.url.startsWith('http') ? p.url : 'http://'+p.url}" target="_blank" style="color:#3399ff;">Product Link</a>` : '';
        
        list.innerHTML += `
            <div class="product-card">
                <div class="prod-header">${f}${p.name} <button class="prod-del" onclick="removeProduct(${idx})">X</button></div>
                <div><span class="prod-tag">${p.type}</span> <span class="prod-tag" style="background:#d9f2d9; color:#2d862d;">${p.brand}</span> ${w}</div>
                <div style="font-size:0.8rem; color:#666;">💰 Price: ${p.price || "N/A"} ${e} ${l}</div>
            </div>`;
    });
}

function logHygiene(type) {
    let d = new Date().toLocaleDateString(); localStorage.setItem('pillowDate', d); document.getElementById('pillowcase-date').innerText = d;
}

function calculateFascia() {
    let sleep = document.getElementById('sleep-hours').value; let water = document.getElementById('water-oz').value;
    let res = document.getElementById('fascia-result'); res.style.display = 'block';
    if(sleep < 5 && liveData.pressure < 29.8) res.innerText = "🚨 HIGH STIFFNESS. Extend warm-up.";
    else if (water < 30) res.innerText = "⚠️ POOR FASCIA GLIDE. Tissues are dehydrated.";
    else res.innerText = "✨ Fascia is primed and lubricated!";
}

// FULL 50 CARD DECK WITH EMOJIS
const deck = [
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
    { suit: "Barrier", name: "🛡️ The Occlusive", meaning: "Seal it in. Protect your energy and moisture." },
    { suit: "Barrier", name: "🧪 The Acid", meaning: "Burn it away. Deep cleanses and harsh truths." },
    { suit: "Barrier", name: "💧 The Humectant", meaning: "Draw it in. Absorb positive energy." },
    { suit: "Barrier", name: "🧈 The Lipid", meaning: "Structural repair. Thick moisturizers, soft stretching." },
    { suit: "Barrier", name: "🌋 The Purge", meaning: "Push through the current breakout or emotional block." },
    { suit: "Barrier", name: "🧼 The Cleanse", meaning: "Wash the slate clean. Forgive yourself, start fresh." },
    { suit: "Barrier", name: "🧱 The Matrix", meaning: "Foundation cracked. Halt intense actives." },
    { suit: "Barrier", name: "🧫 The Microbiome", meaning: "Delicate balance. Highly reactive today." },
    { suit: "Barrier", name: "🫧 The Ferment", meaning: "Slow progress. Trust daily habits." },
    { suit: "Barrier", name: "🧴 The Emollient", meaning: "Smoothing things over. Diplomacy and massage." },
    { suit: "Barrier", name: "☀️ The Shield", meaning: "Absolute defense. Impenetrable boundaries." },
    { suit: "Barrier", name: "🩹 The Patch", meaning: "Spot treatment. Fix the one specific thing bothering you." },
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
    
    let routineChecked = Array.from(document.querySelectorAll('.routine-chk:checked')).map(cb => cb.value);
    
    if (userProfile.routine.length > 0 && routineChecked.length < Math.floor(userProfile.routine.length / 2)) {
        warning.style.display = "block";
        warning.innerText = `🚨 Clinical Warning: You skipped more than half your routine today. Barrier risk elevated.`;
    } else { warning.style.display = "none"; }

    let j = {
        date: new Date().toLocaleString(),
        weather: `Dew: ${liveData.dew}°F | UV: ${liveData.uv} | PM2.5: ${liveData.aqi} | Press: ${liveData.pressure}`,
        routine: routineChecked.length > 0 ? routineChecked.join(", ") : "None Logged",
        card: currentDrawnCard,
        thoughts: dump || "No notes today."
    };

    let journals = JSON.parse(localStorage.getItem('journals')) || [];
    journals.unshift(j); localStorage.setItem('journals', JSON.stringify(journals));
    
    document.querySelectorAll('.routine-chk').forEach(cb => cb.checked = false);
    document.getElementById('brain-dump').value = '';
    renderJournals();
}

function renderJournals() {
    let journals = JSON.parse(localStorage.getItem('journals')) || [];
    let ul = document.getElementById('journal-list'); ul.innerHTML = '';
    journals.forEach(j => {
        ul.innerHTML += `
            <li>
                <span class="journal-header">${j.date}</span>
                <div class="journal-data">
                    <strong>Atmosphere:</strong> ${j.weather}<br>
                    <strong>Routine Completed:</strong> ${j.routine}<br>
                    <strong>Oracle:</strong> ${j.card}
                </div>
                <em>"${j.thoughts}"</em>
            </li>`;
    });
}

function checkWeeklyAura() {
    let now = new Date();
    // Sunday (0) at or after 12:00 PM (local time - assuming MST per instructions)
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
