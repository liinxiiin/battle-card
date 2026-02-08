import React, { useState, useEffect, useCallback, useRef } from 'react';
import BattleField from './components/BattleField';
import GameUI from './components/GameUI';
import { Card, GameState, LogEntry, Reward } from './types';
import { INITIAL_PLAYER_CARD, MAX_SQUAD_SIZE, uniqueId, COSTS, INITIAL_GOLD, GOLD_PER_WIN } from './constants';
import { generateEnemyWave, generateShopInventory } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [level, setLevel] = useState(1);
  const [gold, setGold] = useState(INITIAL_GOLD);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [enemyDeck, setEnemyDeck] = useState<Card[]>([]);
  const [shopInventory, setShopInventory] = useState<Card[]>([]);
  
  const [lastAction, setLastAction] = useState<{targetId: string; damage: number; type: 'attack'} | null>(null);
  const [attackingIds, setAttackingIds] = useState<string[]>([]);
  
  const [currentRewards, setCurrentRewards] = useState<Reward[]>([]);
  const combatTimer = useRef<number | null>(null);

  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-49), { id: uniqueId(), message: msg, type }]);
  }, []);

  const handleBuyUnit = (card: Card) => {
    if (gold >= COSTS.BUY && playerDeck.length < MAX_SQUAD_SIZE) {
        setGold(prev => prev - COSTS.BUY);
        setPlayerDeck(prev => [...prev, { ...card, id: `bought-${uniqueId()}` }]);
        setShopInventory(prev => prev.filter(c => c.id !== card.id));
    }
  };

  const handleUpgradeUnit = (cardId: string) => {
    if (gold >= COSTS.UPGRADE) {
        setGold(prev => prev - COSTS.UPGRADE);
        setPlayerDeck(prev => prev.map(c => {
            if (c.id === cardId) {
                return {
                    ...c,
                    stats: {
                        ...c.stats,
                        atk: c.stats.atk + 1,
                        def: c.stats.def + 1,
                        hp: c.stats.hp + 5,
                        maxHp: c.stats.maxHp + 5
                    }
                };
            }
            return c;
        }));
    }
  };

  const handleRerollShop = () => {
    if (gold >= COSTS.REROLL) {
        setGold(prev => prev - COSTS.REROLL);
        setShopInventory(generateShopInventory(level));
    }
  };

  const handleSquadReorder = (fromIndex: number, toIndex: number) => {
    const newDeck = [...playerDeck];
    const [movedItem] = newDeck.splice(fromIndex, 1);
    newDeck.splice(toIndex, 0, movedItem);
    setPlayerDeck(newDeck);
  };

  const handleNextBattle = async () => {
      setGameState(GameState.LOADING_NEXT);
      const enemies = await generateEnemyWave(level);
      setEnemyDeck(enemies);
      setGameState(GameState.BATTLE);
      addLog(`Battle started! Level ${level}`, 'info');
  };

  const startGame = async () => {
    setGameState(GameState.LOADING_NEXT);
    setPlayerDeck([{ ...INITIAL_PLAYER_CARD, id: `hero-start-${uniqueId()}` }]);
    setLevel(1);
    setGold(INITIAL_GOLD);
    setLogs([]);
    setShopInventory(generateShopInventory(1));
    setGameState(GameState.SHOP);
  };

  const startNextLevel = async () => {
    setGameState(GameState.LOADING_NEXT);
    const nextLevel = level + 1;
    setLevel(nextLevel);
    setShopInventory(generateShopInventory(nextLevel));
    setPlayerDeck(prev => prev.map(c => ({
        ...c,
        isDead: false,
        stats: { ...c.stats, hp: c.stats.maxHp }
    })));
    addLog("Units rested and restored.", 'heal');
    setGameState(GameState.SHOP);
  };

  const resetGame = () => {
    setGameState(GameState.MENU);
    if (combatTimer.current) clearInterval(combatTimer.current);
    setPlayerDeck([]);
    setEnemyDeck([]);
  };

  const executeTurn = useCallback(() => {
    if (gameState !== GameState.BATTLE) return;

    const livePlayers = playerDeck.filter(c => !c.isDead);
    const liveEnemies = enemyDeck.filter(c => !c.isDead);

    if (livePlayers.length === 0) {
      setGameState(GameState.GAME_OVER);
      return;
    }
    if (liveEnemies.length === 0) {
      handleVictory();
      return;
    }

    let playerFrontIndex = -1;
    for (let i = playerDeck.length - 1; i >= 0; i--) {
      if (!playerDeck[i].isDead) {
        playerFrontIndex = i;
        break;
      }
    }

    let enemyFrontIndex = -1;
    for (let i = 0; i < enemyDeck.length; i++) {
      if (!enemyDeck[i].isDead) {
        enemyFrontIndex = i;
        break;
      }
    }

    if (playerFrontIndex === -1 || enemyFrontIndex === -1) return;

    const playerUnit = playerDeck[playerFrontIndex];
    const enemyUnit = enemyDeck[enemyFrontIndex];

    setAttackingIds([playerUnit.id, enemyUnit.id]);
    setTimeout(() => setAttackingIds([]), 300);

    const pDmg = Math.max(1, playerUnit.stats.atk - enemyUnit.stats.def);
    const eDmg = Math.max(1, enemyUnit.stats.atk - playerUnit.stats.def);

    const newPlayerDeck = [...playerDeck];
    const newEnemyDeck = [...enemyDeck];

    const pTarget = newPlayerDeck[playerFrontIndex];
    pTarget.stats.hp -= eDmg;
    addLog(`${enemyUnit.name} attacks ${pTarget.name} for ${eDmg} dmg`, 'damage');
    setLastAction({ targetId: pTarget.id, damage: eDmg, type: 'attack' });
    
    if (pTarget.stats.hp <= 0) {
      pTarget.stats.hp = 0;
      pTarget.isDead = true;
      addLog(`${pTarget.name} has fallen!`, 'death');
    }

    const eTarget = newEnemyDeck[enemyFrontIndex];
    eTarget.stats.hp -= pDmg;
    
    setTimeout(() => {
        setLastAction({ targetId: eTarget.id, damage: pDmg, type: 'attack' });
    }, 100);

    addLog(`${playerUnit.name} attacks ${eTarget.name} for ${pDmg} dmg`, 'damage');
    
    if (eTarget.stats.hp <= 0) {
      eTarget.stats.hp = 0;
      eTarget.isDead = true;
      addLog(`${eTarget.name} destroyed!`, 'death');
    }

    setPlayerDeck(newPlayerDeck);
    setEnemyDeck(newEnemyDeck);

    setTimeout(() => setLastAction(null), 800);

  }, [gameState, playerDeck, enemyDeck, addLog]);

  const handleVictory = () => {
    setGameState(GameState.VICTORY);
    setGold(prev => prev + GOLD_PER_WIN);
    addLog(`Victory! Earned ${GOLD_PER_WIN} Gold.`, 'info');
    setCurrentRewards([]);
  };

  const handleSelectReward = (reward: Reward) => {
    startNextLevel();
  };

  useEffect(() => {
    if (gameState === GameState.BATTLE) {
      combatTimer.current = window.setInterval(executeTurn, 1500); 
    } else {
      if (combatTimer.current) clearInterval(combatTimer.current);
    }
    return () => {
      if (combatTimer.current) clearInterval(combatTimer.current);
    };
  }, [gameState, executeTurn]);

  return (
    <div className="relative w-full h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden flex flex-col">
      <div className="flex-1 relative flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2560&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]"></div>
        <div className="z-10 w-full h-full max-w-7xl mx-auto flex flex-col pb-48">
             <BattleField 
               playerDeck={playerDeck} 
               enemyDeck={enemyDeck} 
               lastAction={lastAction}
               attackingIds={attackingIds}
             />
        </div>
      </div>

      <GameUI 
        gameState={gameState} 
        logs={logs} 
        level={level}
        gold={gold}
        playerDeck={playerDeck}
        shopInventory={shopInventory}
        onStart={startGame}
        onReset={resetGame}
        onSelectReward={handleSelectReward}
        onContinue={startNextLevel} 
        rewards={currentRewards}
        onBuyUnit={handleBuyUnit}
        onUpgradeUnit={handleUpgradeUnit}
        onRerollShop={handleRerollShop}
        onNextBattle={handleNextBattle}
        onSquadReorder={handleSquadReorder}
      />
    </div>
  );
};

export default App;