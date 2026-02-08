export const MAX_SQUAD_SIZE = 5;

// Economy
export const INITIAL_GOLD = 10;
export const COSTS = {
  REROLL: 2,
  BUY: 5,
  UPGRADE: 4
};
export const GOLD_PER_WIN = 5;

// Local assets map
// IMPORTANT: Ensure you have an 'img' folder in your root directory.
export const IMAGES = {
  SABER: 'img/saber.png',
  ARCHER: 'img/archer.png',
  LANCER: 'img/lancer.png',
  RIDER: 'img/rider.png',
  CASTER: 'img/caster.png'
};

export const INITIAL_PLAYER_CARD = {
  id: 'hero-1',
  name: 'Novice Saber',
  stats: {
    atk: 3,
    def: 1,
    hp: 20,
    maxHp: 20,
  },
  image: IMAGES.SABER,
  description: 'A brave starter unit.',
  isDead: false,
  color: '#3b82f6' // Blue
};

export const SAMPLE_ENEMIES = [
  {
    id: 'enemy-1',
    name: 'Stray Rider',
    stats: { atk: 2, def: 0, hp: 10, maxHp: 10 },
    image: IMAGES.RIDER,
    isDead: false,
    color: '#ef4444'
  },
  {
    id: 'enemy-2',
    name: 'Dark Lancer',
    stats: { atk: 4, def: 1, hp: 15, maxHp: 15 },
    image: IMAGES.LANCER,
    isDead: false,
    color: '#a3a3a3'
  }
];

export const uniqueId = () => Math.random().toString(36).substr(2, 9);