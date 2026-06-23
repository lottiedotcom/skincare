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
// 4. WEATHER, SKIN ANALYST & ADVANCED TARGET POD
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
    
    let amStatus = document.getElementById('focus-am-status');
    let pmStatus = document.getElementById('focus-pm-status');
    let starBox = document.getElementById('focus-star-player');
    let starName = document.getElementById('star-player-name');
    let matchBox = document.getElementById('focus-matchmaker');
    let matchName = document.getElementById('matchmaker-suggestion');
    
    let b = userProfile.barrierState; let h = userProfile.hormonePhase; let a = liveData.aqi || 0; let st = userProfile.skinType; let dew = liveData.dew;
    
    // Matrix Warnings
    if(sa) {
        if (b === 'Compromised' && a > 20) { sa.innerText = `🚨 System Alert: PM2.5 pollution is high (${a}) and your barrier is Compromised. Skip exfoliants today; mandate heavy occlusives!`; } 
        else if (b === 'Healing' || b === 'OverExfoliated') { sa.innerText = `✨ Gentle Phase: Barrier is fragile. Stick to hydration, ceramide repair, and skip the harsh acids.`; } 
        else if (h === 'Luteal' || h === 'Menstrual') { sa.innerText = `🩸 Hormonal Shift: You are in your ${h} phase. Sebum is spiking. Preemptively use BHA/Salicylic acid to clear congestion today.`; } 
        else { sa.innerText = `🌸 Atmosphere and barrier are balanced! Proceed optimally with your ${userProfile.primaryFocus} routine.`; }
    }

    // Dew Point Synergy
    if(dpBox && dew !== 0) {
        dpBox.style.display = 'block';
        if ((st === 'oily' || st === 'combination') && dew > 65) { dpBox.innerText = `💧 High humidity detected (Dew: ${dew.toFixed(1)}°F). Skip heavy moisturizers today; your hydrating SPF will be enough.`; } 
        else if ((st === 'dry' || st === 'sensitive') && dew < 40) { dpBox.innerText = `🌵 Atmosphere is pulling moisture (Dew: ${dew.toFixed(1)}°F). TEWL risk is high. Seal your hydrating serums with a heavy occlusive layer today.`; } 
        else { dpBox.innerText = `🌡️ Dew point is balanced for your skin type. Normal hydration protocols apply.`; }
    }

    // ADVANCED DAY/NIGHT FORMULATION CHEMIST
    if(!fBox) return;
    fBox.innerText = userProfile.primaryFocus;
    let dayRoutines = userProfile.routine[todayName] || {am:[], pm:[]};
    let allProds = JSON.parse(localStorage.getItem('products')) || [];
    
    let amProds = []; let pmProds = []; let unusedProds = [...allProds];
    let amText = ""; let pmText = "";

    dayRoutines.am.forEach(step => {
        amText += step.toLowerCase() + " ";
        let match = allProds.find(p => step.includes(p.name));
        if(match) { amProds.push(match); amText += (match.ingredients || "").toLowerCase() + " "; unusedProds = unusedProds.filter(up => up.name !== match.name); }
    });
    dayRoutines.pm.forEach(step => {
        pmText += step.toLowerCase() + " ";
        let match = allProds.find(p => step.includes(p.name));
        if(match) { pmProds.push(match); pmText += (match.ingredients || "").toLowerCase() + " "; unusedProds = unusedProds.filter(up => up.name !== match.name); }
    });

    const activeMaps = {
        "Hyperpigmentation": ["vitamin c", "arbutin", "tranexamic", "niacinamide", "kojic", "licorice", "azelaic"],
        "Acne Control": ["bha", "salicylic", "benzoyl", "retinol", "adapalene", "retinal", "sulfur", "tea tree"],
        "Hydration": ["hyaluronic", "ceramide", "snail", "glycerin", "squalane", "panthenol", "polyglutamic"],
        "Fine Lines": ["retinol", "retinal", "tretinoin", "peptide", "egf", "glycolic", "lactic", "bakuchiol"],
        "Anti-Aging": ["retinol", "retinal", "tretinoin", "peptide", "vitamin c", "bakuchiol"]
    };

    let targetActives = activeMaps[userProfile.primaryFocus] || activeMaps["Hydration"];
    let amHasActive = targetActives.some(a => amText.includes(a));
    let pmHasActive = targetActives.some(a => pmText.includes(a));
    
    let spfDetected = amText.includes("spf") || amText.includes("sunscreen") || amText.includes("zinc") || amText.includes("titanium");

    // Reset displays
    starBox.style.display = 'none'; matchBox.style.display = 'none';
    
    // Dynamic Split Logic
    if (userProfile.primaryFocus === "Fine Lines" || userProfile.primaryFocus === "Anti-Aging") {
        amStatus.innerText = amHasActive ? "☀️ AM Status: ✅ Day actives supporting cellular structure." : "☀️ AM Status: ➖ Focus on hydration & protection.";
        if (amHasActive && !spfDetected) amStatus.innerText = "☀️ AM Status: ⚠️ Actives detected without SPF! Accelerated aging risk.";
        pmStatus.innerText = pmHasActive ? "🌙 PM Status: ✅ Repair actives (Retinoids/Peptides) detected." : "🌙 PM Status: ⚠️ Missing heavy repair actives for cell turnover.";
    } 
    else if (userProfile.primaryFocus === "Hyperpigmentation") {
        amStatus.innerText = amHasActive ? "☀️ AM Status: ✅ Tyrosinase inhibitors active." : "☀️ AM Status: ⚠️ Missing Vitamin C / Brightening agents.";
        pmStatus.innerText = pmHasActive ? "🌙 PM Status: ✅ Pigment suppression active." : "🌙 PM Status: ➖ Focus on barrier repair tonight.";
    }
    else if (userProfile.primaryFocus === "Acne Control") {
        amStatus.innerText = amHasActive ? "☀️ AM Status: ✅ Congestion control active." : "☀️ AM Status: ➖ Missing daytime BHA/Treatment.";
        pmStatus.innerText = pmHasActive ? "🌙 PM Status: ✅ Cell turnover/BHA detected." : "🌙 PM Status: ⚠️ Missing primary acne treatment step.";
    }
    else { // Hydration
        amStatus.innerText = amHasActive ? "☀️ AM Status: ✅ Humectants optimizing hydration." : "☀️ AM Status: ⚠️ Lacking targeted hydrators.";
        pmStatus.innerText = pmHasActive ? "🌙 PM Status: ✅ Lipids/Ceramides restoring barrier." : "🌙 PM Status: ⚠️ Missing heavy hydration lock.";
    }

    // Star Player Determination
    let activeRoster = amProds.concat(pmProds);
    let starProduct = activeRoster.find(p => targetActives.some(a => (p.ingredients||"").toLowerCase().includes(a) || p.name.toLowerCase().includes(a)));
    if (starProduct) {
        starBox.style.display = 'block';
        starName.innerText = `${starProduct.name} (${starProduct.brand})`;
    }

    // Matchmaker / Suggestion Logic
    if (!amHasActive && !pmHasActive) {
        let suggestedSwap = unusedProds.find(p => targetActives.some(a => (p.ingredients||"").toLowerCase().includes(a) || p.name.toLowerCase().includes(a)));
        if (suggestedSwap) {
            matchBox.style.display = 'block';
            matchName.innerText = `Move [${suggestedSwap.name}] from Vanity into your routine to hit your goal!`;
        } else {
            matchBox.style.display = 'block';
            matchName.innerText = `You don't have any products in your Vanity targeting ${userProfile.primaryFocus}. Consider acquiring one!`;
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
    if(pmStr.includes("hydrogen peroxide") || amStr.includes("hydrogen peroxide") || pmStr.includes("denatured alcohol") || amStr.includes("denatured alcohol") || pmStr.includes("isopropyl alcohol") || amStr.includes("isopropyl alcohol")) {
        out.innerHTML += `<span style="color:#cc0000; font-weight:bold;">🚨 CYTOTOXIC ALERT: Severe stripping agents (Peroxide/Harsh Alcohol) detected in your formulation! This destroys healthy skin cells and obliterates the barrier. Do NOT use this on your face!</span><br>`; warnings++;
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
    loggedFaceZones.push({ zone, type, severity, sensation, color: colorMap[type] });
    localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones)); 
    renderMapLogs('face');
    
    let box = document.getElementById('face-map-analysis-box');
    if(box) {
        box.style.display = 'block';
        let diag = "🩺 <strong>Diagnostic:</strong> ";
        if (sensation === "Itchy" || sensation === "Tight") { diag += "Barrier compromise detected on " + zone + ". Sensation indicates dehydration or acid damage. Mandate ceramides. "; }
        if ((zone.includes("Jawline") || zone.includes("Chin")) && type === "Cystic" && userProfile.hormonePhase === 'Luteal') { diag += "Possible hormonal inflammation on the jawline/chin 🌸 Skip manual exfoliation there today, apply ice, and stick to your spot treatments! "; } 
        else if ((zone.includes("Jawline") || zone.includes("Chin")) && type === "Cystic") { diag += "Deep cystic inflammation detected. Ice and spot treat; avoid harsh scrubbing. "; }
        if (zone.includes("Nose") && type === "Blackhead") { diag += "Sebum oxidation on the T-Zone. Suggest integrating a BHA. "; }
        if (zone.includes("Forehead") && type === "Whitehead") { diag += "Forehead congestion often links to sweat or hair products. Ensure thorough double-cleansing. "; }
        if (severity >= 7) { diag += "<strong>High severity alert.</strong> Coach mandates scaling back all actives to focus strictly on soothing inflammation."; }
        if (liveData.aqi > 20) { diag += " *Note: High AQI detected. Double cleanse tonight to remove environmental free-radicals.*"; }
        if (diag === "🩺 <strong>Diagnostic:</strong> ") diag += "Standard spot treatment advised.";
        box.innerHTML = diag;
    }
}

function logBodyZone() {
    let zoneEl = document.getElementById('body-zone-select'); let typeEl = document.getElementById('body-tension-type'); let sevEl = document.getElementById('body-severity');
    if(!zoneEl || !typeEl || !sevEl) return;
    
    let zone = zoneEl.value; let type = typeEl.value; let severity = parseInt(sevEl.value);
    let colorMap = {"DOMS (Soreness)":"#99ccff", "Muscle (Dull/Pull)":"#3399ff", "Fascia (Tight/Stuck)":"#ff99cc", "Joint (Pinching/Blocked)":"#cc0000", "Nerve (Sharp/Tingly)":"#ffcc00"};
    
    loggedBodyZones.push({ zone, type, severity, color: colorMap[type] });
    localStorage.setItem('stagedBody', JSON.stringify(loggedBodyZones)); 
    renderMapLogs('body');

    let box = document.getElementById('body-map-analysis-box');
    if(box) {
        box.style.display = 'block';
        let diag = "🩺 <strong>Biomechanics Diagnostic:</strong><br>";
        
        if (type.includes("Nerve")) {
            diag += `🚨 <strong>Nerve tension in ${zone}.</strong> STOP any stretches pulling on this pathway. Do NOT stretch nerves. Proceed immediately with flossing protocols.<br>`;
        }
        if (type.includes("Joint")) {
            diag += `⚠️ <strong>Joint impingement in ${zone}.</strong> This is a structural block, not a muscle tightness. Back out of the pose and pad the joint. Do not force.<br>`;
        }
        if (type.includes("DOMS")) {
            diag += `💡 <strong>DOMS in ${zone}.</strong> Blood flow is needed. Prioritize active range of motion (AROM) and light dynamic movement before attempting deep holds.<br>`;
        }
        if (zone === "Trapezius" && (type.includes("Nerve") || type.includes("Pinching"))) {
            diag += `⚡ <strong>Upper Trap Warning.</strong> Sharp pain here often stems from cervical spine compression. Avoid deep neck rolls; focus on gentle chin tucks and scapular depression.<br>`;
        }
        if (severity >= 7) {
            diag += `🛑 <strong>Severity High (${severity}/10).</strong> The Smart Coach mandates capping your session at 60% intensity to prevent micro-tears in the fascia.`;
        }
        
        if (diag === "🩺 <strong>Biomechanics Diagnostic:</strong><br>") {
            diag += "Standard tension detected. Ensure thorough 15-minute thixotropic warm-up before entering end-ranges.";
        }
        box.innerHTML = diag;
    }
}

function renderMapLogs(mapType) {
    let list = document.getElementById(`${mapType}-log-list`); if(!list) return;
    list.innerHTML = '';
    let logs = mapType === 'face' ? loggedFaceZones : loggedBodyZones;
    logs.forEach((log, idx) => {
        let extra = mapType === 'face' ? ` <em>(Sev: ${log.severity}, ${log.sensation})</em>` : ` <em>(Sev: ${log.severity}/10)</em>`;
        list.innerHTML += `<li style="border-left: 5px solid ${log.color};"><strong>${log.zone}</strong>: ${log.type}${extra} <button class="prod-del" style="float:right;" onclick="removeMapLog('${mapType}', ${idx})">X</button></li>`;
    });
}

function removeMapLog(mapType, idx) {
    if(mapType === 'face') { loggedFaceZones.splice(idx, 1); localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones)); }
    else { loggedBodyZones.splice(idx, 1); localStorage.setItem('stagedBody', JSON.stringify(loggedBodyZones)); }
    renderMapLogs(mapType);
}

// ==========================================
// 7. DIGITAL VANITY, EDIT MODAL & ALLERGEN SCANNER
// ==========================================
function populateVanityDropdown() {
    let select = document.getElementById('routine-product-link'); if(!select) return;
    select.innerHTML = '<option value="">-- Custom Step / No Product --</option>';
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    prods.forEach(p => {
        select.innerHTML += `<option value="${p.name}">${p.name} (${p.type})</option>`;
    });
}

function addProduct() {
    let nameEl = document.getElementById('prod-name'); if(!nameEl) return;
    let name = nameEl.value; 
    let brand = document.getElementById('prod-brand') ? document.getElementById('prod-brand').value : "";
    let type = document.getElementById('prod-type') ? document.getElementById('prod-type').value : "Other"; 
    let paoEl = document.getElementById('prod-pao'); let pao = paoEl ? parseInt(paoEl.value) : 0;
    let openDate = document.getElementById('prod-open-date') ? document.getElementById('prod-open-date').value : "";
    let wish = document.getElementById('prod-wishlist') ? document.getElementById('prod-wishlist').checked : false; 
    let fav = document.getElementById('prod-fav') ? document.getElementById('prod-fav').checked : false;
    let ingredients = document.getElementById('prod-ingredients') ? document.getElementById('prod-ingredients').value : "";
    
    if(!name) return; let exp = "Sealed 🔒"; let addedTime = null;
    if(pao && !wish && openDate) { 
        let d = new Date(openDate); 
        addedTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); 
        d.setMonth(d.getMonth() + pao); 
        exp = `Exp: ${d.toLocaleDateString()}`; 
    }

    let allergenWarning = "";
    let ingText = ingredients.toLowerCase();
    if(ingText !== "" && userProfile.allergies !== "") {
        let algs = userProfile.allergies.toLowerCase().split(",").map(s => s.trim());
        algs.forEach(alg => {
            if(alg !== "" && ingText.includes(alg)) { allergenWarning = alg; }
        });
    }
    
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    prods.push({ name, brand, type, pao, wish, fav, exp, addedTime, ingredients, allergenWarning });
    localStorage.setItem('products', JSON.stringify(prods));
    
    document.querySelectorAll('#skincare input[type="text"], #skincare input[type="number"], #skincare input[type="date"], #skincare textarea').forEach(i => i.value = '');
    let wChk = document.getElementById('prod-wishlist'); if(wChk) wChk.checked = false;
    let fChk = document.getElementById('prod-fav'); if(fChk) fChk.checked = false;
    renderProducts();
    populateVanityDropdown();
}

function removeProduct(idx) {
    let prods = JSON.parse(localStorage.getItem('products')) || []; prods.splice(idx, 1); localStorage.setItem('products', JSON.stringify(prods)); 
    renderProducts(); populateVanityDropdown();
}

function openEditModal(idx) {
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    let p = prods[idx];
    document.getElementById('edit-prod-index').value = idx;
    document.getElementById('edit-prod-name').value = p.name;
    document.getElementById('edit-prod-brand').value = p.brand || '';
    document.getElementById('edit-prod-type').value = p.type || 'Serum';
    document.getElementById('edit-prod-ingredients').value = p.ingredients || '';
    document.getElementById('edit-prod-pao').value = p.pao || '';
    
    let openDateInput = document.getElementById('edit-prod-open-date');
    if(p.addedTime) {
        let d = new Date(p.addedTime);
        openDateInput.value = d.toISOString().split('T')[0];
    } else {
        openDateInput.value = '';
    }
    document.getElementById('edit-product-modal').style.display = 'flex';
}

function closeEditModal() { document.getElementById('edit-product-modal').style.display = 'none'; }

function saveProductEdits() {
    let idx = document.getElementById('edit-prod-index').value;
    let prods = JSON.parse(localStorage.getItem('products')) || [];
    let name = document.getElementById('edit-prod-name').value;
    if(!name) return;
    
    let p = prods[idx];
    p.name = name;
    p.brand = document.getElementById('edit-prod-brand').value;
    p.type = document.getElementById('edit-prod-type').value;
    p.ingredients = document.getElementById('edit-prod-ingredients').value;
    p.pao = document.getElementById('edit-prod-pao').value ? parseInt(document.getElementById('edit-prod-pao').value) : 0;
    
    let openDate = document.getElementById('edit-prod-open-date').value;
    if(openDate && p.pao) {
        let d = new Date(openDate);
        p.addedTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        d.setMonth(d.getMonth() + p.pao);
        p.exp = `Exp: ${d.toLocaleDateString()}`;
    } else {
        p.addedTime = null;
        p.exp = "Sealed 🔒";
    }
    
    p.allergenWarning = "";
    let ingText = p.ingredients.toLowerCase();
    if(ingText !== "" && userProfile.allergies !== "") {
        let algs = userProfile.allergies.toLowerCase().split(",").map(s => s.trim());
        algs.forEach(alg => { if(alg !== "" && ingText.includes(alg)) { p.allergenWarning = alg; } });
    }
    
    prods[idx] = p;
    localStorage.setItem('products', JSON.stringify(prods));
    closeEditModal();
    renderProducts();
    populateVanityDropdown();
}

function renderProducts() {
    let prods = JSON.parse(localStorage.getItem('products')) || []; 
    let grid = document.getElementById('product-database-grid'); if(!grid) return;
    grid.innerHTML = '';
    let now = new Date().getTime();
    
    prods.forEach((p, idx) => {
        let f = p.fav ? '❤️ ' : ''; let tagClass = `tag-${p.type.split('/')[0].toLowerCase()}`;
        let alertHTML = p.allergenWarning ? `<div style="background:#ffcccc; color:#cc0000; font-size:0.7rem; font-weight:bold; padding:2px; border-radius:5px; margin-top:5px;">⚠️ Contains ${p.allergenWarning}</div>` : '';

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
                <div style="font-size:0.75rem; color:#885566; margin-top:5px;">${p.brand}</div>
                ${alertHTML}
                <div style="font-size:0.75rem; margin-top:5px; font-weight:bold;">${p.exp}</div>
                ${paoBarHTML}
                <div class="prod-actions">
                    <button class="prod-edit" onclick="openEditModal(${idx})">Edit</button>
                    <button class="prod-del" onclick="removeProduct(${idx})">X</button>
                </div>
            </div>`;
    });
}

// ==========================================
// 8. LINKED ROUTINE BUILDER & WEEKLY HEART STAMPS
// ==========================================
let currentCheckType = ""; 

function addRoutineStep() {
    let dayEl = document.getElementById('routine-day-select'); 
    let timeEl = document.getElementById('routine-time-select'); 
    let prodEl = document.getElementById('routine-product-link');
    let noteEl = document.getElementById('new-routine-step-note');
    if(!dayEl || !timeEl) return;
    
    let day = dayEl.value; let time = timeEl.value; 
    let prod = prodEl ? prodEl.value : "";
    let note = noteEl ? noteEl.value : "";
    
    let step = prod ? (note ? `${prod} - ${note}` : prod) : note;
    if(!step) return;
    
    if(!userProfile.routine[day]) userProfile.routine[day] = {am:[], pm:[]};
    userProfile.routine[day][time].push(step);
    localStorage.setItem('userProfile', JSON.stringify(userProfile)); 
    if(noteEl) noteEl.value = '';
    if(prodEl) prodEl.value = '';
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
    let container = document.getElementById('top-hearts-container'); if(!container) return;
    container.innerHTML = '';
    let heartsData = JSON.parse(localStorage.getItem('weeklyHearts')) || { "Monday":{am:false,pm:false}, "Tuesday":{am:false,pm:false}, "Wednesday":{am:false,pm:false}, "Thursday":{am:false,pm:false}, "Friday":{am:false,pm:false}, "Saturday":{am:false,pm:false}, "Sunday":{am:false,pm:false} };
    
    const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    fullDays.forEach((day) => {
        let amSlot = heartsData[day].am ? `<div class="heart-slot" title="${day} AM"><img src="Heart.png" alt="AM"></div>` : `<div class="heart-slot" title="${day} AM"></div>`;
        let pmSlot = heartsData[day].pm ? `<div class="heart-slot" title="${day} PM"><img src="Heart.png" alt="PM"></div>` : `<div class="heart-slot" title="${day} PM"></div>`;
        container.innerHTML += amSlot + pmSlot;
    });
}

// ==========================================
// 9. RECOVERY & REGULATION TIMERS
// ==========================================
function toggleRecoveryPanel(panelId) {
    let panel = document.getElementById(panelId); if(!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    
    if (panelId === 'somatic-pacer' && panel.style.display === 'none') { clearTimeout(breathingPhaseTimeout); clearInterval(breathingTimer); }
    if (panelId === 'lymphatic-sequence' && panel.style.display === 'none') { clearInterval(lymphTimerInterval); }
    if (panelId === 'vagus-dive' && panel.style.display === 'none') { clearInterval(vagusTimerInterval); }
    if (panelId === 'bilateral-tapping' && panel.style.display === 'none') { clearInterval(tapInterval); }
    if (panelId === 'nerve-flossing' && panel.style.display === 'none') { clearInterval(nerveTimerInterval); }
    if (panelId === 'spinal-decompression' && panel.style.display === 'none') { clearInterval(decompTimerInterval); }
}

function toggleInfo(infoId) {
    let el = document.getElementById(infoId); if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function updateBreathingMode() {
    clearTimeout(breathingPhaseTimeout); clearInterval(breathingTimer);
    let text = document.getElementById('breath-text'); if(text) text.innerText = "Ready...";
    let circle = document.getElementById('breath-circle'); if(circle) circle.style.transform = "scale(1)";
}

function startBreathing() {
    clearTimeout(breathingPhaseTimeout); clearInterval(breathingTimer);
    let mode = document.getElementById('breathing-mode').value;
    let circle = document.getElementById('breath-circle'); let text = document.getElementById('breath-text');
    
    if(mode === 'box') { runBreathingCycle(circle, text, [ {t:"Inhale...", s:1.8, ms:4000}, {t:"Hold...", s:1.8, ms:4000}, {t:"Exhale...", s:1, ms:4000}, {t:"Hold...", s:1, ms:4000} ]); }
    else if(mode === 'sleep') { runBreathingCycle(circle, text, [ {t:"Inhale...", s:1.8, ms:4000}, {t:"Hold...", s:1.8, ms:7000}, {t:"Exhale...", s:1, ms:8000} ]); }
    else if(mode === 'resonance') { runBreathingCycle(circle, text, [ {t:"Inhale...", s:1.8, ms:5000}, {t:"Exhale...", s:1, ms:5000} ]); }
    else if(mode === 'sigh') { runBreathingCycle(circle, text, [ {t:"Inhale...", s:1.5, ms:1500}, {t:"Inhale Deeper...", s:1.8, ms:1000}, {t:"Long Exhale...", s:1, ms:6000} ]); }
}

function runBreathingCycle(circle, text, phases) {
    let step = 0;
    function nextPhase() {
        let p = phases[step]; text.innerText = p.t;
        circle.style.transition = `transform ${p.ms/1000}s linear`; circle.style.transform = `scale(${p.s})`;
        step = (step + 1) % phases.length; breathingPhaseTimeout = setTimeout(nextPhase, p.ms);
    }
    nextPhase();
}

function startLymphTimer() {
    clearInterval(lymphTimerInterval);
    let display = document.getElementById('lymph-timer-display'); let text = document.getElementById('lymph-step-text');
    let steps = [ { name: "1. Pump Clavicle (Collarbone)", time: 30 }, { name: "2. Pump Axillary (Armpits)", time: 30 }, { name: "3. Pump Inguinal (Hip Creases)", time: 30 }, { name: "4. Legs up the Wall (Rest)", time: 600 } ];
    let currentStep = 0; let timeLeft = steps[0].time;
    
    text.innerText = steps[0].name; display.innerText = `00:${timeLeft}`;
    
    lymphTimerInterval = setInterval(() => {
        timeLeft--; let m = Math.floor(timeLeft / 60); let s = timeLeft % 60;
        display.innerText = `${m < 10 ? '0':''}${m}:${s < 10 ? '0':''}${s}`;
        if(timeLeft <= 0) {
            currentStep++;
            if(currentStep >= steps.length) {
                clearInterval(lymphTimerInterval); text.innerText = "Sequence Complete! ✨"; display.innerText = "00:00";
            } else { timeLeft = steps[currentStep].time; text.innerText = steps[currentStep].name; }
        }
    }, 1000);
}

function startVagusTimer() {
    clearInterval(vagusTimerInterval); let display = document.getElementById('vagus-timer-display'); let timeLeft = 30;
    display.innerText = timeLeft;
    vagusTimerInterval = setInterval(() => {
        timeLeft--; display.innerText = timeLeft;
        if(timeLeft <= 0) { clearInterval(vagusTimerInterval); display.innerText = "Breathe!"; }
    }, 1000);
}

function toggleTapping() {
    let dot = document.getElementById('tap-dot'); let btn = document.getElementById('tap-btn'); if(!dot || !btn) return;
    if(tapInterval) {
        clearInterval(tapInterval); tapInterval = null; btn.innerText = "Start Metronome"; dot.style.left = "0";
    } else {
        btn.innerText = "Stop Metronome"; let isLeft = true;
        tapInterval = setInterval(() => { dot.style.left = isLeft ? "calc(100% - 26px)" : "0"; isLeft = !isLeft; }, 1000);
    }
}

function startNerveTimer() {
    clearInterval(nerveTimerInterval);
    let display = document.getElementById('nerve-timer-display'); let text = document.getElementById('nerve-step-text');
    let steps = [ { name: "Sciatic/Brachial - Left Side", time: 60 }, { name: "Sciatic/Brachial - Right Side", time: 60 } ];
    let currentStep = 0; let timeLeft = steps[0].time;
    
    text.innerText = steps[0].name; display.innerText = `01:00`;
    
    nerveTimerInterval = setInterval(() => {
        timeLeft--; let m = Math.floor(timeLeft / 60); let s = timeLeft % 60;
        display.innerText = `0${m}:${s < 10 ? '0':''}${s}`;
        if(timeLeft <= 0) {
            currentStep++;
            if(currentStep >= steps.length) {
                clearInterval(nerveTimerInterval); text.innerText = "Flossing Complete! ✨"; display.innerText = "00:00";
            } else { timeLeft = steps[currentStep].time; text.innerText = steps[currentStep].name; }
        }
    }, 1000);
}

function startDecompTimer() {
    clearInterval(decompTimerInterval);
    let display = document.getElementById('decomp-timer-display'); 
    let timeLeft = 180; 
    display.innerText = `03:00`;
    
    decompTimerInterval = setInterval(() => {
        timeLeft--; let m = Math.floor(timeLeft / 60); let s = timeLeft % 60;
        display.innerText = `0${m}:${s < 10 ? '0':''}${s}`;
        if(timeLeft <= 0) { clearInterval(decompTimerInterval); display.innerText = "Done! Slowly rise. ✨"; }
    }, 1000);
}

// ==========================================
// 10. SMART COACH, BIOMETRICS & GENERAL LOGS
// ==========================================
function updateMetricsDisplay() {
    let dSleep = document.getElementById('display-sleep'); if(dSleep) dSleep.innerText = liveMetrics.sleep;
    let dWater = document.getElementById('display-water'); if(dWater) dWater.innerText = liveMetrics.water;
}

function addSleep() {
    let input = document.getElementById('sleep-input');
    if(input && input.value) {
        liveMetrics.sleep += parseFloat(input.value);
        localStorage.setItem('liveMetrics', JSON.stringify(liveMetrics));
        updateMetricsDisplay();
        input.value = '';
    }
}

function addWater(amount) {
    liveMetrics.water += amount;
    localStorage.setItem('liveMetrics', JSON.stringify(liveMetrics));
    updateMetricsDisplay();
}

function clearCoachMetrics() {
    liveMetrics = { sleep: 0, water: 0 };
    localStorage.setItem('liveMetrics', JSON.stringify(liveMetrics));
    updateMetricsDisplay();
}

function smartSuggest() {
    let res = document.getElementById('vault-suggestion'); if(!res) return;
    
    let sleep = liveMetrics.sleep; 
    let water = liveMetrics.water;
    let weight = userProfile.weight || 130;
    let waterGoal = Math.floor(weight / 2); 
    
    res.style.display = 'block';
    let nervePain = loggedBodyZones.some(log => log.type.includes("Nerve"));
    
    if (nervePain) { 
        res.innerHTML = "🚨 <strong>COACH VETO:</strong> Nerve tension detected. <em>Mandatory: Somatic Reset & Nerve Flossing only. Do NOT attempt active end-ranges today.</em>"; 
    } else if (sleep < 6 || water < waterGoal) {
        res.innerHTML = `⚠️ <strong>COACH WARNING:</strong> You only have ${sleep}hrs sleep and ${water}oz water logged (Goal: ${waterGoal}oz based on body mass). Your fascia is likely dehydrated and brittle. Deep peak poses are highly dangerous right now. Shift focus to restorative decompression and lymphatic drainage.`;
    } else { 
        res.innerHTML = `✅ <strong>CONDITION GREEN:</strong> System hydrated (${water}oz) and rested (${sleep}hrs). Atmospheric pressure is ${liveData.pressure}. Listen to your body and proceed safely.`; 
    }
}

// General Flexibility Session Log
function logFlexSession() {
    let focusEl = document.getElementById('flex-session-focus');
    let durEl = document.getElementById('flex-session-duration');
    let notesEl = document.getElementById('flex-session-notes');
    
    if(!focusEl || !focusEl.value || !durEl || !durEl.value) return;
    
    let sessions = JSON.parse(localStorage.getItem('flexSessions')) || [];
    sessions.unshift({ 
        date: new Date().toLocaleDateString("en-US", {timeZone: "America/Phoenix"}), 
        focus: focusEl.value, 
        duration: durEl.value, 
        notes: notesEl ? notesEl.value : "" 
    });
    
    localStorage.setItem('flexSessions', JSON.stringify(sessions));
    focusEl.value = ''; durEl.value = ''; if(notesEl) notesEl.value = '';
    renderFlexSessions();
}

function removeFlexSession(idx) {
    let sessions = JSON.parse(localStorage.getItem('flexSessions')) || [];
    sessions.splice(idx, 1);
    localStorage.setItem('flexSessions', JSON.stringify(sessions));
    renderFlexSessions();
}

function renderFlexSessions() {
    let list = document.getElementById('flex-session-list'); if(!list) return;
    list.innerHTML = '';
    let sessions = JSON.parse(localStorage.getItem('flexSessions')) || [];
    sessions.forEach((s, idx) => {
        list.innerHTML += `<li><strong>${s.date} - ${s.focus}</strong> (${s.duration}m)<br><em style="font-size:0.8rem;">${s.notes}</em><button class="prod-del" style="float:right;" onclick="removeFlexSession(${idx})">X</button></li>`;
    });
}

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

// ==========================================
// 11. 5x5 CONTORTION ACADEMY (STREAK SYSTEM)
// ==========================================
const academyData = [
    {
        title: "Chest Stand",
        tiers: [
            { 
                level: 1, name: "Foundation & Spinal Hygiene", 
                drills: [
                    { name: "Cat-Cow x15", desc: "Move sequentially starting from the tailbone. Do not just dump your spine up and down. Focus on mobilizing each vertebra individually." }, 
                    { name: "Thoracic Rotations x10", desc: "Kneel, hand behind head, rotate elbow to sky. Keep hips entirely square. The twist must come strictly from the upper back, not the lumbar." }, 
                    { name: "Puppy Pose 1m", desc: "Keep your hips stacked directly over your knees. Walk your hands forward and melt your chest and armpits toward the floor to open the thoracic spine. Do not dump into the lower back." }, 
                    { name: "Neck Rolls x10", desc: "Slow, deliberate half-circles. Never drop the head completely back, which grinds the cervical vertebrae. Keep the front of the neck long." }, 
                    { name: "Scapular Shrugs x15", desc: "Straight arms in a plank or on knees. Let chest drop between shoulders, then push the floor away. Isolates the serratus anterior." }
                ]
            },
            { 
                level: 2, name: "Activation & Posterior Chain", 
                drills: [
                    { name: "Prone Cobra Lifts x10", desc: "Lie on stomach. Squeeze glutes. Lift chest off floor using ONLY back muscles. Hands hover above the floor. Hold for 3s at top." }, 
                    { name: "Y-T-W Raises x15", desc: "Lie prone. Lift arms in Y shape, then T shape, then W shape. Squeeze shoulder blades together. Builds necessary end-range strength." }, 
                    { name: "Posterior Pelvic Tilts x20", desc: "Lie on back. Flatten lower back completely into the floor by tilting your pelvis up and squeezing abs. Crucial for protecting lumbar in deep backbends." }, 
                    { name: "Glute Bridges x20", desc: "Squeeze glutes to lift hips. Do not over-arch the back at the top. The drive must come from the hamstrings and gluteus maximus." }, 
                    { name: "Sphinx Hold 2m", desc: "Elbows under shoulders. Actively drag elbows toward hips to pull chest through the shoulders. This is an active hold, not a passive rest." }
                ]
            },
            { 
                level: 3, name: "Isometric Endurance", 
                drills: [
                    { name: "Bow Pose Hold 30s", desc: "Kick shins back into hands to lift chest. Keep knees hip-width apart; do not let them splay wide. Breathe into the belly." }, 
                    { name: "Locust Hold 45s", desc: "Lift arms, chest, and legs. Squeeze inner thighs towards each other. Gaze slightly forward, keeping neck neutral." }, 
                    { name: "Bridge Push-ups x5", desc: "From a full bridge, bend elbows to lower head toward floor, then press back up. Builds tricep and shoulder strength in extreme flexion." }, 
                    { name: "Camel Pose 1m", desc: "Hips stay stacked over knees. Lift chest to sky before reaching back. If you feel pinching, tuck your toes or use blocks." }, 
                    { name: "Scapular Retraction Holds 30s", desc: "Hang from a pull-up bar, pull shoulders down and back, and hold. Critical for shoulder stability in inversions." }
                ]
            },
            { 
                level: 4, name: "Neural Gliding & Deep Prep", 
                drills: [
                    { name: "Sciatic Flossing x15/leg", desc: "Supine. Straighten leg = point toe. Bend knee = flex foot. Never stretch both ends of the nerve at once." }, 
                    { name: "Brachial Flossing x15/arm", desc: "Arm extended, palm up. Tilt head away = flex wrist up. Tilt head toward arm = point fingers down." }, 
                    { name: "Wall Pectoral Stretch 1m", desc: "Arm at 90 degrees against a wall or doorway. Gently turn chest away. Do not push into sharp shoulder pain." }, 
                    { name: "Camel Drops x5", desc: "Start kneeling. Keeping a straight line from knees to head, lean back as far as possible using quad strength, then return." }, 
                    { name: "Forearm Bridge Prep", desc: "From a regular bridge, carefully lower onto forearms. Requires immense shoulder mobility. Push chest over elbows." }
                ]
            },
            { 
                level: 5, name: "Sub-shape Mastery", 
                drills: [
                    { name: "Supported Chest Stand (Blocks)", desc: "Use yoga blocks under the shoulders to bear the weight. Keep chin tucked. Breathe." }, 
                    { name: "Chin Stand Prep", desc: "From plank, shift weight forward, bend elbows, lower chin to floor, and lift one leg. Requires strong triceps." }, 
                    { name: "Hollow Back Prep", desc: "From forearm stand against a wall, push chest through shoulders away from the wall while bringing feet down the wall." }, 
                    { name: "Scorpion Drills", desc: "Forearm stand. Bend knees toward head. Focus on lifting the chest, not just dropping the feet." }, 
                    { name: "Wall Chest Stand", desc: "Chest on floor, feet walk up the wall behind you. Press chest firmly into floor, do not crunch the neck." }
                ]
            }
        ]
    },
    {
        title: "Middle Splits",
        tiers: [
            { 
                level: 1, name: "Capsule Isolation", 
                drills: [
                    { name: "Frog Pose 2m", desc: "Knees wide, ankles in line with knees. Keep hips in line with knees, do not sit too far back or too far forward." }, 
                    { name: "Hip Circles x10", desc: "On all fours. Draw the largest possible circle with your knee. Isolates the hip capsule and produces synovial fluid." }, 
                    { name: "90/90 Switches x10", desc: "Sit on floor, knees bent 90 degrees. Rotate hips side to side without using hands for support." }, 
                    { name: "Kneeling Adductor Stretch", desc: "One knee down, other leg extended straight out to the side. Sink hips back slightly." }, 
                    { name: "Butterfly 2m", desc: "Soles of feet together. Use glutes to actively pull knees toward the floor. Do not passively bounce." }
                ]
            },
            { 
                level: 2, name: "Lengthening (PNF)", 
                drills: [
                    { name: "PNF Pancake 2m", desc: "Straddle sit. Fold forward. Press heels into the floor hard for 5s, then relax and fold deeper." }, 
                    { name: "Supine Wall Straddle 3m", desc: "Lie on back, hips against wall, legs open in a V. Let gravity do the work. Completely passive." }, 
                    { name: "Tailor Pose 1m", desc: "Like butterfly, but feet further away. Fold forward. Targets the outer glutes and deep rotators." }, 
                    { name: "Cossack Squats x10", desc: "Deep side lunge. Keep heel of bent leg on the floor if possible. Point toes of straight leg to the ceiling." }, 
                    { name: "Wide Leg Fold 2m", desc: "Stand, feet wide, fold forward. Shift weight slightly into the balls of your feet." }
                ]
            },
            { 
                level: 3, name: "Active Strength", 
                drills: [
                    { name: "Straddle Leg Lifts x10", desc: "Sit in straddle. Hands on floor between legs. Lean slightly forward and lift both legs off the floor using hip flexors." }, 
                    { name: "Side Lunges x15", desc: "Dynamic lunging side to side. Keep chest lifted. Builds dynamic strength in the adductors." }, 
                    { name: "Isometric Skaters 1m", desc: "Hold a deep side lunge position statically. Burns the quads and stabilizes the hip joint." }, 
                    { name: "Glute Medius Clamshells x20", desc: "Side lying, knees bent. Lift top knee keeping feet together. Essential for opening the hips in middle splits." }, 
                    { name: "Adductor Slides x10", desc: "In a straddle with socks on a slippery floor, slide legs out as far as possible, then actively pull them back together." }
                ]
            },
            { 
                level: 4, name: "Neural Gliding", 
                drills: [
                    { name: "Supine Sciatic Glides x15", desc: "Lie on back. Clasp behind thigh. Straighten leg/point toe, bend knee/flex foot. Gentle motion." }, 
                    { name: "Hamstring Flossing x15", desc: "Seated pike. Slouch spine/flex feet, straighten spine/point toes. Clears sciatic tension in folds." }, 
                    { name: "Flossing in Pike x15", desc: "Standing fold. Bend knees/look up, straighten legs/tuck chin. Only move in pain-free ranges." }, 
                    { name: "Active Point/Flex x20", desc: "Sit in straddle. Point toes hard, then pull toes back towards shins hard. Mobilizes the tibial nerve." }, 
                    { name: "Hip Flexor Glides x15", desc: "Low lunge. Shift hips forward and look up. Shift hips back and tuck chin." }
                ]
            },
            { 
                level: 5, name: "Peak Mastery", 
                drills: [
                    { name: "Oversplit Prep (Blocks)", desc: "Place front foot on a yoga block in your split. Ensure hips remain perfectly square to the front." }, 
                    { name: "PNF Middle Split 1m", desc: "In your lowest middle split, squeeze legs together attempting to pull the floor together for 5s, then relax and sink." }, 
                    { name: "Wall Middle Split", desc: "Lie on back, butt against wall, legs open in a V. Add light ankle weights for gentle over-pressure." }, 
                    { name: "Active Straddle Hold 30s", desc: "Support your bodyweight on your hands between your legs, lift feet off floor, and hold the straddle in the air." }, 
                    { name: "Peak Middle Split", desc: "The full expression. Ensure toes point forward or up. Never point toes backward/downward as it grinds the hip joint." }
                ]
            }
        ]
    }
];

let activeQuizTier = null;

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
            let currentStreak = savedProgress[`streak-${tierId}`] || 0;
            
            let lockedClass = isUnlocked ? '' : 'locked';
            let btnDisabled = isUnlocked && !isCompleted ? '' : 'disabled';
            
            let drillsHTML = tier.drills.map((d, dIdx) => `
                <div style="display:flex; flex-direction:column;">
                    <div style="font-size:0.9rem; font-weight:bold; color:#4b0082; display:flex; align-items:center;">
                        ${d.name} <button class="info-btn" onclick="toggleInfo('info-${tierId}-${dIdx}')">?</button>
                    </div>
                    <div id="info-${tierId}-${dIdx}" class="info-drop">${d.desc}</div>
                </div>
            `).join('<br>');

            let actionBtn = isCompleted ? 
                `<button class="action-btn" style="background:#66cc99;" disabled>✨ Mastered!</button>` :
                `<button class="action-btn" ${btnDisabled} onclick="openAcademyLog(${pIdx}, ${tIdx})">📝 Log Daily Practice (${currentStreak}/3)</button>`;

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

function openAcademyLog(pathIdx, tierIdx) {
    activeQuizTier = { pathIdx, tierIdx, tierId: `tier-${pathIdx}-${tierIdx}` };
    let tier = academyData[pathIdx].tiers[tierIdx];
    
    let titleEl = document.getElementById('academy-log-title');
    let descEl = document.getElementById('academy-log-desc');
    let qContainer = document.getElementById('academy-log-questions');
    
    titleEl.innerText = `Log Daily Practice: ${tier.name}`;
    let savedProgress = JSON.parse(localStorage.getItem('academyProgress')) || {};
    let currentStreak = savedProgress[`streak-${activeQuizTier.tierId}`] || 0;
    
    descEl.innerHTML = `<strong>Current Streak: ${currentStreak} / 3 Days</strong><br>Check off the drills you completed safely and successfully today. Consistency builds the nervous system.`;
    
    qContainer.innerHTML = '';
    tier.drills.forEach((d) => {
        qContainer.innerHTML += `
            <label class="check-tag" style="justify-content:flex-start; text-align:left; background:#fff; border: 1px solid #ff99cc;">
                <input type="checkbox" class="academy-daily-chk"> 
                Did you complete <strong>${d.name}</strong> safely and to depth?
            </label>
        `;
    });
    
    document.getElementById('academy-log-feedback').style.display = 'none';
    document.getElementById('academy-log-modal').style.display = 'flex';
}

function submitAcademyLog() {
    let checkboxes = document.querySelectorAll('.academy-daily-chk');
    let allChecked = Array.from(checkboxes).every(cb => cb.checked);
    let feedback = document.getElementById('academy-log-feedback');
    feedback.style.display = 'block';
    
    let savedProgress = JSON.parse(localStorage.getItem('academyProgress')) || {};
    
    let todayStr = new Date().toLocaleDateString("en-US", {timeZone: "America/Phoenix"});
    let lastLogDate = savedProgress[`lastLogDate-${activeQuizTier.tierId}`];
    
    if (lastLogDate === todayStr) {
        feedback.style.color = '#cc0066'; feedback.style.background = '#ffe6f2';
        feedback.innerText = "You already logged practice for this tier today! Rest and come back tomorrow.";
        return;
    }

    if(!allChecked) {
        feedback.style.color = '#cc0066'; feedback.style.background = '#ffe6f2';
        feedback.innerText = "You must successfully complete all drills to advance your streak. Keep practicing safely!";
        return;
    }
    
    let currentStreak = savedProgress[`streak-${activeQuizTier.tierId}`] || 0;
    currentStreak++;
    savedProgress[`streak-${activeQuizTier.tierId}`] = currentStreak;
    savedProgress[`lastLogDate-${activeQuizTier.tierId}`] = todayStr;
    
    if(currentStreak >= 3) { 
        savedProgress[activeQuizTier.tierId] = true; 
        feedback.style.color = '#66cc99'; feedback.style.background = '#e6ffe6';
        feedback.innerText = "✨ Amazing! You hit your 3-day streak and mastered this level. Next tier unlocked!";
    } else {
        feedback.style.color = '#0066cc'; feedback.style.background = '#e6f2ff';
        feedback.innerText = `✅ Practice stamped! Streak is now ${currentStreak}/3. Come back tomorrow!`;
    }
    
    localStorage.setItem('academyProgress', JSON.stringify(savedProgress));
    setTimeout(() => { closeAcademyModal(); renderAcademy(); }, 2500);
}

function closeAcademyModal() { document.getElementById('academy-log-modal').style.display = 'none'; activeQuizTier = null; }

function checkSkillLocks() {
    let skills = Array.from(document.querySelectorAll('.skill-chk:checked')).map(cb => cb.id);
    if(skills.length > 0) localStorage.setItem('skillLocks', JSON.stringify(skills));
}

// ==========================================
// 12. ORACLE DECK (Full 50 Cards) & LOG COMPILER
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

function compileJournal(isAutoReset = false) {
    if(!isAutoReset && hasCompiledToday) { alert("You have already compiled today's Daily Map!"); return; }
    
    let dumpEl = document.getElementById('brain-dump'); let dump = dumpEl ? dumpEl.value : "";
    let routineAmChecked = Array.from(document.querySelectorAll('.routine-chk-am:checked')).map(cb => cb.value);
    let routinePmChecked = Array.from(document.querySelectorAll('.routine-chk-pm:checked')).map(cb => cb.value);
    let allRoutines = routineAmChecked.concat(routinePmChecked);
    
    if (isAutoReset && allRoutines.length === 0 && loggedFaceZones.length === 0 && loggedBodyZones.length === 0 && dump === "") {
        return; 
    }
    
    let faceData = loggedFaceZones.map(l => `${l.zone} (${l.type}, Sev: ${l.severity})`).join(", ") || "None";
    let bodyData = loggedBodyZones.map(l => `${l.zone} (${l.type}, Sev: ${l.severity})`).join(", ") || "None";

    let j = {
        date: new Date().toLocaleString("en-US", {timeZone: "America/Phoenix"}),
        weather: `Dew: ${liveData.dew}°F | UV: ${liveData.uv} | AQI: ${liveData.aqi} | Press: ${liveData.pressure}`,
        routine: allRoutines.length > 0 ? allRoutines.join(", ") : "None Logged",
        face: faceData, body: bodyData,
        card: currentDrawnCard, thoughts: dump || "No notes today."
    };

    let journals = JSON.parse(localStorage.getItem('journals')) || []; journals.unshift(j); localStorage.setItem('journals', JSON.stringify(journals));
    
    if(!isAutoReset) {
        localStorage.setItem('lastCompileDate', new Date().toLocaleDateString("en-US", {timeZone: "America/Phoenix"})); 
        hasCompiledToday = true; 
        let warnEl = document.getElementById('journal-warning'); if(warnEl) { warnEl.style.display = 'block'; warnEl.innerText = "✅ Daily Map compiled for today."; }
        
        loggedFaceZones = []; localStorage.setItem('stagedFace', JSON.stringify(loggedFaceZones));
        loggedBodyZones = []; localStorage.setItem('stagedBody', JSON.stringify(loggedBodyZones));
        document.querySelectorAll('.routine-chk-am, .routine-chk-pm').forEach(cb => cb.checked = false); if(dumpEl) dumpEl.value = '';
        
        liveMetrics = { sleep: 0, water: 0 }; localStorage.setItem('liveMetrics', JSON.stringify(liveMetrics)); updateMetricsDisplay();
        
        let faceBox = document.getElementById('face-map-analysis-box'); if(faceBox) faceBox.style.display = 'none';
        let bodyBox = document.getElementById('body-map-analysis-box'); if(bodyBox) bodyBox.style.display = 'none';
        
        renderMapLogs('face'); renderMapLogs('body'); renderJournals();
    }
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
    let d = new Date().toLocaleDateString("en-US", {timeZone: "America/Phoenix"}); 
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
