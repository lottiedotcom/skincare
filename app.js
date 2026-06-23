// ==========================================
// 1. GLOBAL STATE & INITIALIZATION
// ==========================================
let userProfile = { 
    lat: '32.864', lon: '-108.222', 
    routine: { "Monday":{am:[], pm:[]}, "Tuesday":{am:[], pm:[]}, "Wednesday":{am:[], pm:[]}, "Thursday":{am:[], pm:[]}, "Friday":{am:[], pm:[]}, "Saturday":{am:[], pm:[]}, "Sunday":{am:[], pm:[]} }, 
    skinType: 'combination', allergies: '', wakeTime: '', sleepTime: '',
    barrierState: 'Healthy', hormonePhase: 'Follicular', primaryFocus: 'Hydration',
    weight: 130, height: 65
};
let loggedFaceZones = []; 
let loggedBodyZones = []; 
let liveData = { dew: 0, uv: 0, aqi: 0, pressure: 0 };
let currentDrawnCard = "None Drawn Today";
let hasCompiledToday = false; 

// Cumulative Coach Metrics (for biphasic sleep & daily water)
let liveMetrics = JSON.parse(localStorage.getItem('liveMetrics')) || { sleep: 0, water: 0 };

// Timers & Intervals
let breathingTimer; let breathingPhaseTimeout;
let lymphTimerInterval; 
let vagusTimerInterval; 
let tapInterval;
let nerveTimerInterval;
let decompTimerInterval;

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todayName = daysOfWeek[new Date().getDay()];

// Exact Muscle List from Diagram
const bodyMuscles = [
    "Abdominals", "Abductors", "Biceps", "Brachioradialis", "Deltoid", "External oblique", 
    "Finger extensors", "Finger flexors", "Gastrocnemius", "Gluteus maximus", "Gluteus medius", 
    "Hamstrings", "Infraspinatus", "Latissimus dorsi", "Pectoralis major", "Quadriceps", 
    "Sartorius", "Serratus anterior", "Soleus", "Teres major", "Tibialis anterior", 
    "Trapezius", "Triceps"
];

window.onload = () => {
    try {
        loadData(); 
        fetchRealData(); 
        populateSelects();
        populateVanityDropdown();
        renderAcademy();
        renderTodayRoutine(); 
        renderSettingsRoutine(); 
        renderProducts(); 
        renderJournals(); 
        renderVault(); 
        renderFlexSessions();
        checkSkillLocks(); 
        
        check7AMResetEngine();
        renderConsistencyBanner(); 
        updateMetricsDisplay();
        
        let lastCompile = localStorage.getItem('lastCompileDate');
        if(lastCompile === new Date().toLocaleDateString("en-US", {timeZone: "America/Phoenix"})) {
            hasCompiledToday = true;
            let warning = document.getElementById('journal-warning');
            if(warning) { warning.style.display = 'block'; warning.innerText = "✅ Daily Map already compiled for today."; }
        }
    } catch(e) { console.error("Safe Load Error: ", e); }
};

// ==========================================
// 2. 7:00 AM MST AUTO-RESET ENGINE
// ==========================================
function check7AMResetEngine() {
    let now = new Date();
    let mstTimeString = now.toLocaleString("en-US", {timeZone: "America/Phoenix"});
    let mstTime = new Date(mstTimeString);
    
    let currentMstDateStr = mstTime.toLocaleDateString();
    let currentMstHour = mstTime.getHours();
    
    let lastResetStr = localStorage.getItem('lastAutoResetDate');
    
    if (currentMstHour >= 7 && lastResetStr !== currentMstDateStr) {
        compileJournal(true); 
        
        document.querySelectorAll('.routine-chk-am, .routine-chk-pm').forEach(cb => cb.checked = false);
        
        // Reset Cumulative Metrics
        liveMetrics = { sleep: 0, water: 0 };
        localStorage.setItem('liveMetrics', JSON.stringify(liveMetrics));
        updateMetricsDisplay();

        let dumpEl = document.getElementById('brain-dump'); if(dumpEl) dumpEl.value = '';
        
        loggedFaceZones = []; localStorage.setItem('stagedFace', JSON.stringify([]));
        loggedBodyZones = []; localStorage.setItem('stagedBody', JSON.stringify([]));
        
        let faceBox = document.getElementById('face-map-analysis-box'); if(faceBox) faceBox.style.display = 'none';
        let bodyBox = document.getElementById('body-map-analysis-box'); if(bodyBox) bodyBox.style.display = 'none';
        
        if (mstTime.getDay() === 1) { 
            let emptyHearts = { "Monday":{am:false,pm:false}, "Tuesday":{am:false,pm:false}, "Wednesday":{am:false,pm:false}, "Thursday":{am:false,pm:false}, "Friday":{am:false,pm:false}, "Saturday":{am:false,pm:false}, "Sunday":{am:false,pm:false} };
            localStorage.setItem('weeklyHearts', JSON.stringify(emptyHearts));
        }
        
        localStorage.setItem('lastAutoResetDate', currentMstDateStr);
        hasCompiledToday = false; 
        
        renderMapLogs('face'); renderMapLogs('body'); 
        console.log("7:00 AM MST Engine Fired: Log saved, slate wiped.");
    }
}

// ==========================================
// 3. TAB NAVIGATION & SETTINGS
// ==========================================
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    let targetSection = document.getElementById(tabId); if(targetSection) targetSection.classList.add('active');
    let navId = tabId === 'skill-tree-tab' ? 'flexibility' : tabId;
    let targetNav = document.querySelector(`.tab-btn[onclick="openTab('${navId}')"]`);
    if(targetNav) targetNav.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

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
    
    let weightEl = document.getElementById('user-weight'); if(weightEl && weightEl.value) userProfile.weight = parseFloat(weightEl.value);
    let heightEl = document.getElementById('user-height'); if(heightEl && heightEl.value) userProfile.height = parseFloat(heightEl.value);

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
        if(!userProfile.weight) userProfile.weight = 130;
        if(!userProfile.height) userProfile.height = 65;
        
        let latEl = document.getElementById('lat-input'); if(latEl) latEl.value = userProfile.lat || '';
        let lonEl = document.getElementById('lon-input'); if(lonEl) lonEl.value = userProfile.lon || '';
        let skinEl = document.getElementById('skin-type-select'); if(skinEl) skinEl.value = userProfile.skinType || 'combination';
        let allEl = document.getElementById('allergy-input'); if(allEl) allEl.value = userProfile.allergies || '';
        let barEl = document.getElementById('barrier-state'); if(barEl) barEl.value = userProfile.barrierState;
        let horEl = document.getElementById('hormone-phase'); if(horEl) horEl.value = userProfile.hormonePhase;
        let focEl = document.getElementById('primary-focus'); if(focEl) focEl.value = userProfile.primaryFocus;
        let wEl = document.getElementById('user-weight'); if(wEl) wEl.value = userProfile.weight;
        let hEl = document.getElementById('user-height'); if(hEl) hEl.value = userProfile.height;
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
// 4. WEATHER, SKIN ANALYST & TARGET POD
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
    let sa = document.getElementById('smart-skin-analysis'); 
    let dpBox = document.getElementById('dew-point-synergy');
    let fBox = document.getElementById('display-primary-focus');
    let tsBox = document.getElementById('target-tracking-status');
    
    let b = userProfile.barrierState; let h = userProfile.hormonePhase; let a = liveData.aqi || 0; let st = userProfile.skinType; let dew = liveData.dew;
    
    if(sa) {
        if (b === 'Compromised' && a > 20) { sa.innerText = `🚨 System Alert: PM2.5 pollution is high (${a}) and your barrier is Compromised. Skip exfoliants today; mandate heavy occlusives!`; } 
        else if (b === 'Healing' || b === 'OverExfoliated') { sa.innerText = `✨ Gentle Phase: Barrier is fragile. Stick to hydration, ceramide repair, and skip the harsh acids.`; } 
        else if (h === 'Luteal' || h === 'Menstrual') { sa.innerText = `🩸 Hormonal Shift: You are in your ${h} phase. Sebum is spiking. Preemptively use BHA/Salicylic acid to clear congestion today.`; } 
        else { sa.innerText = `🌸 Atmosphere and barrier are balanced! Proceed optimally with your ${userProfile.primaryFocus} routine.`; }
    }

    if(dpBox && dew !== 0) {
        dpBox.style.display = 'block';
        if ((st === 'oily' || st === 'combination') && dew > 65) { dpBox.innerText = `💧 High humidity detected (Dew: ${dew.toFixed(1)}°F). Skip heavy moisturizers today; your hydrating SPF will be enough.`; } 
        else if ((st === 'dry' || st === 'sensitive') && dew < 40) { dpBox.innerText = `🌵 Atmosphere is pulling moisture (Dew: ${dew.toFixed(1)}°F). TEWL risk is high. Seal your hydrating serums with a heavy occlusive layer today.`; } 
        else { dpBox.innerText = `🌡️ Dew point is balanced for your skin type. Normal hydration protocols apply.`; }
    }

    // Target Tracking Pod
    if(fBox && tsBox) {
        fBox.innerText = userProfile.primaryFocus;
        let dayRoutines = userProfile.routine[todayName] || {am:[], pm:[]};
        let prods = JSON.parse(localStorage.getItem('products')) || [];
        
        let fullRoutineText = "";
        dayRoutines.am.concat(dayRoutines.pm).forEach(step => {
            fullRoutineText += step.toLowerCase() + " ";
            prods.forEach(p => {
                if(step.includes(p.name) && p.ingredients) fullRoutineText += p.ingredients.toLowerCase() + " ";
            });
        });
        
        if(userProfile.primaryFocus === "Hyperpigmentation") {
            if(fullRoutineText.includes("vitamin c") || fullRoutineText.includes("arbutin") || fullRoutineText.includes("tranexamic") || fullRoutineText.includes("niacinamide") || fullRoutineText.includes("kojic") || fullRoutineText.includes("licorice")) { tsBox.innerText = `✅ Tyrosinase inhibitors detected in today's routine. Keep it up!`; } 
            else { tsBox.innerText = `⚠️ No Brightening actives (Vitamin C, Alpha Arbutin, Tranexamic Acid) detected in today's routine. Consider swapping a product in your vanity.`; }
        } else if (userProfile.primaryFocus === "Acne Control") {
            if(fullRoutineText.includes("bha") || fullRoutineText.includes("salicylic") || fullRoutineText.includes("benzoyl") || fullRoutineText.includes("retinol") || fullRoutineText.includes("adapalene") || fullRoutineText.includes("retinal")) { tsBox.innerText = `✅ Congestion-clearing actives detected.`; } 
            else { tsBox.innerText = `⚠️ No BHA or cell-turnover actives found in today's routine.`; }
        } else if (userProfile.primaryFocus === "Hydration") {
            if(fullRoutineText.includes("hyaluronic") || fullRoutineText.includes("ceramide") || fullRoutineText.includes("snail") || fullRoutineText.includes("glycerin")) { tsBox.innerText = `✅ Optimal humectants/lipids detected for hydration.`; } 
            else { tsBox.innerText = `⚠️ Consider adding a dedicated Hydrating serum or essence.`; }
        } else {
            tsBox.innerText = `✅ Routine active and tracking perfectly.`;
        }
    }
}

// ==========================================
// 5. CYTOTOXIC ROUTINE LAYERING ANALYZER
// ==========================================
function analyzeRoutineLayering() {
    let out = document.getElementById('routine-analysis-output'); if(!out) return;
    let dayRoutines = userProfile.routine[todayName] || {am:[], pm:[]};
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    
    function getFullRoutineText(routineArr) {
        let fullStr = "";
        routineArr.forEach(step => {
            fullStr += step.toLowerCase() + " ";
            prods.forEach(p => {
                if(step.includes(p.name) && p.ingredients) fullStr += p.ingredients.toLowerCase() + " ";
            });
        });
        return fullStr;
    }
    
    let pmStr = getFullRoutineText(dayRoutines.pm);
    let amStr = getFullRoutineText(dayRoutines.am);
    
    out.style.display = 'block';
    out.innerHTML = "<strong>🧪 Layering Analysis:</strong><br>";
    let warnings = 0;

    // CYTOTOXIC / SEVERE BARRIER DESTROYERS
    if(pmStr.includes("hydrogen peroxide") || amStr.includes("hydrogen peroxide")) {
        out.innerHTML += `<span style="color:#cc0000; font-weight:bold;">🚨 CYTOTOXIC ALERT: Hydrogen Peroxide detected in your vanity formulation! This destroys healthy skin cells and obliterates the barrier. Do NOT use this on your face!</span><br>`; warnings++;
    }
    
    if((pmStr.includes("retinol") || pmStr.includes("tretinoin") || pmStr.includes("adapalene") || pmStr.includes("retinal")) && (pmStr.includes("aha") || pmStr.includes("glycolic") || pmStr.includes("lactic") || pmStr.includes("bha") || pmStr.includes("salicylic"))) {
        out.innerHTML += `<span style="color:#cc0000;">🚨 Conflict: Retinoid + Strong Acid detected in the same PM routine. High risk of chemical burn/barrier damage. Alternate nights!</span><br>`; warnings++;
    }
    
    if(amStr.includes("retinol") || amStr.includes("tretinoin") || amStr.includes("adapalene") || amStr.includes("retinal")) {
        out.innerHTML += `<span style="color:#cc0000;">🚨 Conflict: Retinoids degrade rapidly in UV light. Move them to your PM routine!</span><br>`; warnings++;
    }
    
    if((amStr.includes("aha") || amStr.includes("bha") || amStr.includes("vitamin c") || amStr.includes("glycolic")) && !amStr.includes("spf") && !amStr.includes("sunscreen") && !amStr.includes("titanium") && !amStr.includes("zinc")) {
        out.innerHTML += `<span style="color:#cc0000;">🚨 Danger: Exfoliating/Brightening actives in AM without SPF. You will cause hyperpigmentation! Add SPF.</span><br>`; warnings++;
    }
    
    if(userProfile.barrierState === "Compromised" || userProfile.barrierState === "OverExfoliated") {
        if(pmStr.includes("aha") || amStr.includes("aha") || pmStr.includes("bha") || amStr.includes("bha") || pmStr.includes("retinol") || pmStr.includes("retinal")) {
            out.innerHTML += `<span style="color:#cc0000;">🚨 Barrier Warning: You have harsh actives mapped while your barrier is actively healing. Pause them until restored!</span><br>`; warnings++;
        }
    }
    
    if(warnings === 0) {
        out.innerHTML += `<span style="color:#006600;">✅ Excellent chemistry! No harmful overlapping or cytotoxic ingredients detected in today's formulation blocks.</span>`;
    }
}

// ==========================================
// 6. FACE MAP & BODY MAP DIAGNOSTICS
// ==========================================
function populateSelects() {
    let bSel = document.getElementById('body-zone-select'); 
    if(bSel) { 
        bSel.innerHTML = ''; 
        bodyMuscles.forEach(m => bSel.innerHTML += `<option value="${m}">${m}</option>`); 
    }
}

function logFaceZone() {
    let zoneEl = document.getElementById('face-zone-select'); let typeEl = document.getElementById('face-acne-type'); let sevEl = document.getElementById('face-severity'); let sensEl = document.getElementById('face-sensation');
    if(!zoneEl || !typeEl || !sevEl || !sensEl) return;
    
    let zone = zoneEl.value; let type = typeEl.value; let severity = parseInt(sevEl.value); let sensation = sensEl.value;
    let colorMap = {"Cystic":"#cc0000", "Whitehead":"#e6e6e6", "Blackhead":"#333333", "Pustule":"#ff9933", "Papule":"#ff66b2"};
    loggedFaceZones.push({ zone, type, severity, sensation, color:
