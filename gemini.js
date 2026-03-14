// gemini.js - Gemini Vision API Integration for Video Collection Scanning

document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('video-upload');
    const uploadZone = document.getElementById('upload-zone');
    
    uploadZone.addEventListener('click', () => uploadInput.click());
    
    uploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        await processVideoWithGemini(file);
    });
});

async function processVideoWithGemini(file) {
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
        // Step 1: In a real backend, we'd use the proper Google AI Studio Files API url for big videos.
        // For this purely frontend browser app, we must convert the video to base64 to send inline.
        // NOTE: This limits video size realistically to ~20MB in browser, which is fine for short 10-15s TCGP scrolls.
        
        statusText.innerText = "Encoding video for analysis...";
        const base64Video = await fileToBase64(file);
        const mimeType = file.type || 'video/mp4';

        statusText.innerText = "Gemini is scanning your collection...";

        const prompt = `
        This is a screen recording of a Pokémon TCG Pocket card collection. 
        For each distinct card visibly shown in the grid, return the card name and how many copies of it appear (look at the quantity badges).
        Only return a strict JSON array of objects with 'name' and 'count' properties. No markdown, no extra text.
        Example: [{"name":"Pikachu EX","count":1},{"name":"Charmander","count":3}]
        `;

        const requestBody = {
            contents: [{
                parts: [
                    { "text": prompt },
                    { 
                        "inline_data": { 
                            "mime_type": mimeType, 
                            "data": base64Video.split(',')[1] 
                        } 
                    }
                ]
            }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
        
        // Clean JSON formatting if Gemini adds markdown blocks
        let cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const scannedCards = JSON.parse(cleanJson);
        
        statusText.innerText = `Found ${scannedCards.length} unique cards! Organizing...`;
        
        // Step 3: Parse and save to collection
        saveScannedCollection(scannedCards);

    } catch (error) {
        console.error("Gemini Error:", error);
        alert(`Analysis failed: ${error.message}\nMake sure your video is short (< 15 seconds) and your API key is valid.`);
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

function saveScannedCollection(scannedData) {
    // Current collection state mapping card IDs to quantity
    let myCollection = JSON.parse(localStorage.getItem('tcgp_collection') || '{}');
    let addedCount = 0;

    scannedData.forEach(item => {
        // Fuzzy match logic
        const dbCard = getCardByName(item.name); 
        if(dbCard) {
            // Add or overwrite the quantity
            myCollection[dbCard.id] = item.count || 1;
            addedCount++;
        }
    });

    localStorage.setItem('tcgp_collection', JSON.stringify(myCollection));
    
    // Switch view to Collection automatically
    setTimeout(() => {
        document.getElementById('upload-zone').classList.remove('hidden');
        document.getElementById('scan-status').classList.add('hidden');
        
        // Trigger generic tab switch via app.js navigation hook
        document.querySelector('[data-target="view-collection"]').click();
        
        if(window.renderCollectionGrid) {
            window.renderCollectionGrid();
        }
    }, 1500);
}
