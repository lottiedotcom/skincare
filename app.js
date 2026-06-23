// Global State - WRAPPED IN FAIL-SAFES
let userProfile = { 
    lat: '32.864', lon: '-108.222', routine: {}, 
    skinType: 'combination', allergies: '', wakeTime: '', sleepTime: '',
    barrierState: 'Healthy', hormonePhase: 'Follicular', primaryFocus: 'Hydration'
};
let loggedFaceZones = []; let loggedBodyZones = []; 
let liveData = { dew: 0, uv: 0, aqi: 0, pressure: 0 };
let currentDrawnCard = "None Drawn Today";
let hasCompiledToday = false; 
let breathingInterval;

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todayName = daysOfWeek[new Date().getDay()];

// BODY ZONES
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

// 5x5 ACADEMY CURRICULUM
const academyData = [
    {
        title: "Chest Stand",
        tiers: [
            { level: 1, name: "Foundation & Spinal Hygiene", drills: ["Cat-Cow x15", "Thoracic Rotations x10", "Puppy Pose 1m", "Neck Rolls x10", "Scapular Shrugs x15"], quiz: { q: "When holding Puppy Pose, where should you feel the engagement?", a: "In my lower back, pushing a deep pinch.", b: "In my upper back, with core slightly tucked.", ans: "b", fail: "Oops! 🛑 If you dump the bend into your lumbar, your thoracic spine won't open. Tuck your pelvis and try again tomorrow! 💕" } },
            { level: 2, name: "Activation & Posterior Chain", drills: ["Prone Cobra Lifts x10", "Y-T-W Raises x15", "Posterior Pelvic Tilts", "Glute Bridges x20", "Sphinx Hold 2m"], quiz: { q: "During Cobra Lifts, what muscle group should be doing the hardest work?", a: "The glutes and upper back.", b: "My arms pushing the floor.", ans: "a", fail: "Ah! 🛑 Cobra liftoffs are AROM (Active Range of Motion). Your back muscles must do the lifting, not your arms pushing! 💕" } },
            { level: 3, name: "Isometric Endurance", drills: ["Bow Pose Hold 30s", "Locust Hold 45s", "Bridge Push-ups x5", "Camel Pose 1m", "Scapular Retraction Holds"], quiz: { q: "How should you breathe while holding a deep bridge?", a: "Hold my breath to keep my core tight.", b: "Deep, slow breathing into my belly.", ans: "b", fail: "Oh no! 🛑 Holding your breath traps your nervous system in 'fight or flight', locking the fascia. Breathe through the tension! 💕" } },
            { level: 4, name: "Neural Gliding & Deep Prep", drills: ["Sciatic Flossing x15/leg", "Brachial Flossing x15/arm", "Wall Pectoral Stretch", "Camel Drops x5", "Forearm Bridge Prep"], quiz: { q: "If you feel a sharp, electrical tingling in your arm during pectoral stretches, what do you do?", a: "Push through it; it's a deep stretch.", b: "Stop immediately and do nerve flossing.", ans: "b", fail: "Wait! 🛑 Tingling is nerve tension. Nerves do NOT stretch; they tear. Back off and floss instead. 💕" } },
            { level: 5, name: "Sub-shape Mastery", drills: ["Supported Chest Stand (Blocks)", "Chin Stand", "Hollow Back Prep", "Scorpion Drills", "Wall Chest Stand"], quiz: { q: "What is the safest way to exit a chest stand?", a: "Roll out sideways.", b: "Tuck the chin and roll forward smoothly.", ans: "a", fail: "Careful! 🛑 Rolling forward compresses the cervical spine dangerously under load. Always roll out sideways. 💕" } }
        ]
    },
    {
        title: "Middle Splits",
        tiers: [
            { level: 1, name: "Capsule Isolation", drills: ["Frog Pose 2m", "Hip Circles x10", "90/90 Switches x10", "Kneeling Adductor Stretch", "Butterfly 2m"], quiz: { q: "If your knees hurt in Frog Pose, what should you do?", a: "Put padding under my knees and adjust hip angle.", b: "Squeeze my knees into the floor harder.", ans: "a", fail: "No! 🛑 Joint pain means structural pinching. Pad the joints and alter the angle to find the muscle belly! 💕" } },
            { level: 2, name: "Lengthening (PNF)", drills: ["PNF Pancake 2m", "Supine Wall Straddle 3m", "Tailor Pose", "Cossack Squats x10", "Wide Leg Fold"], quiz: { q: "What is the key to a safe pancake fold?", a: "Rounding my back to get my head down.", b: "Anterior pelvic tilt (sticking glutes out).", ans: "b", fail: "Oops! 🛑 Rounding the back just stretches the spine. Tilt the pelvis to target the adductors! 💕" } },
            { level: 3, name: "Active Strength", drills: ["Straddle Leg Lifts x10", "Side Lunges x15", "Isometric Skaters", "Glute Medius Clamshells", "Adductor Slides"], quiz: { q: "Why do we do leg lifts in a straddle?", a: "To build End-Range Strength.", b: "To warm up the knees.", ans: "a", fail: "Not quite! 🛑 Active liftoffs build the crucial strength needed to protect the joint when you are in the deepest part of the split. 💕" } },
            { level: 4, name: "Neural Gliding", drills: ["Supine Sciatic Glides x15", "Hamstring Flossing", "Flossing in Pike", "Active Point/Flex", "Hip Flexor Glides"], quiz: { q: "True or False: Neural gliding should feel like a deep, painful burn.", a: "True.", b: "False.", ans: "b", fail: "False! 🛑 Gliding should feel like gentle movement, not a burn. Pain means inflammation. 💕" } },
            { level: 5, name: "Peak Mastery", drills: ["Oversplit Prep (Blocks)", "PNF Middle Split", "Wall Middle Split", "Active Straddle Hold", "Peak Middle Split"], quiz: { q: "Where should your toes point in a true middle split?", a: "Forward or slightly up.", b: "Straight down behind me.", ans: "a", fail: "Watch out! 🛑 Pointing them down internally rotates the femur and grinds the hip joint. Keep them up or forward! 💕" } }
        ]
    }
];

let activeQuizTier = null;

// INIT
window.onload = () => {
    try {
        loadData(); fetchRealData(); populateSelects(); renderAcademy();
        renderTodayRoutine(); renderSettingsRoutine(); renderProducts(); renderJournals(); renderVault(); 
        checkWeeklyAura(); 
        
        let lastCompile = localStorage.getItem('lastCompileDate');
        if(lastCompile === new Date().toLocaleDateString()) {
            hasCompiledToday = true;
            let warning = document.getElementById('journal-warning');
            if(warning) { warning.style.display = 'block'; warning.innerText = "✅ Journal already compiled for today."; }
        }
    } catch(e) { console.error("Safe Load Error: ", e); }
};

// TABS
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    let targetSection = document.getElementById(tabId); if(targetSection) targetSection.classList.add('active');
    
    let navId = tabId === 'skill-tree-tab' ? 'flexibility' : tabId;
    let targetNav = document.querySelector(`.tab-btn[onclick="openTab('${navId}')"]`);
    if(targetNav) targetNav.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// LOCATION
function grabLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            let latEl = document.getElementById('lat-input'); let lonEl = document.getElementById('lon-input');
            if(latEl) latEl.value = pos.coords.latitude.toFixed(4); if(lonEl) lonEl.value = pos.coords.longitude.toFixed(4);
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
    
    let barEl = document.getElementById('barrier-state'); if(barEl) userProfile.barrierState = barEl.value;
    let horEl = document.getElementById('hormone-phase'); if(horEl) userProfile.hormonePhase = horEl.value;
    let focEl = document.getElementById('primary-focus'); if(focEl) userProfile.primaryFocus = focEl.value;
    
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    updateSkinAnalysis();
}

function loadData() {
    const savedProf = localStorage.getItem('userProfile');
    if (savedProf) {
        userProfile = JSON.parse(savedProf);
        // Migrate old routine format to AM/PM structure
        let needsMigration = false;
        if(!userProfile.routine || Array.isArray(userProfile.routine)) needsMigration = true;
        else if (userProfile.routine["Monday"] && Array.isArray(userProfile.routine["Monday"])) needsMigration = true;
        
        if (needsMigration) {
            userProfile.routine = { 
                "Monday":{am:[], pm:[]}, "Tuesday":{am:[], pm:[]}, "Wednesday":{am:[], pm:[]}, 
                "Thursday":{am:[], pm:[]}, "Friday":{am:[], pm:[]}, "Saturday":{am:[], pm:[]}, "Sunday":{am:[], pm:[]} 
            };
        }
        
        if(!userProfile.barrierState) userProfile.barrierState = 'Healthy';
        if(!userProfile.hormonePhase) userProfile.hormonePhase = 'Follicular';
        if(!userProfile.primaryFocus) userProfile.primaryFocus = 'Hydration';
        
        let latEl = document.getElementById('lat-input'); if(latEl) latEl.value = userProfile.lat || '';
        let lonEl = document.getElementById('lon-input'); if(lonEl) lonEl.value = userProfile.lon || '';
        let skinEl = document.getElementById('skin-type-select'); if(skinEl) skinEl.value = userProfile.skinType || 'combination';
        let allEl = document.getElementById('allergy-input'); if(allEl) allEl.value = userProfile.allergies || '';
        let barEl = document.getElementById('barrier-state'); if(barEl) barEl.value = userProfile.barrierState;
        let horEl = document.getElementById('hormone-phase'); if(horEl) horEl.value = userProfile.hormonePhase;
        let focEl = document.getElementById('primary-focus'); if(focEl) focEl.value = userProfile.primaryFocus;
    } else {
        userProfile.routine = { 
            "Monday":{am:[], pm:[]}, "Tuesday":{am:[], pm:[]}, "Wednesday":{am:[], pm:[]}, 
            "Thursday":{am:[], pm:[]}, "Friday":{am:[], pm:[]}, "Saturday":{am:[], pm:[]}, "Sunday":{am:[], pm:[]} 
        };
    }
    
    loggedFaceZones = JSON.parse(localStorage.getItem('stagedFace')) || [];
    loggedBodyZones = JSON.parse(localStorage.getItem('stagedBody')) || [];
    
    let pillowElem = document.getElementById('pillowcase-date');
    if(pillowElem) pillowElem.innerText = localStorage.getItem('pillowDate') || "Not Logged";
    
    renderMapLogs('face'); renderMapLogs('body');
}

// SMART SKIN ANALYST
function updateSkinAnalysis() {
    let sa = document.getElementById('smart-skin-analysis'); if(!sa) return;
    let b = userProfile.barrierState; let h = userProfile.hormonePhase; let a = liveData.aqi || 0;
    
    if (b === 'Compromised' && a > 20) {
        sa.innerText = `🚨 System Alert: PM2.5 pollution is high (${a}) and your barrier is Compromised. Skip exfoliants today; mandate heavy occlusives!`;
    } else if (b === 'Healing' || b === 'OverExfoliated') {
        sa.innerText = `✨ Gentle Phase: Barrier is fragile. Stick to hydration, ceramide repair, and skip the harsh acids.`;
    } else if (h === 'Luteal') {
        sa.innerText = `🩸 Hormonal Shift: You are in your Luteal phase. Sebum is spiking. Preemptively use BHA/Salicylic acid to clear congestion today.`;
    } else {
        sa.innerText = `🌸 Atmosphere and barrier are balanced! Proceed optimally with your ${userProfile.primaryFocus} routine.`;
    }
}

// AM/PM ROUTINE BUILDER
function addRoutineStep() {
    let dayEl = document.getElementById('routine-day-select'); 
    let timeEl = document.getElementById('routine-time-select');
    let stepEl = document.getElementById('new-routine-step');
    if(!dayEl || !timeEl || !stepEl) return;
    
    let day = dayEl.value; let time = timeEl.value; let step = stepEl.value; 
    if(!step) return;
    
    if(!userProfile.routine[day]) userProfile.routine[day] = {am:[], pm:[]};
    userProfile.routine[day][time].push(step);
    localStorage.setItem('userProfile', JSON.stringify(userProfile)); stepEl.value = '';
    renderSettingsRoutine(); renderTodayRoutine();
}

function removeRoutineStep(day, time, index) {
    if(!userProfile.routine[day] || !userProfile.routine[day][time]) return;
    userProfile.routine[day][time].splice(index, 1); 
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    renderSettingsRoutine(); renderTodayRoutine();
}

function renderSettingsRoutine() {
    let dayEl = document.getElementById('routine-day-select'); 
    let listAm = document.getElementById('settings-routine-list-am'); 
    let listPm = document.getElementById('settings-routine-list-pm'); 
    if(!dayEl || !listAm || !listPm) return;
    
    listAm.innerHTML = ''; listPm.innerHTML = '';
    let day = dayEl.value; 
    let dayRoutines = userProfile.routine[day] || {am:[], pm:[]};
    
    dayRoutines.am.forEach((step, idx) => { listAm.innerHTML += `<li style="display:flex; justify-content:space-between;">${step} <button class="prod-del" onclick="removeRoutineStep('${day}', 'am', ${idx})">X</button></li>`; });
    dayRoutines.pm.forEach((step, idx) => { listPm.innerHTML += `<li style="display:flex; justify-content:space-between;">${step} <button class="prod-del" onclick="removeRoutineStep('${day}', 'pm', ${idx})">X</button></li>`; });
}

function renderTodayRoutine() {
    let head = document.getElementById('today-routine-header'); 
    let listAm = document.getElementById('custom-routine-list-am'); 
    let listPm = document.getElementById('custom-routine-list-pm'); 
    if(!head || !listAm || !listPm) return;
    
    head.innerText = `✅ ${todayName}'s Routine`; 
    listAm.innerHTML = ''; listPm.innerHTML = '';
    
    let dayRoutines = userProfile.routine[todayName] || {am:[], pm:[]};
    
    if(dayRoutines.am.length === 0 && dayRoutines.pm.length === 0) { 
        listAm.innerHTML = "<p class='small-text'>No routines set for today. Go to Settings!</p>"; 
        return; 
    }
    
    dayRoutines.am.forEach(step => { listAm.innerHTML += `<label class="check-tag"><input type="checkbox" class="routine-chk" value="AM: ${step}"> ${step}</label>`; });
    if(dayRoutines.am.length === 0) listAm.innerHTML = "<p class='small-text'>No AM routine.</p>";
    
    dayRoutines.pm.forEach(step => { listPm.innerHTML += `<label class="check-tag"><input type="checkbox" class="routine-chk" value="PM: ${step}"> ${step}</label>`; });
    if(dayRoutines.pm.length === 0) listPm.innerHTML = "<p class='small-text'>No PM routine.</p>";
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
        let actEl = document.getElementById('live-flex-action'); 
        if(actEl) {
            if(liveData.pressure < 29.8) {
                actEl.innerText = "The pressure is dropping today! 🌧️ This can make your joints feel extra sticky and grumpy. Treat your body to a sweet 15-minute heated warm-up before you try to bend! 💕";
            } else {
                actEl.innerText = "Pressure is optimal! ✨ Your body is primed, lubricated, and ready for deep, active holds. Have a beautiful session! 🎀";
            }
        }
        updateSkinAnalysis();
    } catch (error) { console.error("API Error"); }
}

// MAPS
function populateSelects() {
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
    
    // Only draw dots for the Body map now. Face map has numbers baked in.
    if(mapType === 'body') {
        let container = document.getElementById(`body-map-container`);
        if(container) {
            container.querySelectorAll('.target-dot').forEach(el => el.remove());
            bodyZones.forEach(zone => {
                let dot = document.createElement('div'); dot.className = 'target-dot'; dot.style.left = `${zone.x}%`; dot.style.top = `${zone.y}%`; 
                dot.innerText = zone.id;
                let match = logs.find(l => parseInt(l.zone.split(":")[0]) === zone.id);
                if(match) { dot.style.backgroundColor = match.color; dot.style.color = '#fff'; }
                container.appendChild(dot);
            });
        }
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
    
    if(!name) return; let exp = "N/A"; let addedTime = new Date().getTime();
    if(pao && !wish) { let d = new Date(); d.setMonth(d.getMonth() + pao); exp = d.toLocaleDateString(); }
    
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    prods.push({ name, brand, type, pao, price, url, wish, fav, exp, addedTime });
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
    
    let now = new Date().getTime();
    
    prods.forEach((p, idx) => {
        let f = p.fav ? '❤️ ' : ''; let tagClass = `tag-${p.type.split('/')[0].toLowerCase()}`;
        
        let paoBarHTML = '';
        if(p.pao && !p.wish && p.addedTime) {
            let daysPassed = (now - p.addedTime) / (1000 * 3600 * 24);
            let totalDays = p.pao * 30;
            let percent = Math.min((daysPassed / totalDays) * 100, 100);
            let barColor = percent < 60 ? '#66cc99' : (percent < 90 ? '#ffcc00' : '#cc0000');
            paoBarHTML = `<div class="pao-bar-container"><div class="pao-bar-fill" style="width: ${percent}%; background: ${barColor};"></div></div>`;
        }
        
        grid.innerHTML += `
            <div class="product-card">
                <div class="prod-header">${f}${p.name}</div>
                <div><span class="prod-tag ${tagClass}">${p.type}</span></div>
                <div style="font-size:0.75rem; color:#885566; margin-top:5px;">${p.brand} | ${p.price || "-"}</div>
                ${p.exp !== "N/A" ? `<div style="font-size:0.75rem; margin-top:5px;">⏳ ${p.exp}</div>` : ''}
                ${paoBarHTML}
                <button class="prod-del" onclick="removeProduct(${idx})">Remove</button>
            </div>`;
    });
}

function logHygiene(type) { 
    let d = new Date().toLocaleDateString(); 
    localStorage.setItem('pillowDate', d); 
    let pEl = document.getElementById('pillowcase-date'); if(pEl) pEl.innerText = d; 
}

// RECOVERY PANELS
function toggleRecoveryPanel(panelId) {
    let panel = document.getElementById(panelId);
    if(!panel) return;
    
    // If it's the pacer, handle the breathing interval
    if (panelId === 'somatic-pacer') {
        const circle = document.getElementById('breath-circle');
        const text = document.getElementById('breath-text');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            let phase = 0; clearInterval(breathingInterval);
            breathingInterval = setInterval(() => {
                if(phase === 0) { text.innerText = "Inhale..."; circle.classList.add('breathe-in'); circle.classList.remove('breathe-out'); }
                else if(phase === 1) { text.innerText = "Hold..."; }
                else if(phase === 2) { text.innerText = "Exhale..."; circle.classList.add('breathe-out'); circle.classList.remove('breathe-in'); }
                else if(phase === 3) { text.innerText = "Hold..."; }
                phase = (phase + 1) % 4;
            }, 4000); 
        } else {
            panel.style.display = 'none'; clearInterval(breathingInterval);
        }
    } else {
        // Normal toggle for text panels
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

// SMART COACH
function addToVault() {
    let titleEl = document.getElementById('vault-title'); if(!titleEl) return;
    let title = titleEl.value; let url = document.getElementById('vault-url') ? document.getElementById('vault-url').value : "";
    let duration = document.getElementById('vault-duration') ? document.getElementById('vault-duration').value : ""; let focus = document.getElementById('vault-focus') ? document.getElementById('vault-focus').value : "";
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
    
    let sleepEl = document.getElementById('sleep-hours');
    let waterEl = document.getElementById('water-oz');
    let sleep = sleepEl ? parseFloat(sleepEl.value) : 0;
    let water = waterEl ? parseFloat(waterEl.value) : 0;
    
    res.style.display = 'block';
    
    let nervePain = loggedBodyZones.some(log => log.type.includes("Nerve"));
    
    if (nervePain) { 
        res.innerHTML = "🚨 <strong>COACH VETO:</strong> Nerve tension detected. <em>Mandatory: Somatic Reset & Nerve Flossing only.</em>"; 
    } 
    else if (sleep < 6 || water < 30) {
        res.innerHTML = `🚨 <strong>COACH VETO:</strong> You only logged ${sleep}hrs sleep and ${water}oz water. Your fascia is dehydrated and rigid today. Deep peak poses are highly dangerous in this state. <em>I am shifting your focus to Lymphatic Drainage and Mobility.</em>`;
    }
    else if (focus === "Somatic Reset" || focus === "Lymphatic Drainage") { 
        res.innerHTML = `✅ <strong>RECOVERY:</strong> Great choice. Check the Recovery box above.`; 
    } 
    else { 
        res.innerHTML = `✅ <strong>CONDITION GREEN:</strong> Your system is hydrated and primed for <strong>${focus}</strong>. Proceed with vault routines.`; 
    }
}

// 5x5 ACADEMY
function renderAcademy() {
    const container = document.getElementById('academy-courses-container'); if(!container) return;
    container.innerHTML = '';
    let savedProgress = JSON.parse(localStorage.getItem('academyProgress')) || {};
    
    academyData.forEach((path, pIdx) => {
        let pathHTML = `<div class="skill-path"><h3>🌳 ${path.title} Path</h3>`;
        path.tiers.forEach((tier, tIdx) => {
            let tierId = `tier-${pIdx}-${tIdx}`;
            let isUnlocked = (tIdx === 0) || (savedProgress[`tier-${pIdx}-${tIdx-1}`] === true);
            let isCompleted = savedProgress[tierId] === true;
            let lockedClass = isUnlocked ? '' : 'locked';
            let btnDisabled = isUnlocked && !isCompleted ? '' : 'disabled';
            
            let drillsHTML = tier.drills.map(d => `<label class="check-tag" style="justify-content:flex-start;"><input type="checkbox" class="drill-chk-${tierId}" ${isCompleted?'checked disabled':''}> ${d}</label>`).join('');
            let actionBtn = isCompleted ? 
                `<button class="action-btn" style="background:#66cc99;" disabled>✨ Mastered!</button>` :
                `<button class="action-btn" ${btnDisabled} onclick="triggerQuiz(${pIdx}, ${tIdx})">🧠 Take Form Quiz to Unlock</button>`;

            pathHTML += `
                <div class="skill-tier ${lockedClass}" id="${tierId}">
                    <h4>Level ${tier.level}: ${tier.name}</h4>
                    <div class="tier-drills">${drillsHTML}</div>
                    ${actionBtn}
                </div>
            `;
        });
        pathHTML += `</div>`;
        container.innerHTML += pathHTML;
    });
}

function triggerQuiz(pathIdx, tierIdx) {
    let tierId = `tier-${pathIdx}-${tierIdx}`;
    let checkboxes = document.querySelectorAll(`.drill-chk-${tierId}`);
    let allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    if(!allChecked) { alert("You must check off all 5 drills before taking the Form Quiz!"); return; }
    
    activeQuizTier = { pathIdx, tierIdx, tierId };
    let quizData = academyData[pathIdx].tiers[tierIdx].quiz;
    
    document.getElementById('quiz-question').innerText = quizData.q;
    document.getElementById('quiz-opt-a').innerText = "A) " + quizData.a;
    document.getElementById('quiz-opt-b').innerText = "B) " + quizData.b;
    document.getElementById('quiz-feedback').style.display = 'none';
    document.getElementById('quiz-modal').style.display = 'flex';
}

function submitQuiz(answer) {
    let quizData = academyData[activeQuizTier.pathIdx].tiers[activeQuizTier.tierIdx].quiz;
    let feedback = document.getElementById('quiz-feedback');
    feedback.style.display = 'block';
    
    if(answer === quizData.ans) {
        feedback.style.color = '#66cc99'; feedback.style.background = '#e6ffe6';
        feedback.innerText = "✨ Correct! Level Mastered. You have unlocked the next tier!";
        let savedProgress = JSON.parse(localStorage.getItem('academyProgress')) || {};
        savedProgress[activeQuizTier.tierId] = true; localStorage.setItem('academyProgress', JSON.stringify(savedProgress));
        setTimeout(() => { closeQuiz(); renderAcademy(); }, 2000);
    } else {
        feedback.style.color = '#cc0066'; feedback.style.background = '#ffe6f2';
        feedback.innerText = quizData.fail;
        document.querySelectorAll(`.drill-chk-${activeQuizTier.tierId}`).forEach(cb => cb.checked = false);
        setTimeout(() => { closeQuiz(); }, 4000);
    }
}

function closeQuiz() { document.getElementById('quiz-modal').style.display = 'none'; activeQuizTier = null; }

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
    
    let dumpEl = document.getElementById('brain-dump'); let dump = dumpEl ? dumpEl.value : "";
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
    localStorage.setItem('lastCompileDate', new Date().toLocaleDateString()); hasCompiledToday = true; 
    
    let warnEl = document.getElementById('journal-warning'); if(warnEl) { warnEl.style.display = 'block'; warnEl.innerText = "✅ Journal compiled for today."; }

    loggedFaceZones = []; localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones));
    loggedBodyZones = []; localStorage.setItem('stagedBody', JSON.stringify(loggedBodyZones));
    document.querySelectorAll('.routine-chk').forEach(cb => cb.checked = false); if(dumpEl) dumpEl.value = '';
    
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
