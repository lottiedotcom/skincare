// Data Population Logic
function initializeDashboard() {
    // Timestamp
    document.getElementById('timestamp').innerText = new Date().toLocaleString();

    // 1. Barrier Health
    document.getElementById('dew-point').innerText = '45°F';
    document.getElementById('wind-speed').innerText = '15 mph';
    document.getElementById('barrier-status').innerText = 'Occlusive Day. Skip harsh exfoliants. Apply heavy ceramides.';

    // 2. Sebum & Pore Congestion
    document.getElementById('heat-index').innerText = 'High (85°F / 70% RH)';
    document.getElementById('aqi-level').innerText = '65 (Moderate)';
    document.getElementById('sebum-forecast').innerText = 'High Congestion Risk. Double cleanse recommended tonight.';

    // 3. Antioxidant Shield
    document.getElementById('uv-index').innerText = '8 (Very High)';
    document.getElementById('allergen-level').innerText = 'High Pollen';
    document.getElementById('antioxidant-action').innerText = 'Apply Vitamin C & SPF 50. Micellar water rinse upon indoor return.';

    // 4. Dynamic Skin Cycling
    document.getElementById('temp-drop').innerText = '20°F drop expected tonight';
    document.getElementById('routine-rec').innerText = 'Safety Shift: Bypass retinoids. Focus on lipid replenishment.';

    // 5. Active Flexibility
    document.getElementById('pressure').innerText = '29.7 inHg (Falling)';
    document.getElementById('flex-rating').innerText = 'High Resistance';
    document.getElementById('flex-focus').innerText = 'Extended heat warm-up required before active oversplits.';

    // 6. Lymphatic Fluid Index
    document.getElementById('pressure-shift').innerText = 'Rapid Drop Detected';
    document.getElementById('puffiness-prob').innerText = 'High. Execute facial lymphatic drainage sequence.';

    // 7. Somatic Reset
    document.getElementById('tension-marker').innerText = 'Cold/Gray Induced Slouching';
    document.getElementById('somatic-protocol').innerText = 'Pelvic floor & jaw down-regulation required (2 min).';

    // 8. Digital Oracle
    document.getElementById('lunar-phase').innerText = 'Waning Crescent';
    document.getElementById('oracle-alignment').innerText = 'Focus on introspection and hidden variables today.';

    // 9. Atmospheric Frequency Soundscapes
    document.getElementById('external-audio').innerText = 'Heavy Rain & Low Thunder';
    document.getElementById('generated-track').innerText = 'Low-frequency binaural beats blended with ambient rain cadence.';
}

// Execute immediately without delay
initializeDashboard();
