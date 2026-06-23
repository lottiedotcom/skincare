// Global State - WRAPPED IN FAIL-SAFES
let userProfile = { 
    lat: '32.864', lon: '-108.222', routine: {}, 
    skinType: 'combination', allergies: '', wakeTime: '', sleepTime: '' 
};
let loggedFaceZones = []; let loggedBodyZones = []; 
let liveData = { dew: 0, uv: 0, aqi: 0, pressure: 0 };
let currentDrawnCard = "None Drawn Today";
let hasCompiledToday = false; 
let breathingInterval;

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todayName = daysOfWeek[new Date().getDay()];

// MAP ZONES
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

// INIT
window.onload = () => {
    try {
        loadData(); fetchRealData(); populateSelects();
        renderTodayRoutine(); renderSettingsRoutine(); renderProducts(); renderJournals(); renderVault(); checkWeeklyAura(); checkSkillLocks();
        
        let lastCompile = localStorage.getItem('lastCompileDate');
        if(lastCompile === new Date().toLocaleDateString()) {
            hasCompiledToday = true;
            let warning = document.getElementById('journal-warning');
            if(warning) {
                warning.style.display = 'block';
                warning.innerText = "✅ Journal already compiled for today.";
            }
        }
    } catch(e) { console.error("Safe Load Error: ", e); } // If anything fails, it drops here, but doesn't freeze browser
};

// TABS
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    let targetSection = document.getElementById(tabId);
    if(targetSection) targetSection.classList.add('active');
    
    let navId = tabId === 'skill-tree-tab' ? 'flexibility' : tabId;
    let targetNav = document.querySelector(`.tab-btn[onclick="openTab('${navId}')"]`);
    if(targetNav) targetNav.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// LOCATION
function grabLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            let latEl = document.getElementById('lat-input');
            let lonEl = document.getElementById('lon-input');
            if(latEl) latEl.value = pos.coords.latitude.toFixed(4);
            if(lonEl) lonEl.value = pos.coords.longitude.toFixed(4);
            saveSettings(); fetchRealData(); alert("Location grabbed!");
        });
    }
}

function saveSettings() {
    let latEl = document.getElementById('lat-input'); if(latEl) userProfile.lat = latEl.value;
    let lonEl = document.getElementById('lon-input'); if(lonEl) userProfile.lon = lonEl.value;
    let skinEl = document.getElementById('skin-type-select'); if(skinEl) userProfile.skinType = skinEl.value;
    let algEl = document.getElementById('allergy-input'); if(algEl) userProfile.allergies = algEl.value;
    let wakeEl = document.getElementById('wake-time'); if(wakeEl) userProfile.wakeTime = wakeEl.value;
    let sleepEl = document.getElementById('sleep-time'); if(sleepEl) userProfile.sleepTime = sleepEl.value;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
}

function loadData() {
    const savedProf = localStorage.getItem('userProfile');
    if (savedProf) {
        userProfile = JSON.parse(savedProf);
        if(!userProfile.routine || Array.isArray(userProfile.routine)) {
            userProfile.routine = { "Monday":[], "Tuesday":[], "Wednesday":[], "Thursday":[], "Friday":[], "Saturday":[], "Sunday":[] };
        }
        let latEl = document.getElementById('lat-input'); if(latEl) latEl.value = userProfile.lat || '';
        let lonEl = document.getElementById('lon-input'); if(lonEl) lonEl.value = userProfile.lon || '';
        let skinEl = document.getElementById('skin-type-select'); if(skinEl) skinEl.value = userProfile.skinType || 'combination';
        let allEl = document.getElementById('allergy-input'); if(allEl) allEl.value = userProfile.allergies || '';
    } else {
        userProfile.routine = { "Monday":[], "Tuesday":[], "Wednesday":[], "Thursday":[], "Friday":[], "Saturday":[], "Sunday":[] };
    }
    
    loggedFaceZones = JSON.parse(localStorage.getItem('stagedFace')) || [];
    loggedBodyZones = JSON.parse(localStorage.getItem('stagedBody')) || [];
    
    let pillowElem = document.getElementById('pillowcase-date');
    if(pillowElem) pillowElem.innerText = localStorage.getItem('pillowDate') || "Not Logged";
    
    renderMapLogs('face'); renderMapLogs('body');
}

// ROUTINE
function addRoutineStep() {
    let dayEl = document.getElementById('routine-day-select');
    let stepEl = document.getElementById('new-routine-step');
    if(!dayEl || !stepEl) return;
    
    let day = dayEl.value; let step = stepEl.value;
    if(!step) return;
    if(!userProfile.routine[day]) userProfile.routine[day] = [];
    userProfile.routine[day].push(step);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    stepEl.value = '';
    renderSettingsRoutine(); renderTodayRoutine();
}

function removeRoutineStep(day, index) {
    if(!userProfile.routine[day]) return;
    userProfile.routine[day].splice(index, 1);
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    renderSettingsRoutine(); renderTodayRoutine();
}

function renderSettingsRoutine() {
    let dayEl = document.getElementById('routine-day-select');
    let list = document.getElementById('settings-routine-list'); 
    if(!dayEl || !list) return;
    
    list.innerHTML = '';
    let day = dayEl.value;
    let dayRoutines = userProfile.routine[day] || [];
    dayRoutines.forEach((step, idx) => {
        list.innerHTML += `<li style="display:flex; justify-content:space-between;">${step} <button class="prod-del" onclick="removeRoutineStep('${day}', ${idx})">X</button></li>`;
    });
}

function renderTodayRoutine() {
    let head = document.getElementById('today-routine-header');
    let list = document.getElementById('custom-routine-list'); 
    if(!head || !list) return;
    
    head.innerText = `✅ ${todayName}'s Routine`;
    list.innerHTML = '';
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
        
        let dewEl = document.getElementById('live-dew'); if(dewEl) dewEl.innerText = `${liveData.dew.toFixed(1)}°F`; 
        let uvEl = document.getElementById('live-uv'); if(uvEl) uvEl.innerText = liveData.uv;
        let aqiEl = document.getElementById('live-aqi'); if(aqiEl) aqiEl.innerText = `${liveData.aqi} µg/m³`; 
        let presEl = document.getElementById('live-pressure'); if(presEl) presEl.innerText = `${liveData.pressure} inHg`;
        let actEl = document.getElementById('action-dew'); if(actEl) actEl.innerText = cur.relative_humidity_2m < 30 ? "Occlusive day. TEWL is high." : "Atmosphere balanced.";
    } catch (error) { console.error("API Error"); }
}

// MAPS
function populateSelects() {
    let fSel = document.getElementById('face-zone-select'); 
    if(fSel) { fSel.innerHTML = ''; faceZones.forEach(z => fSel.innerHTML += `<option value="${z.id}: ${z.name}">${z.id}: ${z.name}</option>`); }
    let bSel = document.getElementById('body-zone-select'); 
    if(bSel) { bSel.innerHTML = ''; bodyZones.forEach(z => bSel.innerHTML += `<option value="${z.id}: ${z.name}">${z.id}: ${z.name}</option>`); }
}

function logFaceZone() {
    let zoneEl = document.getElementById('face-zone-select'); let typeEl = document.getElementById('face-acne-type');
    if(!zoneEl || !typeEl) return;
    let zone = zoneEl.value; let type = typeEl.value;
    let colorMap = {"Cystic":"#cc0000", "Whitehead":"#e6e6e6", "Blackhead":"#333333", "Pustule":"#ff9933", "Papule":"#ff66b2"};
    loggedFaceZones.push({ zone, type, color: colorMap[type] });
    localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones)); renderMapLogs('face');
}

function logBodyZone() {
    let zoneEl = document.getElementById('body-zone-select'); let typeEl = document.getElementById('body-tension-type');
    if(!zoneEl || !typeEl) return;
    let zone = zoneEl.value; let type = typeEl.value;
    let colorMap = {"DOMS (Soreness)":"#99ccff", "Muscle (Dull/Pull)":"#3399ff", "Fascia (Tight/Stuck)":"#ff99cc", "Joint (Pinching/Blocked)":"#cc0000", "Nerve (Sharp/Tingly)":"#ffcc00"};
    loggedBodyZones.push({ zone, type, color: colorMap[type] });
    localStorage.setItem('stagedBody', JSON.stringify(loggedBodyZones)); renderMapLogs('body');
}

function renderMapLogs(mapType) {
    let list = document.getElementById(`${mapType}-log-list`); if(!list) return;
    list.innerHTML = '';
    let logs = mapType === 'face' ? loggedFaceZones : loggedBodyZones;
    let container = document.getElementById(`${mapType}-map-container`);
    if(container) {
        container.querySelectorAll('.target-dot').forEach(el => el.remove());
        const zones = mapType === 'face' ? faceZones : bodyZones;
        zones.forEach(zone => {
            let dot = document.createElement('div'); dot.className = 'target-dot'; dot.style.left = `${zone.x}%`; dot.style.top = `${zone.y}%`; 
            dot.innerText = zone.id;
            let match = logs.find(l => parseInt(l.zone.split(":")[0]) === zone.id);
            if(match) { dot.style.backgroundColor = match.color; dot.style.color = '#fff'; }
            container.appendChild(dot);
        });
    }
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
    let nameEl = document.getElementById('prod-name'); if(!nameEl) return;
    let name = nameEl.value; 
    let brand = document.getElementById('prod-brand') ? document.getElementById('prod-brand').value : "";
    let type = document.getElementById('prod-type') ? document.getElementById('prod-type').value : "Other"; 
    let paoEl = document.getElementById('prod-pao'); let pao = paoEl ? parseInt(paoEl.value) : 0;
    let price = document.getElementById('prod-price') ? document.getElementById('prod-price').value : ""; 
    let url = document.getElementById('prod-url') ? document.getElementById('prod-url').value : "";
    let wish = document.getElementById('prod-wishlist') ? document.getElementById('prod-wishlist').checked : false; 
    let fav = document.getElementById('prod-fav') ? document.getElementById('prod-fav').checked : false;
    
    if(!name) return; let exp = "N/A";
    if(pao && !wish) { let d = new Date(); d.setMonth(d.getMonth() + pao); exp = d.toLocaleDateString(); }
    
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    prods.push({ name, brand, type, pao, price, url, wish, fav, exp });
    localStorage.setItem('products', JSON.stringify(prods));
    
    document.querySelectorAll('#skincare input[type="text"], #skincare input[type="number"]').forEach(i => i.value = '');
    let wChk = document.getElementById('prod-wishlist'); if(wChk) wChk.checked = false;
    let fChk = document.getElementById('prod-fav'); if(fChk) fChk.checked = false;
    renderProducts();
}

function removeProduct(idx) {
    let prods = JSON.parse(localStorage.getItem('products')) || []; prods.splice(idx, 1); localStorage.setItem('products', JSON.stringify(prods)); renderProducts();
}

function renderProducts() {
    let prods = JSON.parse(localStorage.getItem('products')) || []; 
    let grid = document.getElementById('product-database-grid'); if(!grid) return;
    grid.innerHTML = '';
    prods.forEach((p, idx) => {
        let f = p.fav ? '❤️ ' : ''; let tagClass = `tag-${p.type.split('/')[0].toLowerCase()}`;
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

function logHygiene(type) { 
    let d = new Date().toLocaleDateString(); 
    localStorage.setItem('pillowDate', d); 
    let pEl = document.getElementById('pillowcase-date'); if(pEl) pEl.innerText = d; 
}

// RECOVERY
function toggleSomaticReset() {
    const pacer = document.getElementById('somatic-pacer');
    const circle = document.getElementById('breath-circle');
    const text = document.getElementById('breath-text');
    if(!pacer) return;
    
    if (pacer.style.display === 'none') {
        pacer.style.display = 'block';
        let phase = 0;
        clearInterval(breathingInterval);
        
        breathingInterval = setInterval(() => {
            if(phase === 0) { text.innerText = "Inhale..."; circle.classList.add('breathe-in'); circle.classList.remove('breathe-out'); }
            else if(phase === 1) { text.innerText = "Hold..."; }
            else if(phase === 2) { text.innerText = "Exhale..."; circle.classList.add('breathe-out'); circle.classList.remove('breathe-in'); }
            else if(phase === 3) { text.innerText = "Hold..."; }
            phase = (phase + 1) % 4;
        }, 4000); 
    } else {
        pacer.style.display = 'none';
        clearInterval(breathingInterval);
    }
}

function generateLymphatic() {
    const display = document.getElementById('lymphatic-sequence'); if(!display) return;
    display.style.display = 'block';
    display.innerHTML = `
        <strong>Lymphatic Sequence:</strong><br><br>
        1. <strong>Clavicle:</strong> Pump hollows above collarbone 15x.<br>
        2. <strong>Axillary:</strong> Pump armpits 15x.<br>
        3. <strong>Inguinal:</strong> Pump hip creases 15x.<br>
        4. <strong>Legs up Wall:</strong> Rest inverted for 10 mins.
    `;
}

// SMART COACH
function addToVault() {
    let titleEl = document.getElementById('vault-title'); if(!titleEl) return;
    let title = titleEl.value; 
    let url = document.getElementById('vault-url') ? document.getElementById('vault-url').value : "";
    let duration = document.getElementById('vault-duration') ? document.getElementById('vault-duration').value : ""; 
    let focus = document.getElementById('vault-focus') ? document.getElementById('vault-focus').value : "";
    if(!title || !duration) return;
    let vaults = JSON.parse(localStorage.getItem('vaults')) || [];
    vaults.push({ title, url, duration, focus }); localStorage.setItem('vaults', JSON.stringify(vaults));
    titleEl.value = ''; document.getElementById('vault-url').value = ''; document.getElementById('vault-duration').value = '';
    renderVault();
}

function removeVault(idx) {
    let vaults = JSON.parse(localStorage.getItem('vaults')) || []; vaults.splice(idx, 1); localStorage.setItem('vaults', JSON.stringify(vaults)); renderVault();
}

function renderVault() {
    let vaults = JSON.parse(localStorage.getItem('vaults')) || []; let list = document.getElementById('vault-list'); if(!list) return;
    list.innerHTML = '';
    vaults.forEach((v, idx) => {
        let l = v.url ? `<a href="${v.url.startsWith('http') ? v.url : 'http://'+v.url}" target="_blank" style="color:#cc0066; font-weight:bold;">[Watch]</a>` : '';
        list.innerHTML += `<li><strong>${v.title}</strong> (${v.duration}m) - <em>${v.focus}</em> ${l} <button class="prod-del" style="float:right;" onclick="removeVault(${idx})">X</button></li>`;
    });
}

function smartSuggest() {
    let focusEl = document.getElementById('focus-selector'); if(!focusEl) return;
    let focus = focusEl.value;
    let res = document.getElementById('vault-suggestion'); if(!res) return;
    res.style.display = 'block';
    let nervePain = loggedBodyZones.some(log => log.type.includes("Nerve"));
    if (nervePain) {
        res.innerHTML = "🚨 <strong>COACH VETO:</strong> Nerve tension detected. <em>Mandatory: Somatic Reset & Nerve Flossing only.</em>";
    } else if (focus === "Somatic Reset" || focus === "Lymphatic Drainage") {
        res.innerHTML = `✅ <strong>RECOVERY:</strong> Great choice. Check the Recovery & Regulation box above.`;
    } else {
        res.innerHTML = `✅ <strong>CONDITION GREEN:</strong> Your system is primed for <strong>${focus}</strong>. Proceed with vault routines.`;
    }
}

// SKILLS
function checkSkillLocks() {
    let cs1 = document.getElementById('chk-cs-1'); if(!cs1) return; // Failsafe
    let cs2 = document.getElementById('chk-cs-2'); let cs3 = document.getElementById('chk-cs-3'); let cs4 = document.getElementById('chk-cs-4');
    if(cs1.checked) { cs2.disabled = false; document.getElementById('tier-cs-2').classList.remove('locked'); } else { cs2.disabled = true; cs2.checked = false; document.getElementById('tier-cs-2').classList.add('locked'); }
    if(cs2.checked) { cs3.disabled = false; document.getElementById('tier-cs-3').classList.remove('locked'); } else { cs3.disabled = true; cs3.checked = false; document.getElementById('tier-cs-3').classList.add('locked'); }
    if(cs3.checked) { cs4.disabled = false; document.getElementById('tier-cs-4').classList.remove('locked'); } else { cs4.disabled = true; cs4.checked = false; document.getElementById('tier-cs-4').classList.add('locked'); }

    let ms1 = document.getElementById('chk-ms-1'); let ms2 = document.getElementById('chk-ms-2'); let ms3 = document.getElementById('chk-ms-3');
    if(ms1 && ms1.checked) { ms2.disabled = false; document.getElementById('tier-ms-2').classList.remove('locked'); } else if(ms1) { ms2.disabled = true; ms2.checked = false; document.getElementById('tier-ms-2').classList.add('locked'); }
    if(ms2 && ms2.checked) { ms3.disabled = false; document.getElementById('tier-ms-3').classList.remove('locked'); } else if(ms2) { ms3.disabled = true; ms3.checked = false; document.getElementById('tier-ms-3').classList.add('locked'); }

    let skills = Array.from(document.querySelectorAll('.skill-chk:checked')).map(cb => cb.id);
    localStorage.setItem('skillLocks', JSON.stringify(skills));
}

function loadSkillLocks() {
    let skills = JSON.parse(localStorage.getItem('skillLocks')) || [];
    skills.forEach(id => { let el = document.getElementById(id); if(el) el.checked = true; });
    checkSkillLocks(); 
}

// DECK
const deck = [
    { suit: "Lunar", name: "🌑 The Void Moon", meaning: "Rest completely. No active holds." },
    { suit: "Lunar", name: "🌓 The Waxing Pull", meaning: "Building energy. Prep and hydrate." },
    { suit: "Lunar", name: "🌕 The Full Pull", meaning: "Maximum intensity. Push your peaks." },
    { suit: "Lunar", name: "🌗 The Waning Crescent", meaning: "Declutter. Change pillowcases, stretch passively." },
    { suit: "Lunar", name: "🩸 The Blood Moon", meaning: "Harsh internal shift. Expect unusual tension." },
    { suit: "Lunar", name: "🌔 The Gibbous", meaning: "Hold poses a few seconds longer." },
    { suit: "Lunar", name: "🌒 The Sliver", meaning: "Fragile state. Treat joints delicately." },
    { suit: "Lunar", name: "💫 The Halo", meaning: "Protection. Maintain your routine." },
    { suit: "Lunar", name: "🌊 The High Tide", meaning: "Fluidity. Fascia will glide beautifully." },
    { suit: "Lunar", name: "🏜️ The Neap Tide", meaning: "Stagnation. Stiff and dry. Double hydration." },
    { suit: "Lunar", name: "☄️ The Meteor", meaning: "Sudden spark. Try a new technique." },
    { suit: "Lunar", name: "🌌 The Deep Sky", meaning: "Introspection. Focus on physical sensation." },
    { suit: "Lunar", name: "☀️ The Solstice", meaning: "Peak heat. Primed for deep conditioning." },
    { suit: "Botanical", name: "🌿 The Node", meaning: "Cut dead weight from your life or routine." },
    { suit: "Botanical", name: "🍂 Root Rot", meaning: "Suffocation. Strip routine back to the minimum." },
    { suit: "Botanical", name: "🧬 The Variegation", meaning: "Mutation. Introduce a new active or goal." },
    { suit: "Botanical", name: "🪢 The Aerial Root", meaning: "Reaching for support. Use props today." },
    { suit: "Botanical", name: "🍄 The Spore", meaning: "Hidden growth beneath the surface." },
    { suit: "Botanical", name: "🥀 The Blight", meaning: "Environmental stress is compromising your system." },
    { suit: "Botanical", name: "🌲 The Taproot", meaning: "Deep grounding. Focus on foundation." },
    { suit: "Botanical", name: "🌱 The Sapling", meaning: "Fragile new beginnings. Protect progress." },
    { suit: "Botanical", name: "🌳 The Canopy", meaning: "Over-extension. Stop spreading energy too thin." },
    { suit: "Botanical", name: "🪨 Dormancy", meaning: "A natural biological pause. Wait it out." },
    { suit: "Botanical", name: "✂️ The Graft", meaning: "Forced integration. Combine routines carefully." },
    { suit: "Botanical", name: "🌻 Phototropism", meaning: "Chasing light. Follow what brings joy today." },
    { suit: "Botanical", name: "🪴 The Rhizome", meaning: "Lateral movement. Becoming more stable." },
    { suit: "Barrier", name: "🛡️ The Occlusive", meaning: "Seal it in. Protect your energy and moisture." },
    { suit: "Barrier", name: "🧪 The Acid", meaning: "Burn it away. Deep cleanses and harsh truths." },
    { suit: "Barrier", name: "💧 The Humectant", meaning: "Draw it in. Absorb positive energy." },
    { suit: "Barrier", name: "🧈 The Lipid", meaning: "Structural repair. Thick moisturizers." },
    { suit: "Barrier", name: "🌋 The Purge", meaning: "Push through the breakout or emotional block." },
    { suit: "Barrier", name: "🧼 The Cleanse", meaning: "Wash the slate clean. Forgive yourself." },
    { suit: "Barrier", name: "🧱 The Matrix", meaning: "Foundation cracked. Halt intense actives." },
    { suit: "Barrier", name: "🧫 The Microbiome", meaning: "Delicate balance. Highly reactive today." },
    { suit: "Barrier", name: "🫧 The Ferment", meaning: "Slow progress. Trust daily habits." },
    { suit: "Barrier", name: "🧴 The Emollient", meaning: "Smoothing things over. Diplomacy and massage." },
    { suit: "Barrier", name: "☀️ The Shield", meaning: "Absolute defense. Impenetrable boundaries." },
    { suit: "Barrier", name: "🩹 The Patch", meaning: "Spot treatment. Fix the one specific thing bothering you." },
    { suit: "Vessel", name: "🕸️ The Fascia", meaning: "Everything is connected. Look at the whole chain." },
    { suit: "Vessel", name: "⚡ The Nerve", meaning: "Danger. Back away from what causes stress." },
    { suit: "Vessel", name: "⚓ The Resistance", meaning: "Heavy gravity. Today will feel harder." },
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
    let cName = document.getElementById('card-name'); if(cName) cName.innerText = card.name; 
    let cSuit = document.getElementById('card-suit'); if(cSuit) cSuit.innerText = `Suit of ${card.suit}`; 
    let cMean = document.getElementById('card-meaning'); if(cMean) cMean.innerText = card.meaning;
}

// LOGS
function compileJournal() {
    if(hasCompiledToday) { alert("You have already compiled today's journal!"); return; }
    
    let dumpEl = document.getElementById('brain-dump');
    let dump = dumpEl ? dumpEl.value : "";
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
    
    localStorage.setItem('lastCompileDate', new Date().toLocaleDateString());
    hasCompiledToday = true; 
    let warnEl = document.getElementById('journal-warning');
    if(warnEl) { warnEl.style.display = 'block'; warnEl.innerText = "✅ Journal compiled for today."; }

    loggedFaceZones = []; localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones));
    loggedBodyZones = []; localStorage.setItem('stagedBody', JSON.stringify(loggedBodyZones));
    document.querySelectorAll('.routine-chk').forEach(cb => cb.checked = false); 
    if(dumpEl) dumpEl.value = '';
    
    renderMapLogs('face'); renderMapLogs('body'); renderJournals();
}

function renderJournals() {
    let journals = JSON.parse(localStorage.getItem('journals')) || []; let ul = document.getElementById('journal-list'); if(!ul) return;
    ul.innerHTML = '';
    journals.forEach(j => {
        ul.innerHTML += `
        <li>
            <span class="journal-header">${j.date}</span>
            <div class="journal-data">
                <strong>Atmosphere:</strong> ${j.weather}<br>
                <strong>Routine Completed:</strong> ${j.routine}<br>
                <strong>Face Map:</strong> ${j.face}<br>
                <strong>Body Map:</strong> ${j.body}<br>
                <strong>Oracle:</strong> ${j.card}
            </div>
            <em>"${j.thoughts}"</em>
        </li>`;
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
function displayAura(name, advice) { 
    let nEl = document.getElementById('aura-name'); if(nEl) nEl.innerText = name; 
    let aEl = document.getElementById('aura-advice'); if(aEl) aEl.innerText = advice; 
}
