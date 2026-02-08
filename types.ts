export interface CardStats {
  atk: number;
  def: number;
  hp: number;
  maxHp: number;
}

export interface Card {
  id: string;
  name: string;
  stats: CardStats;
  image: string;
  description?: string;
  isDead: boolean;
  color?: string;
  price?: number;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'damage' | 'heal' | 'death' | 'info';
}

export enum GameState {
  MENU = 'MENU',
  SHOP = 'SHOP',
  BATTLE = 'BATTLE',
  VICTORY = 'VICTORY',
  GAME_OVER = 'GAME_OVER',
  LOADING_NEXT = 'LOADING_NEXT'
}

export enum RewardType {
  NEW_CARD = 'NEW_CARD',
  BUFF_ATK = 'BUFF_ATK',
  BUFF_DEF = 'BUFF_DEF',
  HEAL_ALL = 'HEAL_ALL'
}

export interface Reward {
  type: RewardType;
  description: string;
  value?: number;
  cardData?: Card;
}