// app.js - Core UI State and Routing

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupNavigation();
    checkApiKey();
    
    // Bind global buttons
    document.getElementById('api-key-btn').addEventListener('click', showApiModal);
    document.getElementById('btn-save-key').addEventListener('click', saveApiKey);
}

// --- Navigation (SPA Routing) ---
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.view-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active states
            navButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Add active to clicked target
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // Trigger specific view setups
            if(targetId === 'view-collection') {
                renderCollectionGrid();
            } else if(targetId === 'view-deck-builder') {
                renderDeckBuilderSidebar();
            }
        });
    });

    // Bind collection filters
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Simple toggle active state for demo styling
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            // Full filter logic would go here
        });
    });

    document.getElementById('search-cards').addEventListener('input', (e) => {
        renderCollectionGrid(e.target.value);
    });
}

// --- API Key Management ---
function checkApiKey() {
    const key = sessionStorage.getItem('gemini_api_key');
    if (!key) {
        // Only show badge if key is missing, don't force modal immediately
        document.getElementById('api-key-btn').style.color = '#ff4444';
        document.getElementById('api-key-btn').innerText = 'API Key Required';
    } else {
        document.getElementById('api-key-btn').style.color = 'var(--text-muted)';
        document.getElementById('api-key-btn').innerText = 'API Key Set ✓';
    }
}

function showApiModal() {
    const modal = document.getElementById('modal-api');
    modal.classList.remove('hidden');
    
    // Check if we have one to prepopulate
    const existing = sessionStorage.getItem('gemini_api_key');
    if(existing) {
        document.getElementById('input-api-key').value = existing;
    }
}

function saveApiKey() {
    const input = document.getElementById('input-api-key').value.trim();
    if (input && input.startsWith('AIza')) {
        sessionStorage.setItem('gemini_api_key', input);
        document.getElementById('modal-api').classList.add('hidden');
        checkApiKey();
    } else {
        alert("Please enter a valid Google Gemini API key (starts with AIza...)");
    }
}

// Close modal if clicked outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('modal-api');
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

// --- Collection Manager ---

// Expose to global so gemini.js can call it after scan
window.renderCollectionGrid = function(searchQuery = '') {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';

    const allCards = getAllCards();
    let myCollection = JSON.parse(localStorage.getItem('tcgp_collection') || '{}');
    
    let uniqueCount = 0;
    let totalCopies = 0;

    // Filter by search
    let displayCards = allCards;
    if(searchQuery) {
        const q = searchQuery.toLowerCase();
        displayCards = allCards.filter(c => c.name.toLowerCase().includes(q) || c.type?.toLowerCase().includes(q));
    }

    displayCards.forEach(card => {
        const qty = myCollection[card.id] || 0;
        
        if (qty > 0) {
            uniqueCount++;
            totalCopies += qty;
        }

        const isOwned = qty > 0;
        
        const cardEl = document.createElement('div');
        cardEl.className = `tcgp-card ${isOwned ? 'owned' : ''}`;
        
        // Color top border by type
        let colorVar = `var(--type-${card.type?.toLowerCase() || 'colorless'})`;
        if(card.type === 'Supporter' || card.type === 'Item') colorVar = '#8b949e';
        cardEl.style.borderTop = `4px solid ${colorVar}`;

        cardEl.innerHTML = `
            ${isOwned ? `<div class="qty-badge">&times;${qty}</div>` : ''}
            <div class="card-img-placeholder">${card.type ? card.type : card.stage}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-set">${card.set} • ${card.rarity}</div>
            <div class="qty-controls">
                <button class="qty-btn" onclick="updateQty('${card.id}', -1)">-</button>
                <button class="qty-btn" onclick="updateQty('${card.id}', 1)">+</button>
            </div>
        `;
        grid.appendChild(cardEl);
    });

    // Update Stats Bar
    document.getElementById('stat-unique-cards').innerText = `${uniqueCount} Unique Cards`;
    document.getElementById('stat-total-copies').innerText = `${totalCopies} Total Copies`;
    document.getElementById('stat-completion').innerText = `${Math.round((uniqueCount / allCards.length) * 100)}% Complete`;
};

window.updateQty = function(cardId, change) {
    let myCollection = JSON.parse(localStorage.getItem('tcgp_collection') || '{}');
    let currentQty = myCollection[cardId] || 0;
    
    let newQty = currentQty + change;
    if(newQty < 0) newQty = 0;
    
    if(newQty === 0) {
        delete myCollection[cardId];
    } else {
        myCollection[cardId] = newQty;
    }
    
    localStorage.setItem('tcgp_collection', JSON.stringify(myCollection));
    
    // Maintain search context on re-render
    const currentSearch = document.getElementById('search-cards').value;
    renderCollectionGrid(currentSearch);
    
    // Also update deck builder sidebar if it's rendered
    if(window.renderDeckBuilderSidebar) {
        window.renderDeckBuilderSidebar();
    }
};

// --- Deck Builder ---
let currentDeck = []; // Array of card objects

window.renderDeckBuilderSidebar = function(searchQuery = '') {
    const listEl = document.getElementById('db-available-cards');
    listEl.innerHTML = '';
    
    let myCollection = JSON.parse(localStorage.getItem('tcgp_collection') || '{}');
    const allCards = getAllCards();
    
    // Filter to only cards the user owns at least 1 of
    let availableCards = allCards.filter(c => myCollection[c.id] > 0);
    
    if(searchQuery) {
        const q = searchQuery.toLowerCase();
        availableCards = availableCards.filter(c => c.name.toLowerCase().includes(q));
    }

    if(availableCards.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No cards match or collection is empty.</p>';
        return;
    }

    availableCards.forEach(card => {
        // Calculate how many are left to add (Owned - Already in deck)
        const ownedQty = myCollection[card.id];
        const inDeckQty = currentDeck.filter(c => c.id === card.id).length;
        const availableToAdd = ownedQty - inDeckQty;
        
        // TCGP Rule: Max 2 of any card per deck
        const canAddTcgpRule = inDeckQty < 2;
        const canAddOwnerRule = availableToAdd > 0;
        const canAddOverall = canAddTcgpRule && canAddOwnerRule && currentDeck.length < 20;

        const itemEl = document.createElement('div');
        itemEl.className = 'db-list-item';
        itemEl.innerHTML = `
            <div>
                <strong>${card.name}</strong><br>
                <small style="color:var(--text-muted)">${card.type || card.stage} • You have: ${availableToAdd}</small>
            </div>
            <button class="btn-ghost add-to-deck-btn" 
                    onclick="addToDeck('${card.id}')" 
                    ${!canAddOverall ? 'disabled' : ''}>
                + Add
            </button>
        `;
        listEl.appendChild(itemEl);
    });
};

window.addToDeck = function(cardId) {
    if(currentDeck.length >= 20) {
        alert("Deck is full (20 cards max).");
        return;
    }
    const card = getAllCards().find(c => c.id === cardId);
    if(card) {
        currentDeck.push(card);
        renderDeckBuilderSlots();
        
        // Re-render sidebar to update "available to add" counts and disable state
        const q = document.getElementById('db-search').value;
        renderDeckBuilderSidebar(q);
    }
};

window.removeFromDeck = function(index) {
    currentDeck.splice(index, 1);
    renderDeckBuilderSlots();
    
    const q = document.getElementById('db-search').value;
    renderDeckBuilderSidebar(q);
};

window.renderDeckBuilderSlots = function() {
    const slotsEl = document.getElementById('deck-slots');
    slotsEl.innerHTML = '';
    
    document.getElementById('deck-current-count').innerText = currentDeck.length;

    // Render 20 slots
    for(let i=0; i<20; i++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'deck-slot';
        
        if(i < currentDeck.length) {
            const card = currentDeck[i];
            slotEl.classList.add('filled');
            
            // Color border by type securely
            let colorVar = `var(--type-${card.type?.toLowerCase() || 'colorless'})`;
            if(card.type === 'Supporter' || card.type === 'Item') colorVar = '#8b949e';
            slotEl.style.borderColor = colorVar;

            slotEl.innerHTML = `
                <div style="font-size:0.7rem; text-align:center;">${card.name}</div>
                <div class="remove-card" onclick="removeFromDeck(${i})">×</div>
            `;
        } else {
            slotEl.innerHTML = '<span style="color:var(--border-subtle);font-size:0.8rem;">Empty</span>';
        }
        
        slotsEl.appendChild(slotEl);
    }
    
    validateDeck();
};

function validateDeck() {
    const saveBtn = document.getElementById('btn-save-deck');
    let hasBasic = false;
    
    currentDeck.forEach(c => {
        if(c.stage === 'Basic') hasBasic = true;
    });

    if(currentDeck.length === 20 && hasBasic) {
        saveBtn.disabled = false;
    } else {
        saveBtn.disabled = true;
    }
}

// Bind deck builder events
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('db-search').addEventListener('input', (e) => {
        renderDeckBuilderSidebar(e.target.value);
    });

    document.getElementById('btn-save-deck').addEventListener('click', () => {
        const deckName = document.getElementById('deck-name').value || "My Deck";
        
        // Save to localStorage
        let savedDecks = JSON.parse(localStorage.getItem('tcgp_saved_decks') || '[]');
        
        // Replace if already exists with same name, or append
        const deckData = { name: deckName, cards: currentDeck.map(c => c.id), lastUpdated: Date.now() };
        const existingIdx = savedDecks.findIndex(d => d.name === deckName);
        if(existingIdx >= 0) savedDecks[existingIdx] = deckData;
        else savedDecks.push(deckData);

        localStorage.setItem('tcgp_saved_decks', JSON.stringify(savedDecks));
        alert("Deck saved successfully!");
        
        // If Strategy Module exists, tell it to update the probability dropdowns
        if(window.populateProbabilityDropdowns) {
            window.populateProbabilityDropdowns();
        }
    });
});
