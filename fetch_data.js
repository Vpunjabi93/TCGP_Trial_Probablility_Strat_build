const fs = require('fs');
const https = require('https');
const path = require('path');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Node/18' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch(e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function mapRarity(rarityStr) {
    const map = {
        "One Diamond": "◇",
        "Two Diamond": "◇◇",
        "Three Diamond": "◇◇◇",
        "Four Diamond": "◇◇◇◇",
        "One Star": "☆",
        "Two Star": "☆☆",
        "Three Star": "☆☆☆",
        "Crown": "👑",
        "None": ""
    };
    return map[rarityStr] !== undefined ? map[rarityStr] : rarityStr;
}

async function fetchSet(setId, setName, varName, fileName) {
    console.log(`Fetching set: ${setId}...`);
    try {
        const setData = await fetchJson(`https://api.tcgdex.net/v2/en/sets/${setId}`);
        let cards = [];
        let count = 0;
        
        // We will fetch card details in batches to be nice to the API
        const batchSize = 10;
        for (let i = 0; i < setData.cards.length; i += batchSize) {
            const batch = setData.cards.slice(i, i + batchSize);
            const promises = batch.map(async (c) => {
                const cardDetail = await fetchJson(`https://api.tcgdex.net/v2/en/cards/${c.id}`);
                const number = cardDetail.id.split('-')[1];
                return {
                    id: cardDetail.id,
                    name: cardDetail.name,
                    set: setName,
                    setCode: setId,
                    rarity: mapRarity(cardDetail.rarity || 'None'),
                    type: cardDetail.types ? cardDetail.types[0] : (cardDetail.category === 'Trainer' ? cardDetail.trainerType : 'Colorless'),
                    hp: cardDetail.hp || 0,
                    stage: cardDetail.stage || (cardDetail.category === 'Trainer' ? 'Trainer' : 'Basic'),
                    weakness: cardDetail.weaknesses ? (cardDetail.weaknesses[0] ? cardDetail.weaknesses[0].type : '') : '',
                    retreatCost: cardDetail.retreat || 0,
                    img: `https://assets.tcgdex.net/en/tcgp/${setId}/${number}/high.webp`
                };
            });
            const results = await Promise.all(promises);
            cards.push(...results);
            count += results.length;
            console.log(`Fetched ${count}/${setData.cards.length} cards for ${setId}`);
        }
        
        const fileContent = `const ${varName} = ${JSON.stringify(cards, null, 2)};`;
        fs.writeFileSync(path.join(__dirname, 'data', fileName), fileContent);
        console.log(`Successfully wrote ${fileName}`);
        
    } catch (e) {
        console.error(`Error fetching set ${setId}:`, e);
    }
}

async function main() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    
    await fetchSet('A1', 'Genetic Apex', 'SET_A1', 'set_a1.js');
    await fetchSet('A2', 'Space-Time Smackdown', 'SET_A2', 'set_a2.js');
    console.log("All sets fetched!");
}

main();
