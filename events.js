// events.js - Updated to use centralized data and support popups
// Load events-data.js and event-popup.js BEFORE this file

// Current filter
let currentFilter = 'all';

// Load completed events from localStorage
function loadCompletedEvents() {
    const completed = localStorage.getItem('completedEvents');
    return completed ? JSON.parse(completed) : [];
}

// Save completed events to localStorage
function saveCompletedEvents(completedEvents) {
    localStorage.setItem('completedEvents', JSON.stringify(completedEvents));
}

// Check if event is completed
function isEventCompleted(eventId) {
    const completedEvents = loadCompletedEvents();
    return completedEvents.includes(eventId);
}

// Load user progress from localStorage
function loadUserProgress() {
    const saved = localStorage.getItem('userProgress');
    return saved ? JSON.parse(saved) : {
        eventsAttended: 0,
        volunteeredHours: 0,
        townHallSpeeches: 0,
        environmentalEvents: 0,
        youthEvents: 0,
        innovationSummits: 0,
        earlyRegistrations: 0,
        consecutiveMonths: 0,
        friendsInvited: 0,
        isFoundingMember: false,
        eventsCreated: 0,
        electionsVoted: 0,
        serviceProjects: 0,
        networkConnections: 0,
        sustainabilityInitiatives: 0
    };
}

// Save user progress to localStorage
function saveUserProgress(userProgress) {
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
}

// Mark event as completed and update badge progress
function markEventCompleted(eventId) {
    const event = window.eventsData.find(e => e.id === eventId);
    if (!event) {
        console.error('Event not found:', eventId);
        return;
    }
    
    if (isEventCompleted(eventId)) {
        return;
    }
    
    const completedEvents = loadCompletedEvents();
    completedEvents.push(eventId);
    saveCompletedEvents(completedEvents);
    
    const userProgress = loadUserProgress();
    
    if (event.badgeProgress) {
        for (const [progressKey, amount] of Object.entries(event.badgeProgress)) {
            if (amount > 0) {
                if (progressKey === 'isFoundingMember') {
                    userProgress[progressKey] = true;
                } else {
                    userProgress[progressKey] = (userProgress[progressKey] || 0) + amount;
                }
            }
        }
        saveUserProgress(userProgress);
}
    renderEvents(currentFilter);
}

// Mark event as uncompleted and subtract badge progress
function markEventUncompleted(eventId) {
    const event = window.eventsData.find(e => e.id === eventId);
    if (!event) {
        console.error('Event not found:', eventId);
        return;
    }
    
    if (!isEventCompleted(eventId)) {
        return;
    }
    
    const completedEvents = loadCompletedEvents();
    const updatedCompleted = completedEvents.filter(id => id !== eventId);
    saveCompletedEvents(updatedCompleted);
    
    const userProgress = loadUserProgress();
    
    if (event.badgeProgress) {
        for (const [progressKey, amount] of Object.entries(event.badgeProgress)) {
            if (amount > 0) {
                if (progressKey === 'isFoundingMember') {
                    userProgress[progressKey] = false;
                } else {
                    userProgress[progressKey] = Math.max(0, (userProgress[progressKey] || 0) - amount);
                }
            }
        }
        saveUserProgress(userProgress);
    }
    
    renderEvents(currentFilter);
}

// Render Events
function renderEvents(filter = 'all') {
    const eventsGrid = document.getElementById('events-grid');
    
    const filteredEvents = filter === 'all' 
        ? window.eventsData 
        : window.eventsData.filter(event => event.category === filter);
    
    eventsGrid.innerHTML = filteredEvents.map(event => {
        const isCompleted = isEventCompleted(event.id);
        
        return `
        <div class="event-card" data-category="${event.category}" style="cursor: pointer;" onclick="openEventPopup('${event.id}')">
            <div class="event-header ${event.category}">
                <div class="event-category">${event.category}</div>
                <div class="event-title">${event.title}</div>
                <div class="event-date">${event.date}</div>
            </div>
            <div class="event-body">
                <div class="event-time">
                    <span><strong><i class="fa-regular fa-calendar"></i> Time:</strong> ${event.time}</span>
                </div>
                <div class="event-location">
                    <span><strong><i class="fa-solid fa-location-arrow"></i> Location:</strong> ${event.location}</span>
                </div>
                <div class="event-description">${event.description}</div>
                <button 
                    class="complete-event-btn ${isCompleted ? 'completed' : ''}"
                    onclick="event.stopPropagation(); ${isCompleted ? `markEventUncompleted('${event.id}')` : `markEventCompleted('${event.id}')`}"
                    style="
                        margin-top: 1rem;
                        padding: 0.75rem 1.5rem;
                        background: ${isCompleted ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)'};
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-weight: 600;
                        cursor: pointer;
                        width: 100%;
                        transition: all 0.3s ease;
                        font-size: 0.95rem;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px ${isCompleted ? 'rgba(148, 163, 184, 0.4)' : 'rgba(16, 185, 129, 0.4)'}'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
                >
                    ${isCompleted ? '✓ Completed' : 'Mark as Completed'}
                </button>
                <button 
                    class="view-details-btn"
                    onclick="event.stopPropagation(); openEventPopup('${event.id}')"
                    style="
                        margin-top: 0.5rem;
                        padding: 0.75rem 1.5rem;
                        background: linear-gradient(135deg, #2563eb, #3b82f6);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-weight: 600;
                        cursor: pointer;
                        width: 100%;
                        transition: all 0.3s ease;
                        font-size: 0.95rem;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(37, 99, 235, 0.4)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
                >
                    View More Details
                </button>
            </div>
        </div>
    `}).join('');
}

// Filter Logic
const filterButtons = document.querySelectorAll('.filter-btn');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const category = button.getAttribute('data-category');
        currentFilter = category;
        renderEvents(category);
    });
});

// Handle newsletter form submission
function handleNewsletter(event) {
    event.preventDefault();
    const input = event.target.querySelector('.newsletter-input');
    const email = input.value;
    alert(`Thank you for subscribing! We'll send updates to ${email}`);
    input.value = '';
}

// Load events from Firestore and merge with local data
async function loadFirestoreEvents() {
    try {
        const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        const firebaseConfig = {
            apiKey: "AIzaSyArZYz6UMheUgBVrNeWvxWml-0zDTbNur0",
            authDomain: "nextstep-12b9a.firebaseapp.com",
            projectId: "nextstep-12b9a",
            storageBucket: "nextstep-12b9a.firebasestorage.app",
            messagingSenderId: "630600034259",
            appId: "1:630600034259:web:6b6284e147a6f79cda7126",
            measurementId: "G-WH3JL7Y7BR"
        };

        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const db = getFirestore(app);

        const snapshot = await getDocs(collection(db, 'events'));
        const firestoreEvents = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const alreadyExists = window.eventsData.some(e => e.id === doc.id);
            if (!alreadyExists) {
                firestoreEvents.push({ ...data, id: doc.id });
            }
        });

        if (firestoreEvents.length > 0) {
            window.eventsData = [...window.eventsData, ...firestoreEvents];
        }

        console.log(`Loaded ${firestoreEvents.length} events from Firestore`);
    } catch (err) {
        console.error('Error loading Firestore events:', err);
    }

    // Always render after attempting to load
    renderEvents(currentFilter);
}

// Make functions globally available
window.markEventCompleted = markEventCompleted;
window.markEventUncompleted = markEventUncompleted;

// Initial load — fetch Firestore events then render
loadFirestoreEvents();
