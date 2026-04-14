// admin.js - Admin functionality for NextStep
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let isAdmin = false;

// Check admin status on auth change
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    isAdmin = adminDoc.exists() && adminDoc.data().isAdmin === true;
  } else {
    isAdmin = false;
  }
  renderAdminUI();
});

// Render the admin bar and inject modal HTML once
function renderAdminUI() {
  const existing = document.getElementById('admin-bar');
  if (existing) existing.remove();

  if (!isAdmin) return;

  const bar = document.createElement('div');
  bar.id = 'admin-bar';
  bar.innerHTML = `
    <style>
      #admin-bar {
        position: fixed;
        bottom: 120px;
        right: 24px;
        z-index: 5000;
      }
      #admin-add-btn {
        background: linear-gradient(135deg, #2563eb, #3b82f6);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 14px 24px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 6px 24px rgba(37,99,235,0.4);
        font-family: 'Open Sans', sans-serif;
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #admin-add-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(37,99,235,0.5);
      }
      .admin-event-actions {
        display: flex;
        gap: 6px;
        margin-top: 8px;
      }
      .admin-edit-btn, .admin-delete-btn {
        padding: 6px 14px;
        border-radius: 8px;
        border: none;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        font-family: 'Open Sans', sans-serif;
        transition: all 0.2s;
      }
      .admin-edit-btn {
        background: #fef3c7;
        color: #92400e;
      }
      .admin-edit-btn:hover { background: #fde68a; }
      .admin-delete-btn {
        background: #fee2e2;
        color: #991b1b;
      }
      .admin-delete-btn:hover { background: #fecaca; }

      #admin-modal-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        z-index: 9000;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      #admin-modal-overlay.open { display: flex; }
      #admin-modal {
        background: white;
        border-radius: 20px;
        padding: 2rem;
        width: min(560px, 100%);
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
        animation: modalPop 0.3s ease;
      }
      @keyframes modalPop {
        from { opacity:0; transform: scale(0.95) translateY(10px); }
        to   { opacity:1; transform: scale(1) translateY(0); }
      }
      #admin-modal h2 {
        font-size: 1.5rem;
        font-weight: 800;
        color: rgb(1,9,67);
        margin: 0 0 1.5rem;
      }
      .admin-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 12px;
      }
      .admin-form-grid .full-width { grid-column: 1 / -1; }
      .admin-form-group { display: flex; flex-direction: column; gap: 4px; }
      .admin-form-group label {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #64748b;
      }
      .admin-form-group input,
      .admin-form-group select,
      .admin-form-group textarea {
        padding: 9px 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        font-family: 'Open Sans', sans-serif;
        color: rgb(1,9,67);
        transition: border-color 0.2s;
        outline: none;
        width: 100%;
        box-sizing: border-box;
      }
      .admin-form-group input:focus,
      .admin-form-group select:focus,
      .admin-form-group textarea:focus { border-color: #2563eb; }
      .admin-form-group textarea { resize: vertical; min-height: 80px; }
      .admin-modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 1.5rem;
        padding-top: 1.25rem;
        border-top: 1px solid #e2e8f0;
      }
      .admin-btn-cancel {
        padding: 10px 22px;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        background: white;
        font-family: 'Open Sans', sans-serif;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        color: #64748b;
        transition: all 0.2s;
      }
      .admin-btn-cancel:hover { background: #f1f5f9; }
      .admin-btn-save {
        padding: 10px 28px;
        background: linear-gradient(135deg, #2563eb, #3b82f6);
        border: none;
        border-radius: 10px;
        color: white;
        font-family: 'Open Sans', sans-serif;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      }
      .admin-btn-save:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(37,99,235,0.35); }

      #admin-delete-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        z-index: 9500;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      #admin-delete-overlay.open { display: flex; }
      #admin-delete-modal {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        width: min(400px, 100%);
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      }
      #admin-delete-modal .del-icon { font-size: 48px; margin-bottom: 12px; }
      #admin-delete-modal h3 { font-size: 1.3rem; font-weight: 800; color: #991b1b; margin: 0 0 8px; }
      #admin-delete-modal p { color: #64748b; margin: 0 0 1.5rem; }
      .del-actions { display: flex; gap: 10px; justify-content: center; }
      .del-btn-cancel {
        padding: 10px 22px; border: 2px solid #e2e8f0; border-radius: 10px;
        background: white; font-family: 'Open Sans', sans-serif; font-size: 14px;
        font-weight: 600; cursor: pointer; color: #64748b;
      }
      .del-btn-confirm {
        padding: 10px 22px; background: linear-gradient(135deg, #ef4444, #dc2626);
        border: none; border-radius: 10px; color: white;
        font-family: 'Open Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer;
      }
    </style>

    <button id="admin-add-btn" onclick="window.openAdminModal()">
      ＋ Add Event
    </button>

    <!-- Event create/edit modal -->
    <div id="admin-modal-overlay">
      <div id="admin-modal">
        <h2 id="admin-modal-title">Add Event</h2>
        <div class="admin-form-grid">
          <div class="admin-form-group full-width">
            <label>Title</label>
            <input id="af-title" type="text" placeholder="Event title">
          </div>
          <div class="admin-form-group">
            <label>Date</label>
            <input id="af-date" type="text" placeholder="March 2, 2026">
          </div>
          <div class="admin-form-group">
            <label>Time</label>
            <input id="af-time" type="text" placeholder="7:00 PM">
          </div>
          <div class="admin-form-group">
            <label>Category</label>
            <select id="af-category">
              <option value="political">Political</option>
              <option value="youth">Youth</option>
              <option value="innovation">Innovation</option>
              <option value="environmental">Environmental</option>
              <option value="education">Education</option>
            </select>
          </div>
          <div class="admin-form-group">
            <label>Location Name</label>
            <input id="af-location" type="text" placeholder="Mizner Park Amphitheater">
          </div>
          <div class="admin-form-group full-width">
            <label>Address</label>
            <input id="af-address" type="text" placeholder="590 Plaza Real, Boca Raton, FL 33432">
          </div>
          <div class="admin-form-group">
            <label>Latitude</label>
            <input id="af-lat" type="number" step="any" placeholder="26.354">
          </div>
          <div class="admin-form-group">
            <label>Longitude</label>
            <input id="af-lng" type="number" step="any" placeholder="-80.084">
          </div>
          <div class="admin-form-group full-width">
            <label>Short Description</label>
            <input id="af-description" type="text" placeholder="One sentence summary">
          </div>
          <div class="admin-form-group full-width">
            <label>Full Description</label>
            <textarea id="af-fullDescription" placeholder="Full event details..."></textarea>
          </div>
          <div class="admin-form-group">
            <label>Organizer</label>
            <input id="af-organizer" type="text" placeholder="Organization name">
          </div>
          <div class="admin-form-group">
            <label>Contact Email</label>
            <input id="af-contact" type="email" placeholder="contact@org.com">
          </div>
          <div class="admin-form-group">
            <label>Phone</label>
            <input id="af-phone" type="text" placeholder="(561) 555-0000">
          </div>
          <div class="admin-form-group">
            <label>Capacity</label>
            <input id="af-capacity" type="number" placeholder="100">
          </div>
          <div class="admin-form-group full-width">
            <label>Requirements</label>
            <input id="af-requirements" type="text" placeholder="Open to all residents">
          </div>
          <div class="admin-form-group full-width">
            <label>Accessibility</label>
            <input id="af-accessibility" type="text" placeholder="Wheelchair accessible">
          </div>
          <div class="admin-form-group full-width">
            <label>Parking</label>
            <input id="af-parking" type="text" placeholder="Free parking available">
          </div>
        </div>
        <div class="admin-modal-actions">
          <button class="admin-btn-cancel" onclick="window.closeAdminModal()">Cancel</button>
          <button class="admin-btn-save" onclick="window.saveAdminEvent()">Save Event</button>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div id="admin-delete-overlay">
      <div id="admin-delete-modal">
        <div class="del-icon">🗑️</div>
        <h3>Delete Event?</h3>
        <p>This will permanently remove the event. This cannot be undone.</p>
        <div class="del-actions">
          <button class="del-btn-cancel" onclick="window.closeDeleteConfirm()">Cancel</button>
          <button class="del-btn-confirm" onclick="window.confirmDeleteEvent()">Delete</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(bar);
  addAdminButtonsToCards();
}

function addAdminButtonsToCards() {
  if (!isAdmin) return;
  document.querySelectorAll('.event-card').forEach(card => {
    if (card.querySelector('.admin-event-actions')) return;
    const eventId = getEventIdFromCard(card);
    if (!eventId) return;
    const actions = document.createElement('div');
    actions.className = 'admin-event-actions';
    actions.innerHTML = `
      <button class="admin-edit-btn" onclick="event.stopPropagation(); window.openAdminModal('${eventId}')">✏️ Edit</button>
      <button class="admin-delete-btn" onclick="event.stopPropagation(); window.openDeleteConfirm('${eventId}')">🗑️ Delete</button>
    `;
    const body = card.querySelector('.event-body');
    if (body) body.appendChild(actions);
  });
}

function getEventIdFromCard(card) {
  const onclick = card.getAttribute('onclick') || '';
  const match = onclick.match(/openEventPopup\('([^']+)'\)/);
  return match ? match[1] : null;
}

let editingId = null;
let deletingId = null;

window.openAdminModal = function(eventId = null) {
  editingId = eventId;
  document.getElementById('admin-modal-title').textContent = eventId ? 'Edit Event' : 'Add Event';

  ['title','date','time','location','address','description','fullDescription',
   'organizer','contact','phone','requirements','accessibility','parking'].forEach(f => {
    document.getElementById('af-' + f).value = '';
  });
  document.getElementById('af-lat').value = '';
  document.getElementById('af-lng').value = '';
  document.getElementById('af-capacity').value = '';
  document.getElementById('af-category').value = 'political';

  if (eventId && window.eventsData) {
    const ev = window.eventsData.find(e => e.id === eventId);
    if (ev) {
      document.getElementById('af-title').value = ev.title || '';
      document.getElementById('af-date').value = ev.date || '';
      document.getElementById('af-time').value = ev.time || '';
      document.getElementById('af-category').value = ev.category || 'political';
      document.getElementById('af-location').value = ev.location || '';
      document.getElementById('af-address').value = ev.address || '';
      document.getElementById('af-lat').value = ev.lat || '';
      document.getElementById('af-lng').value = ev.lng || '';
      document.getElementById('af-description').value = ev.description || '';
      document.getElementById('af-fullDescription').value = ev.fullDescription || '';
      document.getElementById('af-organizer').value = ev.organizer || '';
      document.getElementById('af-contact').value = ev.contact || '';
      document.getElementById('af-phone').value = ev.phone || '';
      document.getElementById('af-capacity').value = ev.capacity || '';
      document.getElementById('af-requirements').value = ev.requirements || '';
      document.getElementById('af-accessibility').value = ev.accessibility || '';
      document.getElementById('af-parking').value = ev.parking || '';
    }
  }

  document.getElementById('admin-modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeAdminModal = function() {
  document.getElementById('admin-modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  editingId = null;
};

window.saveAdminEvent = async function() {
  if (!isAdmin) return;

  const eventData = {
    title: document.getElementById('af-title').value.trim(),
    date: document.getElementById('af-date').value.trim(),
    time: document.getElementById('af-time').value.trim(),
    category: document.getElementById('af-category').value,
    location: document.getElementById('af-location').value.trim(),
    address: document.getElementById('af-address').value.trim(),
    lat: parseFloat(document.getElementById('af-lat').value) || 0,
    lng: parseFloat(document.getElementById('af-lng').value) || 0,
    description: document.getElementById('af-description').value.trim(),
    fullDescription: document.getElementById('af-fullDescription').value.trim(),
    organizer: document.getElementById('af-organizer').value.trim(),
    contact: document.getElementById('af-contact').value.trim(),
    phone: document.getElementById('af-phone').value.trim(),
    capacity: parseInt(document.getElementById('af-capacity').value) || 100,
    requirements: document.getElementById('af-requirements').value.trim(),
    accessibility: document.getElementById('af-accessibility').value.trim(),
    parking: document.getElementById('af-parking').value.trim(),
    registered: 0,
    tags: [],
    badgeProgress: { eventsAttended: 1 },
    updatedAt: serverTimestamp()
  };

  if (!eventData.title) { alert('Title is required'); return; }

  try {
    if (editingId) {
      await updateDoc(doc(db, 'events', editingId), eventData);
      if (window.eventsData) {
        const idx = window.eventsData.findIndex(e => e.id === editingId);
        if (idx !== -1) window.eventsData[idx] = { ...window.eventsData[idx], ...eventData };
      }
    } else {
      eventData.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(db, 'events'), eventData);
      eventData.id = docRef.id;
      if (window.eventsData) window.eventsData.push(eventData);
    }

    window.closeAdminModal();
    if (typeof renderEvents === 'function') renderEvents(window.currentFilter || 'all');
    alert(editingId ? '✅ Event updated!' : '✅ Event added!');
  } catch (err) {
    console.error('Error saving event:', err);
    alert('Error saving event: ' + err.message);
  }
};

window.openDeleteConfirm = function(eventId) {
  deletingId = eventId;
  document.getElementById('admin-delete-overlay').classList.add('open');
};

window.closeDeleteConfirm = function() {
  document.getElementById('admin-delete-overlay').classList.remove('open');
  deletingId = null;
};

window.confirmDeleteEvent = async function() {
  if (!isAdmin || !deletingId) return;
  try {
    await deleteDoc(doc(db, 'events', deletingId));
    if (window.eventsData) {
      window.eventsData = window.eventsData.filter(e => e.id !== deletingId);
    }
    window.closeDeleteConfirm();
    if (typeof renderEvents === 'function') renderEvents(window.currentFilter || 'all');
    alert('🗑️ Event deleted.');
  } catch (err) {
    console.error('Error deleting event:', err);
    alert('Error: ' + err.message);
  }
};
