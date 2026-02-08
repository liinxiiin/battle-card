import React, { useState, useEffect, useCallback, useRef } from 'react';
import BattleField from './components/BattleField.js';
import GameUI from './components/GameUI.js';
import { GameState } from './types.js';
import { INITIAL_PLAYER_CARD, MAX_SQUAD_SIZE, uniqueId, COSTS, INITIAL_GOLD, GOLD_PER_WIN } from './constants.js';
import { generateEnemyWave, generateShopInventory } from './services/geminiService.js';

const App = () => {
  const [gameState, setGameState] = useState(GameState.MENU);
  const [level, setLevel] = useState(1);
  const [gold, setGold] = useState(INITIAL_GOLD);
  const [logs, setLogs] = useState([]);
  
  // Decks
  const [playerDeck, setPlayerDeck] = useState([]);
  const [enemyDeck, setEnemyDeck] = useState([]);
  const [shopInventory, setShopInventory] = useState([]);
  
  // Combat Animation State
  const [lastAction, setLastAction] = useState(null);
  const [attackingIds, setAttackingIds] = useState([]);
  
  // Rewards (kept unused for structure)
  const [currentRewards, setCurrentRewards] = useState([]);

  // Timer Ref
  const combatTimer = useRef(null);

  // Helper to add log
  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev.slice(-49), { id: uniqueId(), message: msg, type }]);
  }, []);

  // --- Shop Functions ---
  
  const handleBuyUnit = (card) => {
    if (gold >= COSTS.BUY && playerDeck.length < MAX_SQUAD_SIZE) {
        setGold(prev => prev - COSTS.BUY);
        setPlayerDeck(prev => [...prev, { ...card, id: `bought-${uniqueId()}` }]);
        // Remove from shop
        setShopInventory(prev => prev.filter(c => c.id !== card.id));
    }
  };

  const handleUpgradeUnit = (cardId) => {
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

  const handleSquadReorder = (fromIndex, toIndex) => {
    const newDeck = [...playerDeck];
    const [movedItem] = newDeck.splice(fromIndex, 1);
    newDeck.splice(toIndex, 0, movedItem);
    setPlayerDeck(newDeck);
  };

  const handleNextBattle = async () => {
      setGameState(GameState.LOADING_NEXT);
      // Generate enemies for current level
      const enemies = await generateEnemyWave(level);
      setEnemyDeck(enemies);
      setGameState(GameState.BATTLE);
      addLog(`Battle started! Level ${level}`, 'info');
  };

  // --- Game Loop Functions ---

  const startGame = async () => {
    setGameState(GameState.LOADING_NEXT);
    // Initialize Player Deck with full health
    setPlayerDeck([{ ...INITIAL_PLAYER_CARD, id: `hero-start-${uniqueId()}` }]);
    setLevel(1);
    setGold(INITIAL_GOLD);
    setLogs([]);
    
    // Initial Shop Prep
    setShopInventory(generateShopInventory(1));
    setGameState(GameState.SHOP);
  };

  const startNextLevel = async () => {
    setGameState(GameState.LOADING_NEXT);
    const nextLevel = level + 1;
    setLevel(nextLevel);
    
    // Prepare Shop for next level
    setShopInventory(generateShopInventory(nextLevel));
    
    // FULL RESTORE: Revive dead units and heal everyone to max
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

  // --- Combat Logic ---

  const executeTurn = useCallback(() => {
    if (gameState !== GameState.BATTLE) return;

    // Filter live units
    const livePlayers = playerDeck.filter(c => !c.isDead);
    const liveEnemies = enemyDeck.filter(c => !c.isDead);

    // Check Win/Loss conditions
    if (livePlayers.length === 0) {
      setGameState(GameState.GAME_OVER);
      return;
    }
    if (liveEnemies.length === 0) {
      handleVictory();
      return;
    }

    // Identify Combatants
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


  // --- Victory Logic ---

  const handleVictory = () => {
    // Stop combat immediately
    setGameState(GameState.VICTORY);
    // Award Gold
    setGold(prev => prev + GOLD_PER_WIN);
    addLog(`Victory! Earned ${GOLD_PER_WIN} Gold.`, 'info');
    setCurrentRewards([]);
  };

  // Used for selecting rewards (kept for compatibility or future use, currently unused in UI)
  const handleSelectReward = (reward) => {
    // Legacy support if needed later
    startNextLevel();
  };

  // --- Effects ---

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
        
        {/* Main Battle Scene */}
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