// TCG Pocket Card Database
// Source: https://tcgdex.dev/ (REST API)
// Updated: 2026-03-15

const TCGP_CARDS = [
  ...SET_A1,
  ...SET_A1A,
  ...SET_A2,
  ...SET_A2A,
  ...SET_A2B,
  ...SET_A3,
  ...SET_A3A,
  ...SET_A3B,
  ...SET_A4,
  ...SET_A4A,
  ...SET_B1,
  ...SET_B1A,
  ...SET_B2,
  ...SET_PA
];

// Helper function to get all cards
function getAllCards() {
    return TCGP_CARDS;
}
