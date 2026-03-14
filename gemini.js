// gemini.js - Gemini Vision API Integration for Collection Scanning
// V4: Batch Preview, Iterative Scanning, Edition-View Mode

let currentScanMode = 'standard';
let pendingFiles = [];
let pendingReviewCollection = {};

document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('video-upload');
    const uploadZone = document.getElementById('upload-zone');

    uploadZone.addEventListener('click', () => uploadInput.click());

    uploadInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        pendingFiles = files;
        showBatchPreview(files);
    });
});

// --- Scan Mode Toggle ---
window.setScanMode = function(mode) {
    currentScanMode = mode;
    const hint = document.getElementById('scan-mode-hint');
    const btnStd = document.getElementById('mode-btn-standard');
    const btnEd = document.getElementById('mode-btn-edition');

    // Also check for alternate IDs from previous HTML versions
    const btnStd2 = document.getElementById('btn-mode-standard');
    const btnEd2 = document.getElementById('btn-mode-edition');

    [btnStd, btnStd2, btnEd, btnEd2].forEach(b => { if (b) b.classList.remove('active'); });

    if (mode === 'standard') {
        if (btnStd) btnStd.classList.add('active');
        if (btnStd2) btnStd2.classList.add('active');
        if (hint) hint.innerText = 'Gemini will identify card names and quantities from your screenshots.';
    } else {
        if (btnEd) btnEd.classList.add('active');
        if (btnEd2) btnEd2.classList.add('active');
        if (hint) hint.innerText = 'Edition View: AI reads card numbers from the set grid and reverse-matches them.';
    }
};

// --- Batch Upload Preview ---
function showBatchPreview(files) {
    const uploadZone = document.getElementById('upload-zone');
    const previewContainer = document.getElementById('upload-preview-container') || document.getElementById('upload-preview-strip');
    if (!previewContainer) {
        // Fallback: just process directly
        processMediaWithGemini(files);
        return;
    }

    const grid = document.getElementById('upload-preview-grid');

    uploadZone.classList.add('hidden');
    previewContainer.classList.remove('hidden');

    if (grid) {
        grid.innerHTML = '';
        files.forEach((file, idx) => {
            const thumb = document.createElement('div');
            thumb.className = 'preview-thumb';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                thumb.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const vid = document.createElement('video');
                vid.src = URL.createObjectURL(file);
                vid.muted = true;
                thumb.appendChild(vid);
            }

            const nameLabel = document.createElement('div');
            nameLabel.className = 'file-name';
            nameLabel.innerText = file.name;
            thumb.appendChild(nameLabel);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-preview';
            removeBtn.innerText = '×';
            removeBtn.onclick = () => removePreviewFile(idx);
            thumb.appendChild(removeBtn);

            grid.appendChild(thumb);
        });
    } else {
        // Simple strip fallback
        previewContainer.innerHTML = '';
        files.forEach(file => {
            const tag = document.createElement('span');
            tag.style.cssText = 'background:var(--bg-surface);padding:4px 8px;border-radius:6px;font-size:0.8rem;';
            tag.innerText = file.name;
            previewContainer.appendChild(tag);
        });
    }
}

function removePreviewFile(idx) {
    pendingFiles.splice(idx, 1);
    if (pendingFiles.length === 0) {
        cancelUpload();
    } else {
        showBatchPreview(pendingFiles);
    }
}

window.cancelUpload = function() {
    pendingFiles = [];
    const uploadZone = document.getElementById('upload-zone');
    const previewContainer = document.getElementById('upload-preview-container') || document.getElementById('upload-preview-strip');
    uploadZone.classList.remove('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');
    document.getElementById('video-upload').value = '';
};

window.confirmUpload = function() {
    if (pendingFiles.length === 0) return;
    const previewContainer = document.getElementById('upload-preview-container') || document.getElementById('upload-preview-strip');
    if (previewContainer) previewContainer.classList.add('hidden');
    processMediaWithGemini(pendingFiles);
};

// --- Core Gemini Scan ---
async function processMediaWithGemini(files) {
    const apiKey = sessionStorage.getItem('gemini_api_key');
    if (!apiKey) {
        alert("Please set your Gemini API key first!");
        document.getElementById('api-key-btn').click();
        return;
    }

    const uploadZone = document.getElementById('upload-zone');
    const statusPanel = document.getElementById('scan-status');
    const statusText = document.getElementById('scan-status-text');

    uploadZone.classList.add('hidden');
    statusPanel.classList.remove('hidden');

    try {
        statusText.innerText = `Encoding ${files.length} file(s) for analysis...`;

        const inlineDataParts = await Promise.all(files.map(async file => {
            const base64 = await fileToBase64(file);
            return {
                "inline_data": {
                    "mime_type": file.type || 'image/jpeg',
                    "data": base64.split(',')[1]
                }
            };
        }));

        statusText.innerText = `Gemini is scanning your ${currentScanMode === 'edition' ? 'edition grid' : 'collection'}...`;

        const prompt = currentScanMode === 'edition'
            ? getEditionViewPrompt(files.length)
            : getStandardPrompt(files.length);

        const requestBody = {
            contents: [{
                parts: [
                    { "text": prompt },
                    ...inlineDataParts
                ]
            }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "API Auth Error");
        }

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;

        let cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const scannedCards = JSON.parse(cleanJson);

        statusText.innerText = `Found ${scannedCards.length} items! Preparing review...`;

        setTimeout(() => {
            statusPanel.classList.add('hidden');
            if (currentScanMode === 'edition') {
                showReviewModalFromEditionScan(scannedCards);
            } else {
                showReviewModal(scannedCards);
            }
        }, 500);

    } catch (error) {
        console.error("Gemini Error:", error);
        alert(`Analysis failed: ${error.message}\nEnsure your API key is valid.`);
        uploadZone.classList.remove('hidden');
        statusPanel.classList.add('hidden');
    }
}

// --- Prompts ---
function getStandardPrompt(fileCount) {
    return `
    This is a set of ${fileCount} screenshot(s) / video(s) of a Pokémon TCG Pocket card collection. 
    For each distinct card visibly shown across ALL files, return the card name exactly as it appears in the official game, and how many copies of it appear (look at the quantity badges).
    Combine the total counts logically without double counting the same card overlapping between two screenshots.
    Only return a strict JSON array of objects with 'name' and 'count' properties. No markdown, no extra text.
    Example: [{"name":"Pikachu EX","count":1},{"name":"Charmander","count":3}]
    `;
}

function getEditionViewPrompt(fileCount) {
    return `
    This is a set of ${fileCount} screenshot(s) of a Pokémon TCG Pocket card collection shown in "Edition View" — a grid organized by card number within a specific set.
    Each slot has a card number. Cards that are owned/collected appear in full color, while missing cards are greyed out or have a lock/silhouette.
    
    Your job: Identify the SET name displayed at the top of the screen, then list ALL the card NUMBERS that appear to be OWNED/COLLECTED (full color, not greyed out).
    
    Return a strict JSON object with these properties:
    - "set": the set code or name visible (e.g. "A1", "Genetic Apex", etc.) 
    - "ownedNumbers": an array of card numbers (as integers) that appear owned/collected
    
    Example: {"set":"A1","ownedNumbers":[1,3,5,7,12,15,20,45,67,100]}
    No markdown, no extra text. Only the JSON object.
    `;
}

// --- Edition View Processing ---
function showReviewModalFromEditionScan(editionData) {
    // editionData is { set: "A1", ownedNumbers: [1, 3, 5, ...] }
    const setCode = normalizeSetCode(editionData.set);
    const numbers = editionData.ownedNumbers || [];

    // Reverse-match numbers to actual cards in DB
    const matchedCards = [];
    numbers.forEach(num => {
        const paddedNum = String(num).padStart(3, '0');
        const cardId = `${setCode}-${paddedNum}`;
        const card = TCGP_CARDS.find(c => c.id === cardId);
        if (card) {
            matchedCards.push({ name: card.name, count: 1 });
        }
    });

    showReviewModal(matchedCards);
}

function normalizeSetCode(rawSet) {
    if (!rawSet) return 'A1';
    const s = rawSet.trim().toUpperCase();

    const nameMap = {
        'GENETIC APEX': 'A1',
        'MYTHICAL ISLAND': 'A1a',
        'SPACE-TIME SMACKDOWN': 'A2',
        'SPACE TIME SMACKDOWN': 'A2',
        'TRIUMPHANT LIGHT': 'A2a',
        'SHINING REVELRY': 'A2b',
        'CELESTIAL GUARDIANS': 'A3',
        'EXTRADIMENSIONAL CRISIS': 'A3a',
        'EEVEE GROVE': 'A3b',
        'WISDOM OF SEA AND SKY': 'A4',
        'SECLUDED SPRINGS': 'A4a',
        'MEGA RISING': 'B1',
        'CRIMSON BLAZE': 'B1a',
        'FANTASTICAL PARADE': 'B2',
        'PROMO-A': 'P-A',
        'PROMO': 'P-A'
    };

    // Check if it's already a valid code
    const validCodes = ['A1', 'A1A', 'A2', 'A2A', 'A2B', 'A3', 'A3A', 'A3B', 'A4', 'A4A', 'B1', 'B1A', 'B2', 'P-A'];
    if (validCodes.includes(s)) {
        // Restore proper casing for sub-sets
        const caseMap = { 'A1A': 'A1a', 'A2A': 'A2a', 'A2B': 'A2b', 'A3A': 'A3a', 'A3B': 'A3b', 'A4A': 'A4a', 'B1A': 'B1a' };
        return caseMap[s] || s;
    }

    return nameMap[s] || rawSet.trim();
}

// --- Review Modal ---
function showReviewModal(scannedData) {
    const modal = document.getElementById('modal-review');
    const listEl = document.getElementById('review-card-list');
    listEl.innerHTML = '';
    pendingReviewCollection = {};

    scannedData.forEach(item => {
        const dbCard = getCardByName(item.name);
        if (dbCard) {
            pendingReviewCollection[dbCard.id] = (pendingReviewCollection[dbCard.id] || 0) + (item.count || 1);
        }
    });

    renderReviewList();
    modal.classList.remove('hidden');

    document.getElementById('btn-cancel-review').onclick = () => {
        modal.classList.add('hidden');
        resetScanUI();
    };

    document.getElementById('btn-confirm-review').onclick = () => {
        saveReviewedCollection();
        modal.classList.add('hidden');
    };
}

function renderReviewList() {
    const listEl = document.getElementById('review-card-list');
    listEl.innerHTML = '';

    const sortedIds = Object.keys(pendingReviewCollection).sort();

    if (sortedIds.length === 0) {
        listEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No matchable cards found in the scan.</p>';
        return;
    }

    sortedIds.forEach(id => {
        const qty = pendingReviewCollection[id];
        const dbCard = getAllCards().find(c => c.id === id);
        if (!dbCard) return;

        const itemEl = document.createElement('div');
        itemEl.className = 'review-item';

        itemEl.innerHTML = `
            <div class="review-item-info">
                ${dbCard.img ? `<img src="${dbCard.img}" class="review-img">` : `<div style="width:40px;height:56px;background:#333;"></div>`}
                <div>
                    <strong>${dbCard.name}</strong><br>
                    <small style="color:var(--text-muted)">${dbCard.set} • ${dbCard.rarity}</small>
                </div>
            </div>
            <div class="review-qty-controls">
                <button class="btn-ghost" onclick="modifyReviewQty('${dbCard.id}', -1)">-</button>
                <span class="review-qty">${qty}</span>
                <button class="btn-ghost" onclick="modifyReviewQty('${dbCard.id}', 1)">+</button>
            </div>
        `;
        listEl.appendChild(itemEl);
    });
}

window.modifyReviewQty = function(cardId, change) {
    let currentQty = pendingReviewCollection[cardId] || 0;
    let newQty = currentQty + change;

    if (newQty <= 0) {
        delete pendingReviewCollection[cardId];
    } else {
        pendingReviewCollection[cardId] = newQty;
    }
    renderReviewList();
};

// --- Iterative Scanning: Save & Return to Scan ---
function saveReviewedCollection() {
    let myCollection = JSON.parse(localStorage.getItem('tcgp_collection') || '{}');

    Object.keys(pendingReviewCollection).forEach(id => {
        myCollection[id] = (myCollection[id] || 0) + pendingReviewCollection[id];
    });

    localStorage.setItem('tcgp_collection', JSON.stringify(myCollection));

    const addedCount = Object.keys(pendingReviewCollection).length;
    pendingReviewCollection = {};

    // Iterative Scanning: Reset scan UI so user can scan again
    resetScanUI();

    // Sync to cloud if available
    if (typeof syncCollectionToCloud === 'function') {
        syncCollectionToCloud();
    }

    // Show success toast instead of navigating away
    showToast(`✅ Added ${addedCount} cards to your collection!`);

    // Refresh collection grid in background
    if (window.renderCollectionGrid) {
        window.renderCollectionGrid();
    }
}

function resetScanUI() {
    const uploadZone = document.getElementById('upload-zone');
    const previewContainer = document.getElementById('upload-preview-container') || document.getElementById('upload-preview-strip');

    uploadZone.classList.remove('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');
    document.getElementById('video-upload').value = '';
    pendingFiles = [];
}

// --- Toast Notification ---
function showToast(message) {
    let toast = document.getElementById('scan-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'scan-toast';
        toast.style.cssText = `
            position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
            background: #1a7f37; color: white; padding: 12px 24px; border-radius: 12px;
            font-size: 0.9rem; font-weight: 500; z-index: 2000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4); transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = '1';
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 3000);
}

// --- Helpers ---
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function getCardByName(name) {
    if (!name) return null;
    const lowerName = name.toLowerCase().trim();
    return TCGP_CARDS.find(c => c.name.toLowerCase() === lowerName);
}
