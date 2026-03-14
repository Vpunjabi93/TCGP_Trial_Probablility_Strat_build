// app.js - Main Application Logic for TCGP Analyzer

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupNavigation();
    initFirebase();
    checkApiKey();
    
    // Bind global buttons
    document.getElementById('api-key-btn').addEventListener('click', showApiModal);
    document.getElementById('btn-save-key').addEventListener('click', saveApiKey);
    
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) authBtn.addEventListener('click', showAuthModal);
    
    const toggleAuthBtn = document.getElementById('btn-toggle-auth');
    if (toggleAuthBtn) toggleAuthBtn.addEventListener('click', toggleAuthMode);
    
    const authActionBtn = document.getElementById('btn-auth-action');
    if (authActionBtn) authActionBtn.addEventListener('click', handleAuthAction);
    
    const manualAddBtn = document.getElementById('btn-manual-add');
    if (manualAddBtn) manualAddBtn.addEventListener('click', processManualAdd);
    
    const saveFirebaseBtn = document.getElementById('btn-save-firebase');
    if (saveFirebaseBtn) saveFirebaseBtn.addEventListener('click', saveFirebaseConfig);

    // Initial renders
    renderCollectionGrid();
    renderDeckBuilderSidebar();
    renderDeckSlots();
}

// --- Firebase Integration (Hardcoded Default) ---
let db;
let auth;
let currentUser = null;

function initFirebase() {
    let configStr = localStorage.getItem('firebase_config');
    let firebaseConfig;

    if (!configStr) {
        // HARDCODED DEFAULT as requested by user
        firebaseConfig = {
            apiKey: "AIzaSyCnXljjyIYCWhsLhjLO62gDnIhNA29bHbM",
            authDomain: "pokemon-tcgp-24c09.firebaseapp.com",
            projectId: "pokemon-tcgp-24c09",
            storageBucket: "pokemon-tcgp-24c09.firebasestorage.app",
            messagingSenderId: "174569516136",
            appId: "1:174569516136:web:c30c356093b7be0de39fdd",
            measurementId: "G-H4SJJ2KELV"
        };
    } else {
        try {
            firebaseConfig = JSON.parse(configStr);
        } catch (e) {
            console.error("Firebase Config Parse Error:", e);
        }
    }

    if (!firebaseConfig) return;

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        auth = firebase.auth();

        auth.onAuthStateChanged(user => {
            currentUser = user;
            updateAuthUI(user);
            if (user) {
                loadCollectionFromCloud();
            }
        });
    } catch (e) {
        console.error("Firebase Init Error:", e);
    }
}

function updateAuthUI(user) {
    const authBtn = document.getElementById('auth-btn');
    const userEmail = document.getElementById('user-email');
    if (!authBtn || !userEmail) return;

    if (user) {
        authBtn.innerText = "Sign Out";
        userEmail.innerText = user.email;
        userEmail.classList.remove('hidden');
    } else {
        authBtn.innerText = "Sign In";
        userEmail.classList.add('hidden');
    }
}

function showAuthModal() {
    if (currentUser) {
        auth.signOut();
        return;
    }
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.remove('hidden');
}

function toggleAuthMode() {
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('btn-auth-action');
    const toggle = document.getElementById('btn-toggle-auth');
    if (btn.innerText === "Login") {
        title.innerText = "Create Account";
        btn.innerText = "Sign Up";
        toggle.innerText = "Already have an account? Login";
    } else {
        title.innerText = "Account Login";
        btn.innerText = "Login";
        toggle.innerText = "Need an account? Sign Up";
    }
}

async function handleAuthAction() {
    const emailInput = document.getElementById('input-email');
    const passInput = document.getElementById('input-password');
    if (!emailInput || !passInput) return;

    const email = emailInput.value;
    const pass = passInput.value;
    const btnText = document.getElementById('btn-auth-action').innerText;

    if (!auth) {
        alert("Firebase not initialized.");
        return;
    }

    try {
        if (btnText === "Login") {
            await auth.signInWithEmailAndPassword(email, pass);
        } else {
            await auth.createUserWithEmailAndPassword(email, pass);
        }
        document.getElementById('modal-auth').classList.add('hidden');
    } catch (e) {
        alert(e.message);
    }
}

function showFirebaseConfigModal() {
    const modal = document.getElementById('modal-firebase');
    if (!modal) return;
    modal.classList.remove('hidden');
    const existing = localStorage.getItem('firebase_config');
    if (existing) document.getElementById('input-firebase-config').value = existing;
}

function saveFirebaseConfig() {
    let config = document.getElementById('input-firebase-config').value.trim();
    config = config.replace(/^(const|let|var)\s+\w+\s*=\s*/, '');
    config = config.replace(/;$/, '');
    
    try {
        let jsonCompliant = config
            .replace(/([a-zA-Z0-9_]+):/g, '"$1":') 
            .replace(/'/g, '"'); 
            
        JSON.parse(jsonCompliant);
        localStorage.setItem('firebase_config', jsonCompliant);
        document.getElementById('modal-firebase').classList.add('hidden');
        location.reload(); 
    } catch (e) {
        alert("Config Error: " + e.message);
    }
}

// --- Cloud Sync ---
async function syncCollectionToCloud() {
    if (!currentUser || !db) return;
    const myCollection = JSON.parse(localStorage.getItem('tcgp_collection') || '{}');
    const myDecks = JSON.parse(localStorage.getItem('tcgp_decks') || '[]');
    
    await db.collection('users').doc(currentUser.uid).set({
        collection: myCollection,
        decks: myDecks,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

async function loadCollectionFromCloud() {
    if (!currentUser || !db) return;
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (doc.exists && doc.data().collection) {
        localStorage.setItem('tcgp_collection', JSON.stringify(doc.data().collection));
        if (doc.data().decks) {
            localStorage.setItem('tcgp_decks', JSON.stringify(doc.data().decks));
        }
        renderCollectionGrid();
        renderDeckBuilderSidebar();
    }
}

// --- Manual Entry ---
function expandNumberTokens(str) {
    const tokens = str.split(/[,\s]+/).filter(t => t.trim() !== "");
    const expanded = [];
    tokens.forEach(token => {
        const rangeMatch = token.match(/^(\d+)-(\d+)$/);
        if (rangeMatch) {
            const start = parseInt(rangeMatch[1], 10);
            const end = parseInt(rangeMatch[2], 10);
            for (let n = Math.min(start, end); n <= Math.max(start, end); n++) {
                expanded.push(String(n));
            }
        } else {
            expanded.push(token.trim());
        }
    });
    return expanded;
}

function processManualAdd() {
    const setSelect = document.getElementById('manual-set-select');
    const numbersInput = document.getElementById('manual-numbers');
    if (!setSelect || !numbersInput) return;

    const setCode = setSelect.value;
    const numbersStr = numbersInput.value;
    if (!numbersStr) return;

    const numbers = expandNumberTokens(numbersStr);
    let myCollection = JSON.parse(localStorage.getItem('tcgp_collection') || '{}');
    let addedCount = 0;

    numbers.forEach(num => {
        const paddedNum = num.padStart(3, '0');
        const cardId = `${setCode}-${paddedNum}`;
        const card = TCGP_CARDS.find(c => c.id === cardId);
        if (card) {
            myCollection[cardId] = (myCollection[cardId] || 0) + 1;
            addedCount++;
        }
    });

    if (addedCount > 0) {
        localStorage.setItem('tcgp_collection', JSON.stringify(myCollection));
        renderCollectionGrid();
        renderDeckBuilderSidebar();
        syncCollectionToCloud();
        alert(`Added ${addedCount} cards!`);
        numbersInput.value = "";
    } else {
        alert("No valid card numbers found for this set.");
    }
}

// --- Navigation ---
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.view-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            if(targetId === 'view-collection') renderCollectionGrid();
            if(targetId === 'view-deck-builder') renderDeckBuilderSidebar();
        });
    });

    const searchInput = document.getElementById('search-cards');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderCollectionGrid(e.target.value));
    }
}

// --- API Key Management ---
function checkApiKey() {
    const key = sessionStorage.getItem('gemini_api_key');
    const btn = document.getElementById('api-key-btn');
    if (!btn) return;

    if (!key) {
        btn.style.color = '#ff4444';
        btn.innerText = 'API Key Required';
    } else {
        btn.style.color = 'var(--text-muted)';
        btn.innerText = 'API Key Set ✓';
    }
}

function showApiModal() {
    document.getElementById('modal-api').classList.remove('hidden');
    const existing = sessionStorage.getItem('gemini_api_key');
    if(existing) document.getElementById('input-api-key').value = existing;
}

function saveApiKey() {
    const input = document.getElementById('input-api-key').value.trim();
    if (input && input.startsWith('AIza')) {
        sessionStorage.setItem('gemini_api_key', input);
        document.getElementById('modal-api').classList.add('hidden');
        checkApiKey();
    } else {
        alert("Invalid API key.");
    }
}

// --- Collection Manager ---
window.renderCollectionGrid = function(searchQuery = '') {
    const grid = document.getElementById('collection-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const allCards = TCGP_CARDS;
    let myCollection = JSON.parse(localStorage.getItem('tcgp_collection') || '{}');
    
    let uniqueCount = 0;
    let totalCopies = 0;

    let displayCards = allCards;
    if(searchQuery) {
        const q = searchQuery.toLowerCase();
        displayCards = allCards.filter(c => c.name.toLowerCase().includes(q) || c.type?.toLowerCase().includes(q));
    }

    displayCards.forEach(card => {
        const qty = myCollection[card.id] || 0;
        if (qty > 0) { uniqueCount++; totalCopies += qty; }

        const isOwned = qty > 0;
        const cardEl = document.createElement('div');
        cardEl.className = `tcgp-card ${isOwned ? 'owned' : ''}`;
        
        let colorVar = `var(--type-${card.type?.toLowerCase() || 'colorless'})`;
        if(card.type === 'Supporter' || card.type === 'Item') colorVar = '#8b949e';
        cardEl.style.borderTop = `4px solid ${colorVar}`;

        cardEl.innerHTML = `
            <div class="card-img-placeholder">
                <img src="${card.img}" class="card-real-img" alt="${card.name}" loading="lazy">
                ${isOwned ? `<div class="card-qty-badge">${qty}</div>` : ''}
            </div>
            <div class="card-info">
                <div class="card-name">${card.name}</div>
                <div class="card-meta">${card.id} • ${card.rarity}</div>
            </div>
        `;
        grid.appendChild(cardEl);
    });

    document.getElementById('stat-unique-cards').innerText = `${uniqueCount} Unique Cards`;
    document.getElementById('stat-total-copies').innerText = `${totalCopies} Total Copies`;
    const completion = ((uniqueCount / allCards.length) * 100).toFixed(1);
    document.getElementById('stat-completion').innerText = `${completion}% Complete`;
};

// --- Deck Builder ---
let currentDeck = [];

function renderDeckBuilderSidebar() {
    const list = document.getElementById('db-available-cards');
    if (!list) return;
    list.innerHTML = '';

    let myCollection = JSON.parse(localStorage.getItem('tcgp_collection') || '{}');
    const ownedIds = Object.keys(myCollection).filter(id => myCollection[id] > 0);

    if (ownedIds.length === 0) {
        list.innerHTML = '<p class="empty-state">No cards in collection.</p>';
        return;
    }

    ownedIds.forEach(id => {
        const card = TCGP_CARDS.find(c => c.id === id);
        if (!card) return;

        const countInDeck = currentDeck.filter(c => c.id === id).length;
        const available = myCollection[id] - countInDeck;

        if (available > 0) {
            const el = document.createElement('div');
            el.className = 'db-sidebar-card';
            el.innerHTML = `
                <img src="${card.img}" class="db-sidebar-img">
                <div class="db-sidebar-info">
                    <div class="db-sidebar-name">${card.name}</div>
                    <div class="db-sidebar-qty">${available} left</div>
                </div>
                <button class="btn-add-to-deck" onclick="addToDeck('${id}')">+</button>
            `;
            list.appendChild(el);
        }
    });
}

function renderDeckSlots() {
    const grid = document.getElementById('deck-slots');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < 20; i++) {
        const slot = document.createElement('div');
        slot.className = 'deck-slot';
        const card = currentDeck[i];

        if (card) {
            slot.classList.add('filled');
            slot.style.backgroundImage = `url(${card.img})`;
            slot.innerHTML = `<button class="remove-card" onclick="removeFromDeck(${i})">×</button>`;
        } else {
            slot.innerHTML = `<div class="slot-number">${i + 1}</div>`;
        }
        grid.appendChild(slot);
    }

    document.getElementById('deck-current-count').innerText = currentDeck.length;
    document.getElementById('btn-save-deck').disabled = currentDeck.length !== 20;
}

window.addToDeck = function(id) {
    if (currentDeck.length >= 20) return;
    const card = TCGP_CARDS.find(c => c.id === id);
    if (card) {
        currentDeck.push(card);
        renderDeckSlots();
        renderDeckBuilderSidebar();
    }
};

window.removeFromDeck = function(index) {
    currentDeck.splice(index, 1);
    renderDeckSlots();
    renderDeckBuilderSidebar();
};

window.showFirebaseConfigModal = showFirebaseConfigModal;
