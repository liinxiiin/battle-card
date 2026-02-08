import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Card } from "../types";
import { IMAGES, uniqueId } from "../constants";

const getScaler = (level: number) => {
  return {
    atk: 2 + Math.floor(level * 1.5),
    hp: 10 + Math.floor(level * 5),
    def: Math.floor(level * 0.5)
  };
};

const getRandomImage = () => {
  const options = Object.values(IMAGES);
  return options[Math.floor(Math.random() * options.length)];
};

export const generateEnemyWave = async (level: number, existingApiKey?: string): Promise<Card[]> => {
  const apiKey = process.env.API_KEY || existingApiKey;
  
  if (!apiKey) {
    console.warn("No API Key found, using procedural generation.");
    return generateProceduralWave(level);
  }

  const ai = new GoogleGenAI({ apiKey });
  const scaler = getScaler(level);
  
  const prompt = `
    Generate a team of enemy cards for a fantasy card game. 
    The player is at level ${level}. 
    Generate between 1 to ${Math.min(5, 1 + Math.ceil(level / 2))} enemies.
    The enemies should have a cohesive theme (e.g., Goblins, Undead, Robots, Elemental).
    
    Target Stats Reference:
    Average HP: ${scaler.hp}
    Average ATK: ${scaler.atk}
    Average DEF: ${scaler.def}
    
    Return a JSON array of objects with: name, description, hp, atk, def.
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        hp: { type: Type.INTEGER },
        atk: { type: Type.INTEGER },
        def: { type: Type.INTEGER },
      },
      required: ["name", "description", "hp", "atk", "def"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const rawEnemies = JSON.parse(response.text || "[]");
    
    if (!Array.isArray(rawEnemies) || rawEnemies.length === 0) {
      throw new Error("Invalid Gemini response");
    }

    return rawEnemies.map((e: any, index: number) => ({
      id: `enemy-l${level}-${index}-${uniqueId()}`,
      name: e.name,
      description: e.description,
      image: getRandomImage(),
      stats: {
        hp: e.hp,
        maxHp: e.hp,
        atk: e.atk,
        def: e.def,
      },
      isDead: false,
      color: '#ef4444'
    }));

  } catch (error) {
    console.error("Gemini generation failed, falling back to procedural.", error);
    return generateProceduralWave(level);
  }
};

const generateProceduralWave = (level: number): Card[] => {
  const count = Math.min(5, 1 + Math.floor(Math.random() * (level / 2)));
  const scaler = getScaler(level);
  const enemies: Card[] = [];
  const types = ['Rogue', 'Knight', 'Sorcerer', 'Bandit', 'Beast', 'Construct'];
  const type = types[Math.floor(Math.random() * types.length)];

  for (let i = 0; i < count; i++) {
    const hp = Math.floor(scaler.hp * (0.8 + Math.random() * 0.4));
    const atk = Math.max(1, Math.floor(scaler.atk * (0.8 + Math.random() * 0.4)));
    const def = Math.floor(scaler.def * (Math.random()));

    enemies.push({
      id: `enemy-proc-${level}-${i}-${uniqueId()}`,
      name: `${type} ${i + 1}`,
      description: `A wild ${type} appears.`,
      image: getRandomImage(),
      stats: { hp, maxHp: hp, atk, def },
      isDead: false,
      color: '#ef4444'
    });
  }
  return enemies;
};

export const generateShopInventory = (level: number): Card[] => {
    const count = 3;
    const scaler = getScaler(level);
    const shopItems: Card[] = [];
    const roles = [
        { name: 'Mercenary', img: IMAGES.SABER, desc: 'Balanced fighter' },
        { name: 'Apprentice', img: IMAGES.CASTER, desc: 'High magic damage' },
        { name: 'Guard', img: IMAGES.LANCER, desc: 'High defense' },
        { name: 'Ranger', img: IMAGES.ARCHER, desc: 'Ranged attacker' },
        { name: 'Cavalry', img: IMAGES.RIDER, desc: 'Fast attacker' }
    ];

    const COSTS = { BUY: 5 }; // Duplicated to avoid circular dep issues in cleanup, ideally imported

    for(let i=0; i<count; i++) {
        const role = roles[Math.floor(Math.random() * roles.length)];
        const hp = Math.floor(scaler.hp * (0.9 + Math.random() * 0.3));
        const atk = Math.max(1, Math.floor(scaler.atk * (0.9 + Math.random() * 0.3)));
        const def = Math.floor(scaler.def * (Math.random()));
        
        shopItems.push({
            id: `shop-${level}-${i}-${uniqueId()}`,
            name: role.name,
            description: role.desc,
            image: role.img,
            stats: { hp, maxHp: hp, atk, def },
            isDead: false,
            color: '#3b82f6',
            price: COSTS.BUY
        });
    }
    return shopItems;
};

export const generateRewardCard = async (level: number, existingApiKey?: string): Promise<Card> => {
  const apiKey = process.env.API_KEY || existingApiKey;
  const scaler = getScaler(level);
  scaler.atk += 2;
  scaler.hp += 10;
  
  if (!apiKey) {
      return {
        id: `reward-${uniqueId()}`,
        name: "Elite Saber",
        description: "A strong ally joined your ranks.",
        image: IMAGES.SABER,
        stats: { hp: scaler.hp, maxHp: scaler.hp, atk: scaler.atk, def: scaler.def + 1 },
        isDead: false,
        color: '#3b82f6'
      };
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Generate a single unique hero card for the player as a reward for beating level ${level}.
    It should be slightly stronger than average enemies.
    Theme: Heroic, Legendary, Magical.
    Target Stats: HP ~${scaler.hp}, ATK ~${scaler.atk}, DEF ~${scaler.def}.
    Return JSON: name, description, hp, atk, def.
  `;

  const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        hp: { type: Type.INTEGER },
        atk: { type: Type.INTEGER },
        def: { type: Type.INTEGER },
      },
      required: ["name", "description", "hp", "atk", "def"],
  };

  try {
     const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    const data = JSON.parse(response.text || "{}");
    return {
        id: `reward-${uniqueId()}`,
        name: data.name,
        description: data.description,
        image: getRandomImage(),
        stats: { hp: data.hp, maxHp: data.hp, atk: data.atk, def: data.def },
        isDead: false,
        color: '#eab308'
    };
  } catch (e) {
      return {
        id: `reward-${uniqueId()}`,
        name: "Veteran Lancer",
        description: "An experienced fighter.",
        image: IMAGES.LANCER,
        stats: { hp: scaler.hp, maxHp: scaler.hp, atk: scaler.atk, def: scaler.def + 1 },
        isDead: false,
        color: '#3b82f6'
      };
  }
}