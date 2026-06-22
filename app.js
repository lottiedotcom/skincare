// Global State
let userProfile = { 
    lat: '32.864', lon: '-108.222', routine: [],
    skinType: 'combination', allergies: '', concerns: [], goals: [], wakeTime: '', sleepTime: '' 
};
let loggedFaceZones = []; let loggedBodyZones = []; 
let liveData = { dew: 0, uv: 0, aqi: 0, pressure: 0 };
let currentDrawnCard = "None Drawn Today";

// EXACT ZONES
const faceZones = [
    { id: 1, name: 'Forehead Center' }, { id: 2, name: 'Forehead Left' }, { id: 3, name: 'Forehead Right' },
    { id: 4, name: 'Temple Left' }, { id: 5, name: 'Temple Right' }, { id: 6, name: 'Nose Bridge' },
    { id: 7, name: 'Nose Tip' }, { id: 8, name: 'Upper Cheek L' }, { id: 9, name: 'Upper Cheek R' },
    { id: 10, name: 'Lower Cheek L' }, { id: 11, name: 'Lower Cheek R' }, { id: 12, name: 'Jaw L' },
    { id: 13, name: 'Jaw R' }, { id: 14, name: 'Chin' }, { id: 15, name: 'Upper Lip' }
];

const bodyZones = [
    { id: 1, name: 'Neck' }, { id: 2, name: 'L Shoulder' }, { id: 3, name: 'R Shoulder' },
    { id: 4, name: 'L Bicep' }, { id: 5, name: 'R Bicep' }, { id: 6, name: 'L Forearm' },
    { id: 7, name: 'R Forearm' }, { id: 8, name: 'L Pec' }, { id: 9, name: 'R Pec' },
    { id: 10, name: 'Upper Abs' }, { id: 11, name: 'Lower Abs' }, { id: 12, name: 'L Oblique' },
    { id: 13, name: 'R Oblique' }, { id: 14, name: 'L Quad' }, { id: 15, name: 'R Quad' },
    { id: 16, name: 'L Shin' }, { id: 17, name: 'R Shin' }, { id: 18, name: 'Upper Traps' },
    { id: 19, name: 'L Rear Delt' }, { id: 20, name: 'R Rear Delt' }, { id: 21, name: 'L Tricep' },
    { id: 22, name: 'R Tricep' }, { id: 23, name: 'L Lat' }, { id: 24, name: 'R Lat' },
    { id: 25, name: 'Lower Back' }, { id: 26, name: 'L Glute' }, { id: 27, name: 'R Glute' },
    { id: 28, name: 'L Hamstring' }, { id: 29, name: 'R Hamstring' }, { id: 30, name: 'L Calf' }, { id: 31, name: 'R Calf' }
];

window.onload = () => {
    setTimeout(() => { document.getElementById('enter-btn').style.display = 'block'; }, 1500);
    loadData(); fetchRealData(); populateSelects();
    renderRoutine(); renderProducts(); renderJournals(); renderVault(); checkWeeklyAura(); loadSkills();
};

function enterApp() {
    const loader = document.getElementById('loading-screen');
    loader.style.opacity = '0'; setTimeout(() => loader.style.display = 'none', 500);
}

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scrolls to top on tab switch
}

function grabLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            document.getElementById('lat-input').value = position.coords.latitude.toFixed(4);
            document.getElementById('lon-input').value = position.coords.longitude.toFixed(4);
            saveSettings(); fetchRealData(); alert("Location grabbed! APIs updated.");
        }, (error) => { alert("Location access denied."); });
    } else { alert("Geolocation not supported."); }
}

function saveSettings() {
    userProfile.lat = document.getElementById('lat-input').value; userProfile.lon = document.getElementById('lon-input').value;
    userProfile.skinType = document.getElementById('skin-type-select').value; userProfile.allergies = document.getElementById('allergy-input').value;
    userProfile.concerns = Array.from(document.querySelectorAll('#profile-tags input:checked')).map(cb => cb.value);
    userProfile.wakeTime = document.getElementById('wake-time').value; userProfile.sleepTime = document.getElementById('sleep-time').value;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

function loadData() {
    const savedProf = localStorage.getItem('userProfile');
    if (savedProf) {
        userProfile = JSON.parse(savedProf);
        if(!userProfile.routine) userProfile.routine = ["AM Water Rinse", "SPF", "PM Double Cleanse"];
        document.getElementById('lat-input').value = userProfile.lat || ''; document.getElementById('lon-input').value = userProfile.lon || '';
        document.getElementById('skin-type-select').value = userProfile.skinType || 'combination';
        document.getElementById('allergy-input').value = userProfile.allergies || '';
        document.getElementById('wake-time').value = userProfile.wakeTime || ''; document.getElementById('sleep-time').value = userProfile.sleepTime || '';
        document.querySelectorAll('#profile-tags input').forEach(cb => { if(userProfile.concerns && userProfile.concerns.includes(cb.value)) cb.checked = true; });
    } else { userProfile.routine = ["AM Water Rinse", "SPF", "PM Double Cleanse"]; }
    loggedFaceZones = JSON.parse(localStorage.getItem('loggedFaceZones')) || [];
    loggedBodyZones = JSON.parse(localStorage.getItem('loggedBodyZones')) || [];
    let pillowDate = localStorage.getItem('pillowDate'); if(pillowDate) document.getElementById('pillowcase-date').innerText = pillowDate;
    renderMapLogs('face'); renderMapLogs('body');
}

// DROPDOWN POPULATION
function populateSelects() {
    let fSel = document.getElementById('face-zone-select');
    faceZones.forEach(z => fSel.innerHTML += `<option value="${z.id}: ${z.name}">${z.id}: ${z.name}</option>`);
    let bSel = document.getElementById('body-zone-select');
    bodyZones.forEach(z => bSel.innerHTML += `<option value="${z.id}: ${z.name}">${z.id}: ${z.name}</option>`);
}

function logFaceZone() {
    let zone = document.getElementById('face-zone-select').value;
    let type = document.getElementById('face-acne-type').value;
    loggedFaceZones.push({ zone, type });
    localStorage.setItem('loggedFaceZones', JSON.stringify(loggedFaceZones));
    renderMapLogs('face');
}

function logBodyZone() {
    let zone = document.getElementById('body-zone-select').value;
    let type = document.getElementById('body-tension-type').value;
    loggedBodyZones.push({ zone, type });
    localStorage.setItem('loggedBodyZones', JSON.stringify(loggedBodyZones));
    if (type.includes("Nerve")) alert("🚨 NERVE TENSION DETECTED! Stop static stretching here.");
    renderMapLogs('body');
}

function renderMapLogs(mapType) {
    let list = document.getElementById(`${mapType}-log-list`); list.innerHTML = '';
    let logs = mapType === 'face' ? loggedFaceZones : loggedBodyZones;
    logs.forEach((log, idx) => {
        let color = log.type.includes("Nerve") ? "#ffcc00" : (mapType === 'face' ? "#ff99cc" : "#99ccff");
        list.innerHTML += `<li style="border-left: 5px solid ${color};"><strong>${log.zone}</strong>: ${log.type} <button class="prod-del" style="float:right;" onclick="removeMapLog('${mapType}', ${idx})">X</button></li>`;
    });
}

function removeMapLog(mapType, idx) {
    if(mapType === 'face') { loggedFaceZones.splice(idx, 1); localStorage.setItem('loggedFaceZones', JSON.stringify(loggedFaceZones)); }
    else { loggedBodyZones.splice(idx, 1); localStorage.setItem('loggedBodyZones', JSON.stringify(loggedBodyZones)); }
    renderMapLogs(mapType);
}

function saveMapToJournal(mapType) {
    let logs = mapType === 'face' ? loggedFaceZones : loggedBodyZones;
    if(logs.length === 0) { alert("Nothing logged to save."); return; }
    
    let details = logs.map(l => `${l.zone} (${l.type})`).join(" | ");
    let j = {
        date: new Date().toLocaleString(), weather: `Map Snapshot`, routine: `Map Type: ${mapType.toUpperCase()}`,
        card: "N/A", thoughts: details
    };
    let journals = JSON.parse(localStorage.getItem('journals')) || [];
    journals.unshift(j); localStorage.setItem('journals', JSON.stringify(journals));
    
    if(mapType === 'face') { loggedFaceZones = []; localStorage.setItem('loggedFaceZones', JSON.stringify(loggedFaceZones)); }
    else { loggedBodyZones = []; localStorage.setItem('loggedBodyZones', JSON.stringify(loggedBodyZones)); }
    renderMapLogs(mapType); renderJournals(); alert(`${mapType.toUpperCase()} Map saved to Journal!`);
}

// ROUTINE BUILDER
function addRoutineStep() {
    let step = document.getElementById('new-routine-step').value; if(!step) return;
    userProfile.routine.push(step); localStorage.setItem('userProfile', JSON.stringify(userProfile));
    document.getElementById('new-routine-step').value = ''; renderRoutine();
}
function removeRoutineStep(index) {
    userProfile.routine.splice(index, 1); localStorage.setItem('userProfile', JSON.stringify(userProfile)); renderRoutine();
}
function renderRoutine() {
    let setList = document.getElementById('settings-routine-list'); let skinList = document.getElementById('custom-routine-list');
    setList.innerHTML = ''; skinList.innerHTML = '';
    userProfile.routine.forEach((step, idx) => {
        setList.innerHTML += `<li style="display:flex; justify-content:space-between;">${step} <button class="prod-del" onclick="removeRoutineStep(${idx})">X</button></li>`;
        skinList.innerHTML += `<label class="check-tag"><input type="checkbox" class="routine-chk" value="${step}"> ${step}</label>`;
    });
}

// WEATHER
async function fetchRealData() {
    let lat = userProfile.lat || '32.864'; let lon = userProfile.lon || '-108.222';
    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=relative_humidity_2m,dewpoint_2m,surface_pressure,uv_index&temperature_unit=fahrenheit`);
        const cur = (await weatherRes.json()).current;
        const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5`);
        const pm25 = (await aqiRes.json()).current.pm2_5;

        liveData.dew = cur.dewpoint_2m; liveData.uv = cur.uv_index; liveData.aqi = pm25; liveData.pressure = (cur.surface_pressure * 0.02953).toFixed(2);
        
        document.getElementById('live-dew').innerText = `${liveData.dew.toFixed(1)}°F`; document.getElementById('live-uv').innerText = liveData.uv;
        document.getElementById('live-aqi').innerText = `${liveData.aqi} µg/m³`; document.getElementById('live-pressure').innerText = `${liveData.pressure} inHg`;

        document.getElementById('action-dew').innerText = cur.relative_humidity_2m < 30 ? "Barrier Risk: Occlusive day. Transepidermal water loss is high." : "Atmosphere balanced. Humectants are safe.";
        let uvEl = document.getElementById('action-uv');
        if (liveData.uv >= 5) { uvEl.style.display = 'block'; uvEl.innerText = "UV Risk: Lipid barrier degradation active. Reapply SPF."; } else { uvEl.style.display = 'none'; }
        let aqiEl = document.getElementById('action-aqi');
        if (liveData.aqi > 12) { aqiEl.style.display = 'block'; aqiEl.innerText = "Air Quality Risk: High PM2.5. PM double cleanse mandated."; } else { aqiEl.style.display = 'none'; }
        document.getElementById('live-flex-action').innerText = cur.surface_pressure < 1010 ? "High environmental resistance today. Tissues expanding." : "Prime conditioning weather!";
    } catch (error) { console.error("API Error"); }
}

// PRODUCT DATABASE
function addProduct() {
    let name = document.getElementById('prod-name').value; let brand = document.getElementById('prod-brand').value;
    let type = document.getElementById('prod-type').value; let pao = parseInt(document.getElementById('prod-pao').value);
    let price = document.getElementById('prod-price').value; let url = document.getElementById('prod-url').value;
    let wish = document.getElementById('prod-wishlist').checked; let fav = document.getElementById('prod-fav').checked;
    
    if(!name) return; let exp = "N/A";
    if(pao && !wish) { let d = new Date(); d.setMonth(d.getMonth() + pao); exp = d.toLocaleDateString(); }
    
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    prods.push({ name, brand, type, pao, price, url, wish, fav, exp });
    localStorage.setItem('products', JSON.stringify(prods));
    
    document.querySelectorAll('#skincare input[type="text"], #skincare input[type="number"]').forEach(i => i.value = '');
    document.getElementById('prod-wishlist').checked = false; document.getElementById('prod-fav').checked = false;
    renderProducts();
}
function removeProduct(idx) {
    let prods = JSON.parse(localStorage.getItem('products')) || []; prods.splice(idx, 1); localStorage.setItem('products', JSON.stringify(prods)); renderProducts();
}
function renderProducts() {
    let prods = JSON.parse(localStorage.getItem('products')) || []; let list = document.getElementById('product-database-list'); list.innerHTML = '';
    prods.forEach((p, idx) => {
        let w = p.wish ? '<span class="prod-tag" style="background:#fff0b3; color:#cc8800;">Wishlist</span>' : '';
        let f = p.fav ? '❤️ ' : ''; let e = p.exp !== "N/A" ? `<br>⏳ Expires: <span style="color:red;">${p.exp}</span>` : '';
        let l = p.url ? `<br>🔗 <a href="${p.url.startsWith('http') ? p.url : 'http://'+p.url}" target="_blank" style="color:#3399ff;">Product Link</a>` : '';
        list.innerHTML += `<div class="product-card"><div class="prod-header">${f}${p.name} <button class="prod-del" onclick="removeProduct(${idx})">X</button></div><div><span class="prod-tag">${p.type}</span> <span class="prod-tag" style="background:#d9f2d9; color:#2d862d;">${p.brand}</span> ${w}</div><div style="font-size:0.8rem; color:#666;">💰 Price: ${p.price || "N/A"} ${e} ${l}</div></div>`;
    });
}

function logHygiene(type) { let d = new Date().toLocaleDateString(); localStorage.setItem('pillowDate', d); document.getElementById('pillowcase-date').innerText = d; }
function calculateFascia() {
    let sleep = document.getElementById('sleep-hours').value; let water = document.getElementById('water-oz').value;
    let res = document.getElementById('fascia-result'); res.style.display = 'block';
    if(sleep < 5 && liveData.pressure < 29.8) res.innerText = "🚨 HIGH STIFFNESS. Extend warm-up.";
    else if (water < 30) res.innerText = "⚠️ POOR FASCIA GLIDE. Tissues are dehydrated.";
    else res.innerText = "✨ Fascia is primed and lubricated!";
}

// VIDEO VAULT
function addToVault() {
    let title = document.getElementById('vault-title').value; let url = document.getElementById('vault-url').value;
    let duration = document.getElementById('vault-duration').value; let focus = document.getElementById('vault-focus').value;
    if(!title || !duration) return;
    let vaults = JSON.parse(localStorage.getItem('vaults')) || [];
    vaults.push({ title, url, duration, focus }); localStorage.setItem('vaults', JSON.stringify(vaults));
    document.getElementById('vault-title').value = ''; document.getElementById('vault-url').value = ''; document.getElementById('vault-duration').value = '';
    renderVault();
}
function removeVault(idx) {
    let vaults = JSON.parse(localStorage.getItem('vaults')) || []; vaults.splice(idx, 1); localStorage.setItem('vaults', JSON.stringify(vaults)); renderVault();
}
function renderVault() {
    let vaults = JSON.parse(localStorage.getItem('vaults')) || []; let list = document.getElementById('vault-list'); list.innerHTML = '';
    vaults.forEach((v, idx) => {
        let l = v.url ? `<a href="${v.url.startsWith('http') ? v.url : 'http://'+v.url}" target="_blank" style="color:#cc0066; font-weight:bold;">[Watch]</a>` : '';
        list.innerHTML += `<li><strong>${v.title}</strong> (${v.duration}m) - <em>${v.focus}</em> ${l} <button class="prod-del" style="float:right;" onclick="removeVault(${idx})">X</button></li>`;
    });
}
function smartSuggest() {
    let vaults = JSON.parse(localStorage.getItem('vaults')) || [];
    if(vaults.length === 0) {
        document.getElementById('vault-suggestion').style.display = 'block'; document.getElementById('vault-suggestion').innerText = "Your vault is empty! Add routines first."; return;
    }
    let sleep = document.getElementById('sleep-hours').value || 8;
    let pressure = liveData.pressure || 30.00;
    let recommendedFocus = "Active Oversplits";
    
    if (sleep < 6 || pressure < 29.8) { recommendedFocus = "Restorative Decompression"; } 
    else if (sleep >= 7 && pressure >= 30.0) { recommendedFocus = "Deep Backbends"; }
    
    let matches = vaults.filter(v => v.focus === recommendedFocus);
    let selected = matches.length > 0 ? matches[Math.floor(Math.random() * matches.length)] : vaults[Math.floor(Math.random() * vaults.length)];
    
    let msg = `Conditions indicate: ${recommendedFocus}. Try this routine: ${selected.title} (${selected.duration} mins).`;
    document.getElementById('vault-suggestion').style.display = 'block'; document.getElementById('vault-suggestion').innerText = msg;
}

// SKILL TREE
function saveSkills() {
    let skills = Array.from(document.querySelectorAll('.skill-chk:checked')).map(cb => cb.value);
    localStorage.setItem('contortionSkills', JSON.stringify(skills));
}
function loadSkills() {
    let skills = JSON.parse(localStorage.getItem('contortionSkills')) || [];
    document.querySelectorAll('.skill-chk').forEach(cb => { if(skills.includes(cb.value)) cb.checked = true; });
}

// 50 CARD DECK
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
    document.getElementById('card-name').innerText = card.name; document.getElementById('card-suit').innerText = `Suit of ${card.suit}`; document.getElementById('card-meaning').innerText = card.meaning;
}

// AUTO-SYNTHESIS JOURNAL
function compileJournal() {
    const warning = document.getElementById('journal-warning'); const dump = document.getElementById('brain-dump').value;
    let routineChecked = Array.from(document.querySelectorAll('.routine-chk:checked')).map(cb => cb.value);
    
    if (userProfile.routine.length > 0 && routineChecked.length < Math.floor(userProfile.routine.length / 2)) {
        warning.style.display = "block"; warning.innerText = `🚨 Clinical Warning: You skipped more than half your routine today. Barrier risk elevated.`;
    } else { warning.style.display = "none"; }

    let j = {
        date: new Date().toLocaleString(),
        weather: `Dew: ${liveData.dew}°F | UV: ${liveData.uv} | PM2.5: ${liveData.aqi} | Press: ${liveData.pressure}`,
        routine: routineChecked.length > 0 ? routineChecked.join(", ") : "None Logged",
        card: currentDrawnCard, thoughts: dump || "No notes today."
    };

    let journals = JSON.parse(localStorage.getItem('journals')) || []; journals.unshift(j); localStorage.setItem('journals', JSON.stringify(journals));
    
    document.querySelectorAll('.routine-chk').forEach(cb => cb.checked = false); document.getElementById('brain-dump').value = ''; renderJournals();
}

function renderJournals() {
    let journals = JSON.parse(localStorage.getItem('journals')) || []; let ul = document.getElementById('journal-list'); ul.innerHTML = '';
    journals.forEach(j => {
        ul.innerHTML += `<li><span class="journal-header">${j.date}</span><div class="journal-data"><strong>Atmosphere:</strong> ${j.weather}<br><strong>Routine Completed:</strong> ${j.routine}<br><strong>Oracle:</strong> ${j.card}</div><em>"${j.thoughts}"</em></li>`;
    });
}

function checkWeeklyAura() {
    let now = new Date();
    if (now.getDay() === 0 && now.getHours() >= 12) {
        let lastStampStr = localStorage.getItem('lastAuraStampDate');
        if (!lastStampStr || now.toDateString() !== new Date(parseInt(lastStampStr)).toDateString()) { generateAuraLogic(now); } else { loadCurrentAura(); }
    } else { loadCurrentAura(); }
}
function forceAuraGeneration() { generateAuraLogic(new Date()); }

function generateAuraLogic(now) {
    let journals = JSON.parse(localStorage.getItem('journals')) || [];
    let name = "The Blank Slate Stamp"; let advice = "Not enough journal synthesis this week to form an Aura!";
    if (journals.length > 0) { name = "✨ The Synthesis Stamp ✨"; advice = "You successfully compiled journals this week. Keep tracking."; }
    localStorage.setItem('currentAura', JSON.stringify({ name, advice })); localStorage.setItem('lastAuraStampDate', now.getTime().toString()); displayAura(name, advice);
}
function loadCurrentAura() {
    let saved = localStorage.getItem('currentAura'); if (saved) { let p = JSON.parse(saved); displayAura(p.name, p.advice); }
}
function displayAura(name, advice) { document.getElementById('aura-name').innerText = name; document.getElementById('aura-advice').innerText = advice; }
