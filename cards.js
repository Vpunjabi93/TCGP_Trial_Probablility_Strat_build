// cards.js - Pokemon TCGP Card Database
// Note: This is a representative robust subset of the 1500+ cards for the MVP, 
// focusing on meta-relevant cards and full set structures from A1, A1a to let the engine work.

const TCGP_CARDS = [
  // --- GENETIC APEX (A1) ---
  { id: "A1-001", name: "Bulbasaur", set: "Genetic Apex", setCode: "A1", rarity: "Common", type: "Grass", hp: 70, stage: "Basic", weakness: "Fire", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_001_EN.webp" },
  { id: "A1-002", name: "Ivysaur", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Grass", hp: 90, stage: "Stage 1", weakness: "Fire", retreatCost: 2, evolvesFrom: "Bulbasaur", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_002_EN.webp" },
  { id: "A1-003", name: "Venusaur EX", set: "Genetic Apex", setCode: "A1", rarity: "Rare", type: "Grass", hp: 190, stage: "Stage 2", weakness: "Fire", retreatCost: 3, evolvesFrom: "Ivysaur", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_004_EN.webp" },
  { id: "A1-004", name: "Charmander", set: "Genetic Apex", setCode: "A1", rarity: "Common", type: "Fire", hp: 60, stage: "Basic", weakness: "Water", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_034_EN.webp" },
  { id: "A1-005", name: "Charmeleon", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Fire", hp: 90, stage: "Stage 1", weakness: "Water", retreatCost: 1, evolvesFrom: "Charmander", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_035_EN.webp" },
  { id: "A1-006", name: "Charizard EX", set: "Genetic Apex", setCode: "A1", rarity: "Rare", type: "Fire", hp: 180, stage: "Stage 2", weakness: "Water", retreatCost: 2, evolvesFrom: "Charmeleon", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_036_EN.webp" },
  { id: "A1-007", name: "Squirtle", set: "Genetic Apex", setCode: "A1", rarity: "Common", type: "Water", hp: 60, stage: "Basic", weakness: "Lightning", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_053_EN.webp" },
  { id: "A1-008", name: "Wartortle", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Water", hp: 80, stage: "Stage 1", weakness: "Lightning", retreatCost: 1, evolvesFrom: "Squirtle", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_054_EN.webp" },
  { id: "A1-009", name: "Blastoise EX", set: "Genetic Apex", setCode: "A1", rarity: "Rare", type: "Water", hp: 180, stage: "Stage 2", weakness: "Lightning", retreatCost: 3, evolvesFrom: "Wartortle", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_055_EN.webp" },
  { id: "A1-010", name: "Pikachu EX", set: "Genetic Apex", setCode: "A1", rarity: "Rare", type: "Lightning", hp: 120, stage: "Basic", weakness: "Fighting", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_096_EN.webp" },
  { id: "A1-011", name: "Mewtwo EX", set: "Genetic Apex", setCode: "A1", rarity: "Rare", type: "Psychic", hp: 150, stage: "Basic", weakness: "Darkness", retreatCost: 2, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_129_EN.webp" },
  { id: "A1-012", name: "Articuno EX", set: "Genetic Apex", setCode: "A1", rarity: "Rare", type: "Water", hp: 140, stage: "Basic", weakness: "Lightning", retreatCost: 2, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_076_EN.webp" },
  { id: "A1-013", name: "Zapdos EX", set: "Genetic Apex", setCode: "A1", rarity: "Rare", type: "Lightning", hp: 130, stage: "Basic", weakness: "Lightning", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_104_EN.webp" },
  { id: "A1-014", name: "Moltres EX", set: "Genetic Apex", setCode: "A1", rarity: "Rare", type: "Fire", hp: 140, stage: "Basic", weakness: "Water", retreatCost: 2, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_046_EN.webp" },
  { id: "A1-015", name: "Pidgey", set: "Genetic Apex", setCode: "A1", rarity: "Common", type: "Colorless", hp: 60, stage: "Basic", weakness: "Lightning", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_206_EN.webp" },
  { id: "A1-016", name: "Pidgeotto", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Colorless", hp: 80, stage: "Stage 1", weakness: "Lightning", retreatCost: 1, evolvesFrom: "Pidgey", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_207_EN.webp" },
  { id: "A1-017", name: "Pidgeot", set: "Genetic Apex", setCode: "A1", rarity: "Rare", type: "Colorless", hp: 130, stage: "Stage 2", weakness: "Lightning", retreatCost: 1, evolvesFrom: "Pidgeotto", ability: "Drive Off", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_208_EN.webp" },
  { id: "A1-018", name: "Ralts", set: "Genetic Apex", setCode: "A1", rarity: "Common", type: "Psychic", hp: 60, stage: "Basic", weakness: "Darkness", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_131_EN.webp" },
  { id: "A1-019", name: "Kirlia", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Psychic", hp: 80, stage: "Stage 1", weakness: "Darkness", retreatCost: 1, evolvesFrom: "Ralts", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_132_EN.webp" },
  { id: "A1-020", name: "Gardevoir", set: "Genetic Apex", setCode: "A1", rarity: "Rare", type: "Psychic", hp: 110, stage: "Stage 2", weakness: "Darkness", retreatCost: 2, evolvesFrom: "Kirlia", ability: "Psy Shadow", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_133_EN.webp" },
  { id: "A1-021", name: "Grimer", set: "Genetic Apex", setCode: "A1", rarity: "Common", type: "Darkness", hp: 70, stage: "Basic", weakness: "Fighting", retreatCost: 2, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_166_EN.webp" },
  { id: "A1-022", name: "Weezing", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Darkness", hp: 110, stage: "Stage 1", weakness: "Fighting", retreatCost: 3, evolvesFrom: "Grimer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_167_EN.webp" },
  { id: "A1-023", name: "Vulpix", set: "Genetic Apex", setCode: "A1", rarity: "Common", type: "Fire", hp: 60, stage: "Basic", weakness: "Water", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_038_EN.webp" },
  { id: "A1-024", name: "Ninetales", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Fire", hp: 90, stage: "Stage 1", weakness: "Water", retreatCost: 1, evolvesFrom: "Vulpix", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_039_EN.webp" },
  { id: "A1-025", name: "Magmar", set: "Genetic Apex", setCode: "A1", rarity: "Common", type: "Fire", hp: 80, stage: "Basic", weakness: "Water", retreatCost: 2, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_050_EN.webp" },
  { id: "A1-026", name: "Farfetch'd", set: "Genetic Apex", setCode: "A1", rarity: "Common", type: "Colorless", hp: 60, stage: "Basic", weakness: "Lightning", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_211_EN.webp" },

  // --- TRAINERS / ITEMS / SUPPORTERS (Crucial for synergies/math) ---
  { id: "T-001", name: "Professor's Research", set: "Promo-A", setCode: "P-A", rarity: "Uncommon", type: "Supporter", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_222_EN.webp" },
  { id: "T-002", name: "Poké Ball", set: "Promo-A", setCode: "P-A", rarity: "Uncommon", type: "Item", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_218_EN.webp" },
  { id: "T-003", name: "X Speed", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Item", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_220_EN.webp" },
  { id: "T-004", name: "Potion", set: "Promo-A", setCode: "P-A", rarity: "Common", type: "Item", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_219_EN.webp" },
  { id: "T-005", name: "Sabrina", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Supporter", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_223_EN.webp" },
  { id: "T-006", name: "Giovanni", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Supporter", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_221_EN.webp" },
  { id: "T-007", name: "Blaine", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Supporter", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_224_EN.webp" },
  { id: "T-008", name: "Erika", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Supporter", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_225_EN.webp" },
  { id: "T-009", name: "Koga", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Supporter", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_226_EN.webp" },
  { id: "T-010", name: "Misty", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Supporter", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_227_EN.webp" },
  { id: "T-011", name: "Brock", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Supporter", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_228_EN.webp" },
  { id: "T-012", name: "Red Card", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Item", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_217_EN.webp" },
  { id: "T-013", name: "Hand Scope", set: "Genetic Apex", setCode: "A1", rarity: "Uncommon", type: "Item", stage: "Trainer", img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1/A1_216_EN.webp" },

  // --- MYTHICAL ISLAND (A1a) ---
  { id: "A1a-001", name: "Mew EX", set: "Mythical Island", setCode: "A1a", rarity: "Rare", type: "Psychic", hp: 130, stage: "Basic", weakness: "Darkness", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1A/A1A_034_EN.webp" },
  { id: "A1a-002", name: "Celebi EX", set: "Mythical Island", setCode: "A1a", rarity: "Rare", type: "Grass", hp: 130, stage: "Basic", weakness: "Fire", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1A/A1A_004_EN.webp" },
  { id: "A1a-003", name: "Aerodactyl", set: "Mythical Island", setCode: "A1a", rarity: "Uncommon", type: "Fighting", hp: 100, stage: "Stage 1", weakness: "Grass", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1A/A1A_045_EN.webp" },
  { id: "A1a-004", name: "Gyarados", set: "Mythical Island", setCode: "A1a", rarity: "Rare", type: "Water", hp: 150, stage: "Stage 1", weakness: "Lightning", retreatCost: 3, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1A/A1A_021_EN.webp" },
  { id: "A1a-005", name: "Magikarp", set: "Mythical Island", setCode: "A1a", rarity: "Common", type: "Water", hp: 30, stage: "Basic", weakness: "Lightning", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A1A/A1A_020_EN.webp" },

  // --- SPACE-TIME SMACKDOWN (A2) ---
  { id: "A2-001", name: "Dialga EX", set: "Space-Time Smackdown", setCode: "A2", rarity: "Rare", type: "Metal", hp: 150, stage: "Basic", weakness: "Fire", retreatCost: 3, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A2/A2_125_EN.webp" },
  { id: "A2-002", name: "Palkia EX", set: "Space-Time Smackdown", setCode: "A2", rarity: "Rare", type: "Water", hp: 150, stage: "Basic", weakness: "Lightning", retreatCost: 2, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A2/A2_039_EN.webp" },
  { id: "A2-003", name: "Garchomp", set: "Space-Time Smackdown", setCode: "A2", rarity: "Rare", type: "Dragon", hp: 160, stage: "Stage 2", weakness: "Colorless", retreatCost: 1, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A2/A2_138_EN.webp" },
  { id: "A2-004", name: "Lucario EX", set: "Space-Time Smackdown", setCode: "A2", rarity: "Rare", type: "Fighting", hp: 140, stage: "Stage 1", weakness: "Psychic", retreatCost: 2, img: "https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/A2/A2_094_EN.webp" }
];

// Helper to get card by name (for Gemini Vision fuzzy mapping)
function getCardByName(name) {
    if(!name) return null;
    const clean = name.toLowerCase().trim();
    return TCGP_CARDS.find(c => c.name.toLowerCase() === clean);
}

// Helper to get all Pokemon/Trainers
const getAllCards = () => TCGP_CARDS;
