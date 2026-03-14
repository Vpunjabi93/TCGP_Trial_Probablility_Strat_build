// gemini.js - Gemini Vision API Integration for Video Collection Scanning

document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('video-upload');
    const uploadZone = document.getElementById('upload-zone');
    
    uploadZone.addEventListener('click', () => uploadInput.click());
    
    uploadInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if(files.length === 0) return;
        
        await processMediaWithGemini(files);
    });
});

async function processMediaWithGemini(files) {
    const apiKey = sessionStorage.getItem('gemini_api_key');
    if(!apiKey) {
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

        statusText.innerText = `Gemini is scanning your structured input...`;

        const prompt = `
        This is a set of ${files.length} screenshot(s) / video(s) of a Pokémon TCG Pocket card collection. 
        For each distinct card visibly shown across ALL files, return the card name exactly as it appears in the official game, and how many copies of it appear (look at the quantity badges).
        Combine the total counts logically without double counting the same card overlapping between two screenshots.
        Only return a strict JSON array of objects with 'name' and 'count' properties. No markdown, no extra text.
        Example: [{"name":"Pikachu EX","count":1},{"name":"Charmander","count":3}]
        `;

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
        
        // Clean JSON formatting
        let cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const scannedCards = JSON.parse(cleanJson);
        
        statusText.innerText = `Found ${scannedCards.length} unique cards! Preparing review...`;
        
        // Step 3: Map to actual DB cards and open Review Modal
        setTimeout(() => {
            document.getElementById('scan-status').classList.add('hidden');
            showReviewModal(scannedCards);
        }, 500);

    } catch (error) {
        console.error("Gemini Error:", error);
        alert(`Analysis failed: ${error.message}\nEnsure your API key is valid.`);
        uploadZone.classList.remove('hidden');
        statusPanel.classList.add('hidden');
    }
}

// Convert file Blob to Base64 String
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

let pendingReviewCollection = {};

function showReviewModal(scannedData) {
    const modal = document.getElementById('modal-review');
    const listEl = document.getElementById('review-card-list');
    listEl.innerHTML = '';
    pendingReviewCollection = {};

    let matchCount = 0;

    scannedData.forEach(item => {
        const dbCard = getCardByName(item.name);
        if(dbCard) {
            // Store by ID in our pending map
            pendingReviewCollection[dbCard.id] = (pendingReviewCollection[dbCard.id] || 0) + (item.count || 1);
        }
    });

    // Render items
    renderReviewList();

    modal.classList.remove('hidden');

    // Bind Review Action Buttons
    document.getElementById('btn-cancel-review').onclick = () => {
        modal.classList.add('hidden');
        document.getElementById('upload-zone').classList.remove('hidden');
    };

    document.getElementById('btn-confirm-review').onclick = () => {
        saveReviewedCollection();
        modal.classList.add('hidden');
    };
}

function renderReviewList() {
    const listEl = document.getElementById('review-card-list');
    listEl.innerHTML = '';
    
    // Sort array of IDs so it renders consistently
    const sortedIds = Object.keys(pendingReviewCollection).sort();

    if(sortedIds.length === 0) {
        listEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No matchable cards found in the scan.</p>';
        return;
    }

    sortedIds.forEach(id => {
        const qty = pendingReviewCollection[id];
        const dbCard = getAllCards().find(c => c.id === id);
        
        if(!dbCard) return;

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

// Global scope so inline onclick works
window.modifyReviewQty = function(cardId, change) {
    let currentQty = pendingReviewCollection[cardId] || 0;
    let newQty = currentQty + change;
    
    if(newQty <= 0) {
        delete pendingReviewCollection[cardId];
    } else {
        pendingReviewCollection[cardId] = newQty;
    }
    renderReviewList();
};

function saveReviewedCollection() {
    // Merge pending with actual collection
    let myCollection = JSON.parse(localStorage.getItem('tcgp_collection') || '{}');
    
    Object.keys(pendingReviewCollection).forEach(id => {
        // Can choose to Add or Overwrite. Let's Add for saftey, or user sets it.
        // But since this is a scan, usually it's replacing. We'll overwrite matching cards.
        myCollection[id] = pendingReviewCollection[id];
    });

    localStorage.setItem('tcgp_collection', JSON.stringify(myCollection));
    
    // Switch view to Collection automatically
    document.getElementById('upload-zone').classList.remove('hidden');
    
    // Trigger generic tab switch via app.js navigation hook
    document.querySelector('[data-target="view-collection"]').click();
    
    if(window.renderCollectionGrid) {
        window.renderCollectionGrid();
    }
}
