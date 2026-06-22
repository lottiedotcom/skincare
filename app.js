// Global State
let userProfile = { 
    lat: '32.864', lon: '-108.222', routine: {}, // Routine is now an object by day
    skinType: 'combination', allergies: '', wakeTime: '', sleepTime: '' 
};
let loggedFaceZones = []; let loggedBodyZones = []; 
let liveData = { dew: 0, uv: 0, aqi: 0, pressure: 0 };
let currentDrawnCard = "None Drawn Today";
let hasCompiledToday = false; // Prevents double logging

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todayName = daysOfWeek[new Date().getDay()];

// MAP ZONES (Precise Coordinates)
const faceZones = [
    { id: 1, name: 'Forehead Center', x: 50, y: 15 }, { id: 2, name: 'Forehead L', x: 30, y: 18 }, { id: 3, name: 'Forehead R', x: 70, y: 18 },
    { id: 4, name: 'Temple L', x: 15, y: 35 }, { id: 5, name: 'Temple R', x: 85, y: 35 }, { id: 6, name: 'Nose Bridge', x: 50, y: 45 },
    { id: 7, name: 'Nose Tip', x: 50, y: 65 }, { id: 8, name: 'Upper Cheek L', x: 30, y: 55 }, { id: 9, name: 'Upper Cheek R', x: 70, y: 55 },
    { id: 10, name: 'Lower Cheek L', x: 25, y: 70 }, { id: 11, name: 'Lower Cheek R', x: 75, y: 70 }, { id: 12, name: 'Jaw L', x: 28, y: 85 },
    { id: 13, name: 'Jaw R', x: 72, y: 85 }, { id: 14, name: 'Chin', x: 50, y: 92 }, { id: 15, name: 'Upper Lip', x: 50, y: 75 }
];

const bodyZones = [
    { id: 1, name: 'Neck', x: 30, y: 10 }, { id: 2, name: 'L Shoulder', x: 15, y: 22 }, { id: 3, name: 'R Shoulder', x: 45, y: 22 },
    { id: 4, name: 'L Bicep', x: 10, y: 35 }, { id: 5, name: 'R Bicep', x: 50, y: 35 }, { id: 6, name: 'L Forearm', x: 5, y: 50 },
    { id: 7, name: 'R Forearm', x: 55, y: 50 }, { id: 8, name: 'L Pec', x: 22, y: 25 }, { id: 9, name: 'R Pec', x: 38, y: 25 },
    { id: 10, name: 'Abs', x: 30, y: 40 }, { id: 11, name: 'L Oblique', x: 20, y: 45 }, { id: 12, name: 'R Oblique', x: 40, y: 45 },
    { id: 13, name: 'L Quad', x: 22, y: 65 }, { id: 14, name: 'R Quad', x: 38, y: 65 }, { id: 15, name: 'L Shin', x: 22, y: 85 }, { id: 16, name: 'R Shin', x: 38, y: 85 },
    { id: 17, name: 'Traps', x: 70, y: 12 }, { id: 18, name: 'L Rear Delt', x: 60, y: 22 }, { id: 19, name: 'R Rear Delt', x: 80, y: 22 },
    { id: 20, name: 'L Tricep', x: 55, y: 35 }, { id: 21, name: 'R Tricep', x: 85, y: 35 }, { id: 22, name: 'L Lat', x: 62, y: 35 }, { id: 23, name: 'R Lat', x: 78, y: 35 },
    { id: 24, name: 'Lower Back', x: 70, y: 45 }, { id: 25, name: 'L Glute', x: 62, y: 55 }, { id: 26, name: 'R Glute', x: 78, y: 55 },
    { id: 27, name: 'L Hamstring', x: 62, y: 70 }, { id: 28, name: 'R Hamstring', x: 78, y: 70 }, { id: 29, name: 'L Calf', x: 62, y: 85 }, { id: 30, name: 'R Calf', x: 78, y: 85 }
];

window.onload = () => {
    setTimeout(() => { document.getElementById('enter-btn').style.display = 'block'; }, 1500);
    loadData(); fetchRealData(); populateSelects();
    renderTodayRoutine(); renderSettingsRoutine(); renderProducts(); renderJournals(); renderVault(); checkWeeklyAura(); checkSkillLocks();
    
    // Check if compiled today
    let lastCompile = localStorage.getItem('lastCompileDate');
    if(lastCompile === new Date().toLocaleDateString()) {
        hasCompiledToday = true;
        document.getElementById('journal-warning').style.display = 'block';
        document.getElementById('journal-warning').innerText = "✅ Journal already compiled for today.";
    }
};

function enterApp() {
    const loader = document.getElementById('loading-screen');
    loader.style.opacity = '0'; setTimeout(() => loader.style.display = 'none', 500);
}

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    // Highlight correct nav button even if opening Skill Tree
    let navId = tabId === 'skill-tree-tab' ? 'flexibility' : tabId;
    let targetNav = document.querySelector(`.nav-btn[onclick="openTab('${navId}')"]`);
    if(targetNav) targetNav.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function grabLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            document.getElementById('lat-input').value = pos.coords.latitude.toFixed(4);
            document.getElementById('lon-input').value = pos.coords.longitude.toFixed(4);
            saveSettings(); fetchRealData(); alert("Location grabbed!");
        });
    }
}

function saveSettings() {
    userProfile.lat = document.getElementById('lat-input').value; userProfile.lon = document.getElementById('lon-input').value;
    userProfile.skinType = document.getElementById('skin-type-select').value; userProfile.allergies = document.getElementById('allergy-input').value;
    userProfile.wakeTime = document.getElementById('wake-time').value; userProfile.sleepTime = document.getElementById('sleep-time').value;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

function loadData() {
    const savedProf = localStorage.getItem('userProfile');
    if (savedProf) {
        userProfile = JSON.parse(savedProf);
        if(!userProfile.routine || Array.isArray(userProfile.routine)) {
            // Migrate old array to day object
            userProfile.routine = { "Monday":[], "Tuesday":[], "Wednesday":[], "Thursday":[], "Friday":[], "Saturday":[], "Sunday":[] };
        }
        document.getElementById('lat-input').value = userProfile.lat || ''; document.getElementById('lon-input').value = userProfile.lon || '';
        document.getElementById('skin-type-select').value = userProfile.skinType || 'combination';
        document.getElementById('allergy-input').value = userProfile.allergies || '';
    } else {
        userProfile.routine = { "Monday":[], "Tuesday":[], "Wednesday":[], "Thursday":[], "Friday":[], "Saturday":[], "Sunday":[] };
    }
    
    loggedFaceZones = JSON.parse(localStorage.getItem('stagedFace')) || [];
    loggedBodyZones = JSON.parse(localStorage.getItem('stagedBody')) || [];
    document.getElementById('pillowcase-date').innerText = localStorage.getItem('pillowDate') || "Not Logged";
    renderMapLogs('face'); renderMapLogs('body');
}

// ROUTINE BY DAY
function addRoutineStep() {
    let day = document.getElementById('routine-day-select').value;
    let step = document.getElementById('new-routine-step').value;
    if(!step) return;
    if(!userProfile.routine[day]) userProfile.routine[day] = [];
    userProfile.routine[day].push(step);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    document.getElementById('new-routine-step').value = '';
    renderSettingsRoutine(); renderTodayRoutine();
}

function removeRoutineStep(day, index) {
    userProfile.routine[day].splice(index, 1);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    renderSettingsRoutine(); renderTodayRoutine();
}

function renderSettingsRoutine() {
    let day = document.getElementById('routine-day-select').value;
    let list = document.getElementById('settings-routine-list'); list.innerHTML = '';
    let dayRoutines = userProfile.routine[day] || [];
    dayRoutines.forEach((step, idx) => {
        list.innerHTML += `<li style="display:flex; justify-content:space-between;">${step} <button class="prod-del" onclick="removeRoutineStep('${day}', ${idx})">X</button></li>`;
    });
}

function renderTodayRoutine() {
    document.getElementById('today-routine-header').innerText = `✅ ${todayName}'s Routine`;
    let list = document.getElementById('custom-routine-list'); list.innerHTML = '';
    let dayRoutines = userProfile.routine[todayName] || [];
    if(dayRoutines.length === 0) { list.innerHTML = "<p class='small-text'>No routines set for today. Go to Settings!</p>"; return; }
    dayRoutines.forEach(step => {
        list.innerHTML += `<label class="check-tag"><input type="checkbox" class="routine-chk" value="${step}"> ${step}</label>`;
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
        document.getElementById('action-dew').innerText = cur.relative_humidity_2m < 30 ? "Occlusive day. TEWL is high." : "Atmosphere balanced.";
    } catch (error) { console.error("API Error"); }
}

// 2D MAPS (STAGING)
function populateSelects() {
    let fSel = document.getElementById('face-zone-select'); faceZones.forEach(z => fSel.innerHTML += `<option value="${z.id}: ${z.name}">${z.id}: ${z.name}</option>`);
    let bSel = document.getElementById('body-zone-select'); bodyZones.forEach(z => bSel.innerHTML += `<option value="${z.id}: ${z.name}">${z.id}: ${z.name}</option>`);
}

function logFaceZone() {
    let zone = document.getElementById('face-zone-select').value; let type = document.getElementById('face-acne-type').value;
    let colorMap = {"Cystic":"#cc0000", "Whitehead":"#e6e6e6", "Blackhead":"#333333", "Pustule":"#ff9933", "Papule":"#ff66b2"};
    loggedFaceZones.push({ zone, type, color: colorMap[type] });
    localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones)); renderMapLogs('face');
}

function logBodyZone() {
    let zone = document.getElementById('body-zone-select').value; let type = document.getElementById('body-tension-type').value;
    let colorMap = {"DOMS (Soreness)":"#99ccff", "Muscle (Dull/Pull)":"#3399ff", "Fascia (Tight/Stuck)":"#ff99cc", "Joint (Pinching/Blocked)":"#cc0000", "Nerve (Sharp/Tingly)":"#ffcc00"};
    loggedBodyZones.push({ zone, type, color: colorMap[type] });
    localStorage.setItem('stagedBody', JSON.stringify(loggedBodyZones)); renderMapLogs('body');
}

function renderMapLogs(mapType) {
    let list = document.getElementById(`${mapType}-log-list`); list.innerHTML = '';
    let logs = mapType === 'face' ? loggedFaceZones : loggedBodyZones;
    let container = document.getElementById(`${mapType}-map-container`);
    container.querySelectorAll('.target-dot').forEach(el => el.remove());
    const zones = mapType === 'face' ? faceZones : bodyZones;

    // Draw dots
    zones.forEach(zone => {
        let dot = document.createElement('div'); dot.className = 'target-dot'; dot.style.left = `${zone.x}%`; dot.style.top = `${zone.y}%`; 
        dot.innerText = zone.id;
        // Check if logged
        let match = logs.find(l => parseInt(l.zone.split(":")[0]) === zone.id);
        if(match) { dot.style.backgroundColor = match.color; dot.style.color = '#fff'; }
        container.appendChild(dot);
    });

    // List logs
    logs.forEach((log, idx) => {
        list.innerHTML += `<li style="border-left: 5px solid ${log.color};"><strong>${log.zone}</strong>: ${log.type} <button class="prod-del" style="float:right;" onclick="removeMapLog('${mapType}', ${idx})">X</button></li>`;
    });
}

function removeMapLog(mapType, idx) {
    if(mapType === 'face') { loggedFaceZones.splice(idx, 1); localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones)); }
    else { loggedBodyZones.splice(idx, 1); localStorage.setItem('stagedBody', JSON.stringify(loggedBodyZones)); }
    renderMapLogs(mapType);
}

// PRODUCT DIARY
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
    renderProducts();
}

function removeProduct(idx) {
    let prods = JSON.parse(localStorage.getItem('products')) || []; prods.splice(idx, 1); localStorage.setItem('products', JSON.stringify(prods)); renderProducts();
}

function renderProducts() {
    let prods = JSON.parse(localStorage.getItem('products')) || []; 
    let grid = document.getElementById('product-database-grid'); grid.innerHTML = '';
    prods.forEach((p, idx) => {
        let f = p.fav ? '❤️ ' : ''; 
        let tagClass = `tag-${p.type.split('/')[0].toLowerCase()}`;
        grid.innerHTML += `
            <div class="product-card">
                <div class="prod-header">${f}${p.name}</div>
                <div><span class="prod-tag ${tagClass}">${p.type}</span></div>
                <div style="font-size:0.75rem; color:#885566; margin-top:5px;">${p.brand} | ${p.price || "-"}</div>
                ${p.exp !== "N/A" ? `<div style="font-size:0.75rem; margin-top:5px;">⏳ ${p.exp}</div>` : ''}
                <button class="prod-del" onclick="removeProduct(${idx})">Remove</button>
            </div>`;
    });
}

function logHygiene(type) { let d = new Date().toLocaleDateString(); localStorage.setItem('pillowDate', d); document.getElementById('pillowcase-date').innerText = d; }

// SMART COACH
function calculateFascia() {
    let sleep = document.getElementById('sleep-hours').value; let water = document.getElementById('water-oz').value;
    let res = document.getElementById('fascia-result'); res.style.display = 'block';
    if(sleep < 5 && liveData.pressure < 29.8) res.innerText = "🚨 HIGH STIFFNESS. Extend warm-up."; else res.innerText = "✨ Fascia is primed!";
}

function smartSuggest() {
    let focus = document.getElementById('focus-selector').value;
    let res = document.getElementById('vault-suggestion'); res.style.display = 'block';
    let nervePain = loggedBodyZones.some(log => log.type.includes("Nerve"));
    if (nervePain) {
        res.innerHTML = "🚨 <strong>COACH VETO:</strong> Nerve tension detected. <em>Mandatory: Nerve Flossing & Decompression only.</em>";
    } else {
        res.innerHTML = `✅ <strong>CONDITION GREEN:</strong> Your system is primed for <strong>${focus}</strong>. Proceed with vault routines.`;
    }
}

// SKILL TREE LOGIC
function checkSkillLocks() {
    // Chest Stand Logic
    let cs1 = document.getElementById('chk-cs-1').checked;
    let cs2 = document.getElementById('chk-cs-2');
    let cs3 = document.getElementById('chk-cs-3');
    let cs4 = document.getElementById('chk-cs-4');
    
    if(cs1) { cs2.disabled = false; document.getElementById('tier-cs-2').classList.remove('locked'); } else { cs2.disabled = true; cs2.checked = false; document.getElementById('tier-cs-2').classList.add('locked'); }
    if(cs2.checked) { cs3.disabled = false; document.getElementById('tier-cs-3').classList.remove('locked'); } else { cs3.disabled = true; cs3.checked = false; document.getElementById('tier-cs-3').classList.add('locked'); }
    if(cs3.checked) { cs4.disabled = false; document.getElementById('tier-cs-4').classList.remove('locked'); } else { cs4.disabled = true; cs4.checked = false; document.getElementById('tier-cs-4').classList.add('locked'); }

    // Middle Splits Logic
    let ms1 = document.getElementById('chk-ms-1').checked;
    let ms2 = document.getElementById('chk-ms-2');
    let ms3 = document.getElementById('chk-ms-3');
    
    if(ms1) { ms2.disabled = false; document.getElementById('tier-ms-2').classList.remove('locked'); } else { ms2.disabled = true; ms2.checked = false; document.getElementById('tier-ms-2').classList.add('locked'); }
    if(ms2.checked) { ms3.disabled = false; document.getElementById('tier-ms-3').classList.remove('locked'); } else { ms3.disabled = true; ms3.checked = false; document.getElementById('tier-ms-3').classList.add('locked'); }

    // Save state
    let skills = Array.from(document.querySelectorAll('.skill-chk:checked')).map(cb => cb.id);
    localStorage.setItem('skillLocks', JSON.stringify(skills));
}

function loadSkillLocks() {
    let skills = JSON.parse(localStorage.getItem('skillLocks')) || [];
    skills.forEach(id => { let el = document.getElementById(id); if(el) el.checked = true; });
    checkSkillLocks(); // Trigger visual unlocks
}

// 50 CARD ORACLE
const deck = [
    { suit: "Lunar", name: "🌑 The Void Moon", meaning: "Rest completely. No active holds." },
    { suit: "Botanical", name: "🌿 The Node", meaning: "Cut dead weight from your life or routine." },
    { suit: "Barrier", name: "🛡️ The Occlusive", meaning: "Protect your energy and moisture." },
    { suit: "Vessel", name: "🕸️ The Fascia", meaning: "Everything is connected. Look at the whole chain." },
    { suit: "Lunar", name: "🌓 The Waxing Pull", meaning: "Building energy. Prep and hydrate." }
    // Note: Assuming full 50 deck arrays are kept here as previously generated
];

function drawCard() {
    let card = deck[Math.floor(Math.random() * deck.length)];
    currentDrawnCard = `${card.name} (${card.suit})`;
    document.getElementById('card-name').innerText = card.name; document.getElementById('card-suit').innerText = `Suit of ${card.suit}`; document.getElementById('card-meaning').innerText = card.meaning;
}

// AUTO-SYNTHESIS JOURNAL
function compileJournal() {
    if(hasCompiledToday) { alert("You have already compiled today's journal!"); return; }
    
    let dump = document.getElementById('brain-dump').value;
    let routineChecked = Array.from(document.querySelectorAll('.routine-chk:checked')).map(cb => cb.value);
    
    let faceData = loggedFaceZones.map(l => `${l.zone} (${l.type})`).join(", ") || "None";
    let bodyData = loggedBodyZones.map(l => `${l.zone} (${l.type})`).join(", ") || "None";

    let j = {
        date: new Date().toLocaleString(),
        weather: `Dew: ${liveData.dew}°F | UV: ${liveData.uv} | AQI: ${liveData.aqi} | Press: ${liveData.pressure}`,
        routine: routineChecked.length > 0 ? routineChecked.join(", ") : "None Logged",
        face: faceData, body: bodyData,
        card: currentDrawnCard, thoughts: dump || "No notes today."
    };

    let journals = JSON.parse(localStorage.getItem('journals')) || []; journals.unshift(j); localStorage.setItem('journals', JSON.stringify(journals));
    
    // Lock for the day
    localStorage.setItem('lastCompileDate', new Date().toLocaleDateString());
    hasCompiledToday = true; document.getElementById('journal-warning').style.display = 'block'; document.getElementById('journal-warning').innerText = "✅ Journal compiled for today.";

    // Wipe Staging
    loggedFaceZones = []; localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones));
    loggedBodyZones = []; localStorage.setItem('stagedBody', JSON.stringify(loggedBodyZones));
    document.querySelectorAll('.routine-chk').forEach(cb => cb.checked = false); document.getElementById('brain-dump').value = '';
    
    renderMapLogs('face'
