// strategy.js - Deck Analyzer and Synergy Suggester

document.addEventListener('DOMContentLoaded', () => {
    // We bind the "Check Strategy" button from app.js Deck Builder
    document.getElementById('btn-analyze-deck').addEventListener('click', analyzeCurrentDeck);
});

function analyzeCurrentDeck() {
    // currentDeck is global from app.js
    if (!currentDeck || currentDeck.length === 0) {
        alert("Add some cards to your deck first!");
        return;
    }

    const report = generateStrategyReport(currentDeck);
    showStrategyModal(report);
}

function generateStrategyReport(deck) {
    let score = 100;
    const feedback = [];
    const missing = [];
    
    // 1. Basic Counts & Consistency
    const basics = deck.filter(c => c.stage === 'Basic');
    const evolutions = deck.filter(c => c.stage === 'Stage 1' || c.stage === 'Stage 2');
    const supporters = deck.filter(c => c.type === 'Supporter');
    const items = deck.filter(c => c.type === 'Item');

    if (basics.length < 4) {
        score -= 15;
        feedback.push("⚠️ Too few Basic Pokémon. You have a high chance to 'brick' (mulligan) on opening hands.");
    } else if (basics.length > 10) {
        score -= 5;
        feedback.push("ℹ️ A lot of Basic Pokémon. Make sure you have enough draw power to find your key attackers.");
    }

    if (supporters.length < 2) {
        score -= 10;
        feedback.push("⚠️ Low Supporter count. Consider adding Professor's Research or Sabrina for consistency.");
        missing.push("Professor's Research");
    }

    // 2. Archetype Detection
    let archetype = "Custom Rogue Deck";
    const hasCharizard = deck.some(c => c.name === 'Charizard EX');
    const hasMewtwo = deck.some(c => c.name === 'Mewtwo EX');
    const hasPikachu = deck.some(c => c.name === 'Pikachu EX');
    const hasArticuno = deck.some(c => c.name === 'Articuno EX');

    if (hasCharizard) archetype = "🔥 Charizard EX Aggro";
    else if (hasMewtwo) archetype = "👁️ Mewtwo EX Control";
    else if (hasPikachu) archetype = "⚡ Pikachu EX Fast Aggro";
    else if (hasArticuno) archetype = "💧 Articuno EX Freeze";

    // 3. Trainer Synergy Checks
    const hasBlaine = deck.some(c => c.name === 'Blaine');
    const hasKoga = deck.some(c => c.name === 'Koga');
    const hasErika = deck.some(c => c.name === 'Erika');
    const hasBrock = deck.some(c => c.name === 'Brock');

    // Blaine Needs Ninetales, Magmar, or Rapidash
    if (hasBlaine) {
        const blaineTargets = deck.some(c => ['Ninetales', 'Magmar', 'Rapidash'].includes(c.name));
        if (!blaineTargets) {
            score -= 10;
            feedback.push("❌ Anti-Synergy: You have Blaine but no Ninetales, Magmar, or Rapidash for him to buff.");
        } else {
            feedback.push("✅ Synergy: Good use of Blaine with compatible Fire Pokémon.");
            score += 5;
        }
    }

    // Koga Needs Grimer or Weezing
    if (hasKoga) {
        const kogaTargets = deck.some(c => ['Grimer', 'Weezing'].includes(c.name));
        if (!kogaTargets) {
            score -= 10;
            feedback.push("❌ Anti-Synergy: You have Koga but no Grimer/Weezing to return to hand.");
        }
    }
    
    // Brock needs Golem/Onix etc.
    if(hasBrock) {
        const brockTargets = deck.some(c => ['Onix', 'Golem', 'Geodude', 'Graveler'].includes(c.name));
        if(!brockTargets) {
            score -= 10;
            feedback.push("❌ Anti-Synergy: Brock requires Rock/Ground types from Brock's gym.");
        }
    }

    // 4. Non-Trainer Synergy (Pokemon to Pokemon)
    const hasGardevoir = deck.some(c => c.name === 'Gardevoir');
    if (hasMewtwo && !hasGardevoir) {
        missing.push("Gardevoir (for Psy Shadow Energy acceleration)");
    } else if (hasMewtwo && hasGardevoir) {
        score += 15;
        feedback.push("✅ Synergy: Gardevoir's Psy Shadow is perfectly powering up Mewtwo EX.");
    }

    const hasPidgeot = deck.some(c => c.name === 'Pidgeot');
    if (hasPidgeot) {
        feedback.push("✅ Synergy: Pidgeot's Drive Off provides excellent control.");
    }

    // 5. General Type Checks for Erika/Misty
    const grassCount = deck.filter(c => c.type === 'Grass').length;
    if (hasErika && grassCount === 0) {
        score -= 10;
        feedback.push("❌ Anti-Synergy: Erika only heals Grass Pokémon, but you don't have any.");
    }
    
    const waterCount = deck.filter(c => c.type === 'Water').length;
    const hasMisty = deck.some(c => c.name === 'Misty');
    if(waterCount > 0 && !hasMisty) {
        feedback.push("💡 Suggestion: You have Water Pokémon. Misty provides massive energy acceleration.");
        missing.push("Misty");
    }

    // Normalize score
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return {
        archetype,
        score,
        feedback,
        missing: [...new Set(missing)] // unique
    };
}

function showStrategyModal(report) {
    // Check if modal exists, if not inject it
    let modal = document.getElementById('modal-strategy');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-strategy';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:500px">
                <h2>Strategy Analysis</h2>
                
                <div style="margin: 16px 0; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-size:0.8rem; color:var(--text-muted)">Detected Archetype</div>
                        <strong id="strat-archetype" style="color:var(--accent-gold); font-size:1.1rem;"></strong>
                    </div>
                    <div style="text-align:right">
                        <div style="font-size:0.8rem; color:var(--text-muted)">Synergy Score</div>
                        <strong id="strat-score" style="font-size:1.5rem;"></strong><span style="font-size:1rem">/100</span>
                    </div>
                </div>

                <div style="background:var(--bg-dark); padding:12px; border-radius:8px; margin-bottom:16px;">
                    <h4 style="margin-bottom:8px">Feedback</h4>
                    <ul id="strat-feedback" style="list-style:none; padding:0; font-size:0.9rem; margin:0; display:flex; flex-direction:column; gap:8px;"></ul>
                </div>

                <div id="strat-missing-container" style="background:var(--bg-dark); padding:12px; border-radius:8px; margin-bottom:24px;">
                    <h4 style="margin-bottom:8px">Recommended Additions</h4>
                    <ul id="strat-missing" style="padding-left:20px; font-size:0.9rem; margin:0; color:var(--accent-hover);"></ul>
                </div>

                <div class="modal-actions" style="justify-content: flex-end;">
                    <button class="btn-primary" onclick="document.getElementById('modal-strategy').classList.add('hidden')">Close Analysis</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Populate data
    document.getElementById('strat-archetype').innerText = report.archetype;
    
    const scoreEl = document.getElementById('strat-score');
    scoreEl.innerText = report.score;
    if(report.score >= 80) scoreEl.style.color = '#78c850';
    else if(report.score >= 50) scoreEl.style.color = '#f5c518';
    else scoreEl.style.color = '#ff4444';

    const fbList = document.getElementById('strat-feedback');
    fbList.innerHTML = report.feedback.map(f => `<li style="margin-bottom:8px">${f}</li>`).join('');

    const missList = document.getElementById('strat-missing');
    const missContainer = document.getElementById('strat-missing-container');
    if (report.missing && report.missing.length > 0) {
        missContainer.style.display = 'block';
        missList.innerHTML = report.missing.map(m => `<li>${m}</li>`).join('');
    } else {
        missContainer.style.display = 'none';
    }

    modal.classList.remove('hidden');
}
