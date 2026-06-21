// Function to handle tab switching
function openTab(tabId) {
    // Hide all tab contents
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(button => {
        button.classList.remove('active');
    });

    // Show the clicked tab and set button to active
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Function to handle logging data
function logData(type) {
    const date = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let listId, input1Id, input2Id;

    if (type === 'skin') {
        listId = 'skin-log-list';
        input1Id = 'skin-feel';
        input2Id = 'skin-products';
    } else if (type === 'flex') {
        listId = 'flex-log-list';
        input1Id = 'flex-focus';
        input2Id = 'flex-notes';
    }

    const input1 = document.getElementById(input1Id);
    const input2 = document.getElementById(input2Id);

    if (input1.value === '' && input2.value === '') {
        alert("Please enter something to log!");
        return;
    }

    const ul = document.getElementById(listId);
    const li = document.createElement('li');
    li.innerHTML = `<strong>[${date}]</strong> ${input1.value} <br> <em>Notes/Products:</em> ${input2.value}`;
    
    // Add to the top of the list
    ul.prepend(li);

    // Clear inputs
    input1.value = '';
    input2.value = '';
}

// Function to handle the Digital Oracle
const oracleDeck = [
    { name: "The Static", meaning: "A day of high noise. Clear your mind, turn off notifications, and focus strictly on your physical body." },
    { name: "The Dew Drop", meaning: "Embrace moisture and flexibility. Drink water, focus on hydration in your routine, and flow gently into your stretches." },
    { name: "The Pressure Drop", meaning: "Atmospheric shifts are causing tension. Take it easy today; do not push past your normal limits. Rest is productive." },
    { name: "The Sun Flare", meaning: "High energy day. Perfect for pushing into new active flexibility goals. Protect your skin, but embrace the heat." },
    { name: "The Root System", meaning: "Focus on grounding. Look at the foundation of your routines rather than the final results. Check your basics." }
];

function drawCard() {
    const cardNameDisplay = document.getElementById('card-name');
    const cardMeaningDisplay = document.getElementById('card-meaning');

    // Pick a random card from the array
    const randomCard = oracleDeck[Math.floor(Math.random() * oracleDeck.length)];

    cardNameDisplay.innerText = `🎴 ${randomCard.name}`;
    cardMeaningDisplay.innerText = randomCard.meaning;
}
