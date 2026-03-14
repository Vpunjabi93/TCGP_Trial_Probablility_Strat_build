// probability.js - Math Engine for TCGP Odds

// --- Math Utilities ---

// Calculate Factorial
function fact(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

// Calculate Combinations: C(n, r)
function comb(n, r) {
    if (r < 0 || r > n) return 0;
    return fact(n) / (fact(r) * fact(n - r));
}

// Hypergeometric Distribution
// N = Population (e.g. 20 cards in deck)
// K = Successes in population (e.g. 2 Charizards in deck)
// n = Sample size (e.g. draw 5 cards)
// k = Exact successes in sample
function hypergeom(N, K, n, k) {
    return (comb(K, k) * comb(N - K, n - k)) / comb(N, n);
}

// Cumulative Probability P(X >= k)
function probAtLeast(N, K, n, k_min) {
    let prob = 0;
    for (let k = k_min; k <= K && k <= n; k++) {
        prob += hypergeom(N, K, n, k);
    }
    return prob;
}

// --- TCGP Specific Math ---

// Calculates the true odds of drawing X copies of a Specific Card in the opening hand.
// Accounts for the forced "Must have at least 1 Basic" rule.
function calcTrueOpeningHandOdds(deck, targetId) {
    let N = 20;
    let n = 5; // Opening hand size
    
    // Count Basics in the deck overall
    let totalBasics = 0;
    deck.forEach(c => { if(c.stage === 'Basic') totalBasics++; });
    
    // Count copies of our target card
    const targetCards = deck.filter(c => c.id === targetId);
    let K = targetCards.length;
    
    if(K === 0) return 0;
    const isTargetBasic = targetCards[0].stage === 'Basic';

    // P(Brick) = Chance hand has 0 Basics.
    let pBrick = hypergeom(N, totalBasics, n, 0);
    
    // True valid opening hand math
    if(isTargetBasic) {
        // If the target IS a Basic, we just use standard Hypergeometric.
        // Because if we draw the target, the hand is automatically valid (has a basic).
        // (This is a slight simplification of conditional probability but highly accurate for this edge case).
        return probAtLeast(N, K, n, 1);
    } else {
        // Target is an Item, Supporter, or Evolution.
        // The hand MUST contain at least 1 Basic. The target is NOT a basic.
        // Therefore, 1 slot of the 5 is "reserved" for a Basic.
        // We calculate the odds of finding the target in the remaining 4 slots.
        return probAtLeast(N - 1, K, n - 1, 1);
    }
}

// General function for mid-match draws.
function calcLiveOdds(cardsRemaining, copiesRemaining, cardsToDraw) {
    if (cardsRemaining <= 0 || copiesRemaining <= 0) return 0;
    if (cardsToDraw >= cardsRemaining) return 1;
    return probAtLeast(cardsRemaining, copiesRemaining, cardsToDraw, 1);
}

// --- UI Binding ---

window.populateProbabilityDropdowns = function() {
    const selDeck = document.getElementById('prob-deck-select');
    selDeck.innerHTML = '<option value="">Select a saved deck...</option>';
    
    let savedDecks = JSON.parse(localStorage.getItem('tcgp_saved_decks') || '[]');
    savedDecks.forEach((deck, idx) => {
        selDeck.innerHTML += `<option value="${idx}">${deck.name}</option>`;
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // Populate dropdowns initially
    populateProbabilityDropdowns();

    // Chart.js instance tracking
    let probChartInstance = null;
    let currentLoadedDeck = null;

    // Listeners
    document.getElementById('prob-deck-select').addEventListener('change', (e) => {
        const idx = e.target.value;
        if(idx === "") return;
        
        let savedDecks = JSON.parse(localStorage.getItem('tcgp_saved_decks') || '[]');
        const deckData = savedDecks[idx];
        
        // Hydrate from IDs
        const allCards = getAllCards();
        currentLoadedDeck = deckData.cards.map(id => allCards.find(c => c.id === id)).filter(Boolean);
        
        // Populate Target Card dropdown with unique cards in the deck
        const uniqueCards = [...new Map(currentLoadedDeck.map(item => [item.id, item])).values()];
        const selTarget = document.getElementById('prob-target-card');
        selTarget.innerHTML = uniqueCards.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        
        // Reset Sliders for turn 1 Match state
        document.getElementById('slider-deck-size').value = 20;
        document.getElementById('val-deck-size').innerText = 20;
        
        const count = currentLoadedDeck.filter(c => c.id === uniqueCards[0].id).length;
        document.getElementById('slider-target-copies').value = count;
        document.getElementById('val-target-copies').innerText = count;
        
        updateCalculations();
    });

    document.getElementById('prob-target-card').addEventListener('change', (e) => {
        const id = e.target.value;
        const count = currentLoadedDeck.filter(c => c.id === id).length;
        document.getElementById('slider-target-copies').value = count;
        document.getElementById('val-target-copies').innerText = count;
        updateCalculations();
    });

    ['slider-deck-size', 'slider-target-copies'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            const valId = id.replace('slider-', 'val-');
            document.getElementById(valId).innerText = e.target.value;
        });
    });

    document.getElementById('btn-calc-odds').addEventListener('click', updateCalculations);

    function updateCalculations() {
        if(!currentLoadedDeck) return;

        const targetId = document.getElementById('prob-target-card').value;
        const N = parseInt(document.getElementById('slider-deck-size').value);
        const K = parseInt(document.getElementById('slider-target-copies').value);
        
        // Mid-match single card draw odds
        const nextDrawOdds = calcLiveOdds(N, K, 1) * 100;
        
        document.getElementById('result-percent').innerText = `${nextDrawOdds.toFixed(1)}%`;

        // Generate Chart Data (Odds by Turn 1-10)
        // Assume Turn 1 you have seen 5 cards if N=20 initially.
        let chartLabels = [];
        let chartData = [];
        
        // If they are starting from a fresh 20 deck (Opening hand logic)
        for(let turn=1; turn<=10; turn++) {
            chartLabels.push(`Turn ${turn}`);
            
            // Turn 1 = Opening 5. Turn 2 = Seen 6. Turn 3 = Seen 7.
            // We'll map turn number directly to cards seen for the chart assuming no search items.
            let cardsSeen = 4 + turn; // Turn 1 (5 cards), Turn 2 (6), etc.
            
            if(N === 20 && turn === 1) {
                chartData.push(calcTrueOpeningHandOdds(currentLoadedDeck, targetId) * 100);
            } else {
                // By turn N odds
                chartData.push(calcLiveOdds(20, K, cardsSeen) * 100);
            }
        }

        renderChart(chartLabels, chartData);
    }

    function renderChart(labels, data) {
        const ctx = document.getElementById('prob-chart').getContext('2d');
        
        if(probChartInstance) {
            probChartInstance.destroy();
        }

        probChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cumulative Draw %',
                    data: data,
                    borderColor: '#f5c518',
                    backgroundColor: 'rgba(245, 197, 24, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: '#8b949e', callback: v => v + '%' },
                        grid: { color: '#30363d' }
                    },
                    x: {
                        ticks: { color: '#8b949e' },
                        grid: { color: '#30363d' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
});
