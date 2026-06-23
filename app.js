// ==========================================
// GLOBAL STATE & INITIALIZATION
// ==========================================
let userProfile = { 
    lat: '32.864', lon: '-108.222', routine: {}, 
    skinType: 'combination', allergies: '', wakeTime: '', sleepTime: '',
    barrierState: 'Healthy', hormonePhase: 'Follicular', primaryFocus: 'Hydration'
};
let loggedFaceZones = []; 
let loggedBodyZones = []; 
let liveData = { dew: 0, uv: 0, aqi: 0, pressure: 0 };
let currentDrawnCard = "None Drawn Today";
let hasCompiledToday = false; 

// Timers
let breathingTimer;
let breathingPhaseTimeout;
let lymphTimerInterval;

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todayName = daysOfWeek[new Date().getDay()];

// Body Map Coordinates (Face map no longer uses dots, so coordinates are removed)
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
    try {
        loadData(); fetchRealData(); renderAcademy();
        renderTodayRoutine(); renderSettingsRoutine(); renderProducts(); renderJournals(); renderVault(); 
        renderConsistencyBanner(); checkSkillLocks(); 
        
        let lastCompile = localStorage.getItem('lastCompileDate');
        if(lastCompile === new Date().toLocaleDateString()) {
            hasCompiledToday = true;
            let warning = document.getElementById('journal-warning');
            if(warning) { warning.style.display = 'block'; warning.innerText = "✅ Daily Map already compiled for today."; }
        }
    } catch(e) { console.error("Safe Load Error: ", e); }
};

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    let targetSection = document.getElementById(tabId); if(targetSection) targetSection.classList.add('active');
    
    let navId = tabId === 'skill-tree-tab' ? 'flexibility' : tabId;
    let targetNav = document.querySelector(`.tab-btn[onclick="openTab('${navId}')"]`);
    if(targetNav) targetNav.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// SETTINGS & DATA LOADING
// ==========================================
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
        if(!userProfile.routine || !userProfile.routine["Monday"] || Array.isArray(userProfile.routine["Monday"])) {
            userProfile.routine = { "Monday":{am:[], pm:[]}, "Tuesday":{am:[], pm:[]}, "Wednesday":{am:[], pm:[]}, "Thursday":{am:[], pm:[]}, "Friday":{am:[], pm:[]}, "Saturday":{am:[], pm:[]}, "Sunday":{am:[], pm:[]} };
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
        userProfile.routine = { "Monday":{am:[], pm:[]}, "Tuesday":{am:[], pm:[]}, "Wednesday":{am:[], pm:[]}, "Thursday":{am:[], pm:[]}, "Friday":{am:[], pm:[]}, "Saturday":{am:[], pm:[]}, "Sunday":{am:[], pm:[]} };
    }
    
    loggedFaceZones = JSON.parse(localStorage.getItem('stagedFace')) || [];
    loggedBodyZones = JSON.parse(localStorage.getItem('stagedBody')) || [];
    let pillowElem = document.getElementById('pillowcase-date');
    if(pillowElem) pillowElem.innerText = localStorage.getItem('pillowDate') || "Not Logged";
    
    renderMapLogs('face'); renderMapLogs('body');
}

// ==========================================
// SKINCARE & ENVIRONMENT
// ==========================================
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

function updateSkinAnalysis() {
    let sa = document.getElementById('smart-skin-analysis'); if(!sa) return;
    let b = userProfile.barrierState; let h = userProfile.hormonePhase; let a = liveData.aqi || 0;
    
    if (b === 'Compromised' && a > 20) {
        sa.innerText = `🚨 System Alert: PM2.5 pollution is high (${a}) and your barrier is Compromised. Skip exfoliants today; mandate heavy occlusives!`;
    } else if (b === 'Healing' || b === 'OverExfoliated') {
        sa.innerText = `✨ Gentle Phase: Barrier is fragile. Stick to hydration, ceramide repair, and skip the harsh acids.`;
    } else if (h === 'Luteal' || h === 'Menstrual') {
        sa.innerText = `🩸 Hormonal Shift: You are in your ${h} phase. Sebum is spiking. Preemptively use BHA/Salicylic acid to clear congestion today.`;
    } else {
        sa.innerText = `🌸 Atmosphere and barrier are balanced! Proceed optimally with your ${userProfile.primaryFocus} routine.`;
    }
}

// 2D MAP LOGIC
function logFaceZone() {
    let zoneEl = document.getElementById('face-zone-select'); let typeEl = document.getElementById('face-acne-type');
    if(!zoneEl || !typeEl) return;
    let zone = zoneEl.value; let type = typeEl.value;
    let colorMap = {"Cystic":"#cc0000", "Whitehead":"#e6e6e6", "Blackhead":"#333333", "Pustule":"#ff9933", "Papule":"#ff66b2"};
    
    loggedFaceZones.push({ zone, type, color: colorMap[type] });
    localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones)); 
    renderMapLogs('face');
    
    // Dynamic Face Map Analysis (Softer Language)
    let faceAnalysis = document.getElementById('face-map-analysis');
    if(faceAnalysis && zone.includes("Jawline") && userProfile.hormonePhase === 'Luteal') {
        faceAnalysis.style.display = 'block';
        faceAnalysis.innerText = "Possible hormonal inflammation on the jawline 🌸 Skip manual exfoliation there today, apply ice, and stick to your spot treatments!";
    } else if (faceAnalysis) {
        faceAnalysis.style.display = 'none';
    }
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
    // No dots rendered for face map; it just lists them neatly below.
    logs.forEach((log, idx) => {
        list.innerHTML += `<li style="border-left: 5px solid ${log.color};"><strong>${log.zone}</strong>: ${log.type} <button class="prod-del" style="float:right;" onclick="removeMapLog('${mapType}', ${idx})">X</button></li>`;
    });
}

function removeMapLog(mapType, idx) {
    if(mapType === 'face') { loggedFaceZones.splice(idx, 1); localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones)); }
    else { loggedBodyZones.splice(idx, 1); localStorage.setItem('stagedBody', JSON.stringify(loggedBodyZones)); }
    renderMapLogs(mapType);
}

// DIGITAL VANITY (PAO tracker using Date Opened)
function addProduct() {
    let nameEl = document.getElementById('prod-name'); if(!nameEl) return;
    let name = nameEl.value; 
    let brand = document.getElementById('prod-brand') ? document.getElementById('prod-brand').value : "";
    let type = document.getElementById('prod-type') ? document.getElementById('prod-type').value : "Other"; 
    let paoEl = document.getElementById('prod-pao'); let pao = paoEl ? parseInt(paoEl.value) : 0;
    let price = document.getElementById('prod-price') ? document.getElementById('prod-price').value : ""; 
    let openDate = document.getElementById('prod-open-date') ? document.getElementById('prod-open-date').value : "";
    let wish = document.getElementById('prod-wishlist') ? document.getElementById('prod-wishlist').checked : false; 
    let fav = document.getElementById('prod-fav') ? document.getElementById('prod-fav').checked : false;
    
    if(!name) return; let exp = "Sealed 🔒"; let addedTime = null;
    if(pao && !wish && openDate) { 
        let d = new Date(openDate); 
        addedTime = d.getTime();
        d.setMonth(d.getMonth() + pao); 
        exp = `Exp: ${d.toLocaleDateString()}`; 
    }
    
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    prods.push({ name, brand, type, pao, price, wish, fav, exp, addedTime });
    localStorage.setItem('products', JSON.stringify(prods));
    
    document.querySelectorAll('#skincare input[type="text"], #skincare input[type="number"], #skincare input[type="date"]').forEach(i => i.value = '');
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
            let percent = Math.max(0, Math.min((daysPassed / totalDays) * 100, 100));
            let barColor = percent < 60 ? '#66cc99' : (percent < 90 ? '#ffcc00' : '#cc0000');
            paoBarHTML = `<div class="pao-bar-container"><div class="pao-bar-fill" style="width: ${percent}%; background: ${barColor};"></div></div>`;
        }
        
        grid.innerHTML += `
            <div class="product-card">
                <div class="prod-header">${f}${p.name}</div>
                <div><span class="prod-tag ${tagClass}">${p.type}</span></div>
                <div style="font-size:0.75rem; color:#885566; margin-top:5px;">${p.brand} | ${p.price || "-"}</div>
                <div style="font-size:0.75rem; margin-top:5px; font-weight:bold;">${p.exp}</div>
                ${paoBarHTML}
                <button class="prod-del" onclick="removeProduct(${idx})">Remove</button>
            </div>`;
    });
}

// ==========================================
// ROUTINE BUILDER & WEEKLY HEARTS
// ==========================================
let currentCheckType = ""; // Tracks if we are checking AM or PM

function addRoutineStep() {
    let dayEl = document.getElementById('routine-day-select'); let timeEl = document.getElementById('routine-time-select'); let stepEl = document.getElementById('new-routine-step');
    if(!dayEl || !timeEl || !stepEl) return;
    let day = dayEl.value; let time = timeEl.value; let step = stepEl.value; if(!step) return;
    if(!userProfile.routine[day]) userProfile.routine[day] = {am:[], pm:[]};
    userProfile.routine[day][time].push(step);
    localStorage.setItem('userProfile', JSON.stringify(userProfile)); stepEl.value = '';
    renderSettingsRoutine(); renderTodayRoutine();
}

function removeRoutineStep(day, time, index) {
    if(!userProfile.routine[day] || !userProfile.routine[day][time]) return;
    userProfile.routine[day][time].splice(index, 1); localStorage.setItem('userProfile', JSON.stringify(userProfile));
    renderSettingsRoutine(); renderTodayRoutine();
}

function renderSettingsRoutine() {
    let dayEl = document.getElementById('routine-day-select'); let listAm = document.getElementById('settings-routine-list-am'); let listPm = document.getElementById('settings-routine-list-pm'); 
    if(!dayEl || !listAm || !listPm) return;
    listAm.innerHTML = ''; listPm.innerHTML = '';
    let day = dayEl.value; let dayRoutines = userProfile.routine[day] || {am:[], pm:[]};
    dayRoutines.am.forEach((step, idx) => { listAm.innerHTML += `<li style="display:flex; justify-content:space-between;">${step} <button class="prod-del" onclick="removeRoutineStep('${day}', 'am', ${idx})">X</button></li>`; });
    dayRoutines.pm.forEach((step, idx) => { listPm.innerHTML += `<li style="display:flex; justify-content:space-between;">${step} <button class="prod-del" onclick="removeRoutineStep('${day}', 'pm', ${idx})">X</button></li>`; });
}

function renderTodayRoutine() {
    let head = document.getElementById('today-routine-header'); let listAm = document.getElementById('custom-routine-list-am'); let listPm = document.getElementById('custom-routine-list-pm'); 
    if(!head || !listAm || !listPm) return;
    head.innerText = `✅ ${todayName}'s Routine`; listAm.innerHTML = ''; listPm.innerHTML = '';
    
    let dayRoutines = userProfile.routine[todayName] || {am:[], pm:[]};
    
    dayRoutines.am.forEach((step, i) => { listAm.innerHTML += `<label class="check-tag"><input type="checkbox" class="routine-chk-am" onchange="checkRoutineCompletion('am')"> ${step}</label>`; });
    if(dayRoutines.am.length === 0) listAm.innerHTML = "<p class='small-text'>No AM routine.</p>";
    
    dayRoutines.pm.forEach((step, i) => { listPm.innerHTML += `<label class="check-tag"><input type="checkbox" class="routine-chk-pm" onchange="checkRoutineCompletion('pm')"> ${step}</label>`; });
    if(dayRoutines.pm.length === 0) listPm.innerHTML = "<p class='small-text'>No PM routine.</p>";
}

function checkRoutineCompletion(type) {
    let boxes = document.querySelectorAll(`.routine-chk-${type}`);
    let allChecked = Array.from(boxes).every(cb => cb.checked);
    if(allChecked && boxes.length > 0) {
        currentCheckType = type;
        document.getElementById('routine-modal').style.display = 'flex';
    }
}

function confirmRoutineStamp() {
    let heartsData = JSON.parse(localStorage.getItem('weeklyHearts')) || { "Monday":{am:false,pm:false}, "Tuesday":{am:false,pm:false}, "Wednesday":{am:false,pm:false}, "Thursday":{am:false,pm:false}, "Friday":{am:false,pm:false}, "Saturday":{am:false,pm:false}, "Sunday":{am:false,pm:false} };
    heartsData[todayName][currentCheckType] = true;
    localStorage.setItem('weeklyHearts', JSON.stringify(heartsData));
    document.getElementById('routine-modal').style.display = 'none';
    renderConsistencyBanner();
}

function renderConsistencyBanner() {
    let container = document.getElementById('weekly-hearts-container'); if(!container) return;
    container.innerHTML = '';
    let heartsData = JSON.parse(localStorage.getItem('weeklyHearts')) || { "Monday":{am:false,pm:false}, "Tuesday":{am:false,pm:false}, "Wednesday":{am:false,pm:false}, "Thursday":{am:false,pm:false}, "Friday":{am:false,pm:false}, "Saturday":{am:false,pm:false}, "Sunday":{am:false,pm:false} };
    
    let totalHearts = 0;
    const shortDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    fullDays.forEach((day, i) => {
        let amImg = heartsData[day].am ? `<img src="Heart.png" style="width: 15px; height: 15px;">` : `<span style="opacity:0.3;">🤍</span>`;
        let pmImg = heartsData[day].pm ? `<img src="Heart.png" style="width: 15px; height: 15px;">` : `<span style="opacity:0.3;">🤍</span>`;
        if(heartsData[day].am) totalHearts++;
        if(heartsData[day].pm) totalHearts++;
        
        container.innerHTML += `
        <div style="display:flex; flex-direction:column; align-items:center; background:#fff; padding:5px; border-radius:10px; border:1px solid #ffccf2;">
            <span style="font-size:0.7rem; font-weight:bold; color:#cc0066;">${shortDays[i]}</span>
            <div style="display:flex; gap:2px;">${amImg} ${pmImg}</div>
        </div>`;
    });
    
    let text = document.getElementById('heart-status-text');
    if(text) {
        if(totalHearts === 14) text.innerText = "✨ BARRIER THRIVING! Flawless Consistency! ✨";
        else text.innerText = `Collect 14 hearts for Barrier Thriving status! (${totalHearts}/14)`;
    }
}

// ==========================================
// RECOVERY & COACH
// ==========================================
function toggleRecoveryPanel(panelId) {
    let panel = document.getElementById(panelId); if(!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panelId === 'somatic-pacer' && panel.style.display === 'none') {
        clearTimeout(breathingPhaseTimeout); clearInterval(breathingTimer);
    }
    if (panelId === 'lymphatic-sequence' && panel.style.display === 'none') {
        clearInterval(lymphTimerInterval);
    }
}

function toggleInfo(infoId) {
    let el = document.getElementById(infoId);
    if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function updateBreathingMode() {
    clearTimeout(breathingPhaseTimeout); clearInterval(breathingTimer);
    document.getElementById('breath-text').innerText = "Ready...";
    document.getElementById('breath-circle').style.transform = "scale(1)";
}

function startBreathing() {
    clearTimeout(breathingPhaseTimeout); clearInterval(breathingTimer);
    let mode = document.getElementById('breathing-mode').value;
    let circle = document.getElementById('breath-circle');
    let text = document.getElementById('breath-text');
    
    if(mode === 'box') { runBreathingCycle(circle, text, [ {t:"Inhale...", s:1.8, ms:4000}, {t:"Hold...", s:1.8, ms:4000}, {t:"Exhale...", s:1, ms:4000}, {t:"Hold...", s:1, ms:4000} ]); }
    else if(mode === 'sleep') { runBreathingCycle(circle, text, [ {t:"Inhale...", s:1.8, ms:4000}, {t:"Hold...", s:1.8, ms:7000}, {t:"Exhale...", s:1, ms:8000} ]); }
    else if(mode === 'resonance') { runBreathingCycle(circle, text, [ {t:"Inhale...", s:1.8, ms:5000}, {t:"Exhale...", s:1, ms:5000} ]); }
    else if(mode === 'sigh') { runBreathingCycle(circle, text, [ {t:"Inhale...", s:1.5, ms:1500}, {t:"Inhale Deeper...", s:1.8, ms:1000}, {t:"Long Exhale...", s:1, ms:6000} ]); }
}

function runBreathingCycle(circle, text, phases) {
    let step = 0;
    function nextPhase() {
        let p = phases[step];
        text.innerText = p.t;
        circle.style.transition = `transform ${p.ms/1000}s linear`;
        circle.style.transform = `scale(${p.s})`;
        step = (step + 1) % phases.length;
        breathingPhaseTimeout = setTimeout(nextPhase, p.ms);
    }
    nextPhase();
}

function startLymphTimer() {
    clearInterval(lymphTimerInterval);
    let display = document.getElementById('lymph-timer-display');
    let text = document.getElementById('lymph-step-text');
    let steps = [
        { name: "1. Pump Clavicle (Collarbone)", time: 30 },
        { name: "2. Pump Axillary (Armpits)", time: 30 },
        { name: "3. Pump Inguinal (Hip Creases)", time: 30 },
        { name: "4. Legs up the Wall (Rest)", time: 600 }
    ];
    let currentStep = 0; let timeLeft = steps[0].time;
    
    text.innerText = steps[0].name;
    display.innerText = `00:${timeLeft}`;
    
    lymphTimerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60); let s = timeLeft % 60;
        display.innerText = `${m < 10 ? '0':''}${m}:${s < 10 ? '0':''}${s}`;
        
        if(timeLeft <= 0) {
            currentStep++;
            if(currentStep >= steps.length) {
                clearInterval(lymphTimerInterval);
                text.innerText = "Sequence Complete! ✨";
                display.innerText = "00:00";
            } else {
                timeLeft = steps[currentStep].time;
                text.innerText = steps[currentStep].name;
                // Play a cute chime noise if possible, otherwise just update text
            }
        }
    }, 1000);
}

// SMART COACH
function addToVault() {
    let titleEl = document.getElementById('vault-title'); if(!titleEl) return;
    let title = titleEl.value; let url = document.getElementById('vault-url') ? document.getElementById('vault-url').value : "";
    let duration = document.getElementById('vault-duration') ? document.getElementById('vault-duration').value : ""; let focus = document.getElementById('vault-focus') ? document.getElementById('vault-focus').value : "";
    if(!title || !duration) return;
    let vaults = JSON.parse(localStorage.getItem('vaults')) || [];
    vaults.push({ title, url, duration, focus }); localStorage.setItem('vaults', JSON.stringify(vaults));
    titleEl.value = ''; document.getElementById('vault-url').value = ''; document.getElementById('vault-duration').value = ''; renderVault();
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
    let sleepEl = document.getElementById('sleep-hours'); let waterEl = document.getElementById('water-oz');
    let sleep = sleepEl ? parseFloat(sleepEl.value) : 0; let water = waterEl ? parseFloat(waterEl.value) : 0;
    
    res.style.display = 'block';
    let nervePain = loggedBodyZones.some(log => log.type.includes("Nerve"));
    
    if (nervePain) { 
        res.innerHTML = "🚨 <strong>COACH VETO:</strong> Nerve tension detected. <em>Mandatory: Somatic Reset & Nerve Flossing only.</em>"; 
    } 
    else if (sleep < 6 || water < 30) {
        res.innerHTML = `⚠️ <strong>COACH WARNING:</strong> You only logged ${sleep}hrs sleep and ${water}oz water. Your fascia is dehydrated. Deep peak poses are highly dangerous. The Oracle also drew [${currentDrawnCard}]. It is highly recommended to shift focus to Lymphatic Drainage, but if you proceed with ${focus}, mandate a long warm-up.`;
    }
    else if (focus === "Somatic Reset" || focus === "Lymphatic Drainage") { 
        res.innerHTML = `✅ <strong>RECOVERY:</strong> Great choice. Use the Recovery tools above.`; 
    } 
    else { 
        res.innerHTML = `✅ <strong>CONDITION GREEN:</strong> System hydrated and primed for <strong>${focus}</strong>. Proceed.`; 
    }
}

// ==========================================
// 5x5 ACADEMY
// ==========================================
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

function checkSkillLocks() {
    let skills = Array.from(document.querySelectorAll('.skill-chk:checked')).map(cb => cb.id);
    if(skills.length > 0) localStorage.setItem('skillLocks', JSON.stringify(skills));
}

// ==========================================
// ORACLE & LOGS
// ==========================================
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

function compileJournal() {
    if(hasCompiledToday) { alert("You have already compiled today's Daily Map!"); return; }
    
    let dumpEl = document.getElementById('brain-dump'); let dump = dumpEl ? dumpEl.value : "";
    let routineAmChecked = Array.from(document.querySelectorAll('.routine-chk-am:checked')).map(cb => cb.value);
    let routinePmChecked = Array.from(document.querySelectorAll('.routine-chk-pm:checked')).map(cb => cb.value);
    let allRoutines = routineAmChecked.concat(routinePmChecked);
    
    let faceData = loggedFaceZones.map(l => `${l.zone} (${l.type})`).join(", ") || "None";
    let bodyData = loggedBodyZones.map(l => `${l.zone} (${l.type})`).join(", ") || "None";

    let j = {
        date: new Date().toLocaleString(),
        weather: `Dew: ${liveData.dew}°F | UV: ${liveData.uv} | AQI: ${liveData.aqi} | Press: ${liveData.pressure}`,
        routine: allRoutines.length > 0 ? allRoutines.join(", ") : "None Logged",
        face: faceData, body: bodyData,
        card: currentDrawnCard, thoughts: dump || "No notes today."
    };

    let journals = JSON.parse(localStorage.getItem('journals')) || []; journals.unshift(j); localStorage.setItem('journals', JSON.stringify(journals));
    localStorage.setItem('lastCompileDate', new Date().toLocaleDateString()); hasCompiledToday = true; 
    
    let warnEl = document.getElementById('journal-warning'); if(warnEl) { warnEl.style.display = 'block'; warnEl.innerText = "✅ Daily Map compiled for today."; }

    loggedFaceZones = []; localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones));
    loggedBodyZones = []; localStorage.setItem('stagedBody', JSON.stringify(loggedBodyZones));
    document.querySelectorAll('.routine-chk-am, .routine-chk-pm').forEach(cb => cb.checked = false); if(dumpEl) dumpEl.value = '';
    
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

function logHygiene(type) { 
    let d = new Date().toLocaleDateString(); 
    localStorage.setItem('pillowDate', d); 
    let pEl = document.getElementById('pillowcase-date'); if(pEl) pEl.innerText = d; 
}

function forceAuraGeneration() {
    let journals = JSON.parse(localStorage.getItem('journals')) || [];
    let name = "The Blank Slate Stamp"; let advice = "Not enough journal synthesis this week to form an Aura!";
    if (journals.length > 0) { name = "✨ The Synthesis Stamp ✨"; advice = "You successfully compiled journals this week. Keep tracking."; }
    localStorage.setItem('currentAura', JSON.stringify({ name, advice })); localStorage.setItem('lastAuraStampDate', new Date().getTime().toString()); 
    let nEl = document.getElementById('aura-name'); if(nEl) nEl.innerText = name; 
    let aEl = document.getElementById('aura-advice'); if(aEl) aEl.innerText = advice; 
}
