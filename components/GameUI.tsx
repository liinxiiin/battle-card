import React, { useState } from 'react';
import { GameState, LogEntry, Reward, Card } from '../types';
import { Play, RotateCcw, ShieldPlus, Sword, ShoppingCart, ArrowRight, Coins, RefreshCw, CircleArrowUp, MoveHorizontal } from 'lucide-react';
import CardComponent from './Card';
import { COSTS, MAX_SQUAD_SIZE } from '../constants';

interface GameUIProps {
  gameState: GameState;
  logs: LogEntry[];
  level: number;
  gold: number;
  playerDeck: Card[];
  shopInventory: Card[];
  onStart: () => void;
  onReset: () => void;
  onSelectReward: (r: Reward) => void;
  onContinue: () => void;
  rewards: Reward[];
  onBuyUnit: (card: Card) => void;
  onUpgradeUnit: (cardId: string) => void;
  onRerollShop: () => void;
  onNextBattle: () => void;
  onSquadReorder: (fromIndex: number, toIndex: number) => void;
}

const GameUI: React.FC<GameUIProps> = ({ 
  gameState, logs, level, gold, playerDeck, shopInventory,
  onStart, onReset, onSelectReward, onContinue, rewards,
  onBuyUnit, onUpgradeUnit, onRerollShop, onNextBattle, onSquadReorder
}) => {
  const logContainerRef = React.useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onSquadReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl md:text-6xl font-fantasy text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-8 animate-pulse">
          Eternal Frontline
        </h1>
        <p className="text-slate-400 mb-8 max-w-md text-center">
          Command your squad. Defeat endless waves. How far can you go?
        </p>
        <button 
          onClick={onStart}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all flex items-center gap-2 text-xl"
        >
          <Play fill="currentColor" /> Start Game
        </button>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-5xl font-fantasy text-red-500 mb-4">DEFEAT</h2>
        <p className="text-xl text-slate-300 mb-8">You survived until Level {level}.</p>
        <button 
          onClick={onReset}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded flex items-center gap-2"
        >
          <RotateCcw size={20} /> Try Again
        </button>
      </div>
    );
  }

  if (gameState === GameState.SHOP) {
      return (
        <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center bg-slate-800 p-4 border-b border-slate-700 shadow-lg shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-fantasy text-yellow-500 flex items-center gap-2">
                        <ShoppingCart /> Preparation Phase
                    </h2>
                    <span className="text-slate-400 text-sm border-l border-slate-600 pl-4">Level {level} Incoming</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-yellow-600/50">
                        <Coins className="text-yellow-400" />
                        <span className="text-2xl font-bold text-yellow-400">{gold}</span>
                    </div>
                    <button 
                        onClick={onNextBattle}
                        className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:shadow-red-900/50 transition-all animate-pulse"
                    >
                        Start Battle <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col min-h-[320px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-green-300 flex items-center gap-2">
                            <ShieldPlus size={20}/> Your Squad <span className="text-sm font-normal text-slate-400">({playerDeck.length}/{MAX_SQUAD_SIZE})</span>
                        </h3>
                        <div className="text-slate-400 text-xs flex items-center gap-2">
                           <MoveHorizontal size={14}/> Drag to reorder • Left: Backline • Right: Frontline
                        </div>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-700 relative p-4">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 font-bold uppercase tracking-widest text-xs [writing-mode:vertical-lr] rotate-180">
                            Rear
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-600 font-bold uppercase tracking-widest text-xs [writing-mode:vertical-lr] rotate-180">
                            Front / Atk
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 md:gap-4 z-10">
                            {playerDeck.map((card, index) => {
                                const isFront = index === playerDeck.length - 1;
                                return (
                                    <div 
                                        key={card.id} 
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(index)}
                                        className={`flex flex-col gap-2 relative group cursor-move transition-transform ${draggedIndex === index ? 'opacity-50 scale-95' : 'hover:scale-105'}`}
                                    >
                                        <CardComponent card={card} isFront={isFront} />
                                        
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onUpgradeUnit(card.id); }}
                                            disabled={gold < COSTS.UPGRADE}
                                            className={`w-full py-1.5 rounded-lg font-bold text-[10px] md:text-xs flex items-center justify-center gap-1 transition-colors ${
                                                gold >= COSTS.UPGRADE
                                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                            }`}
                                        >
                                            <CircleArrowUp size={12} /> Train ({COSTS.UPGRADE}G)
                                        </button>
                                        
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-400 text-[10px] px-2 rounded-full border border-slate-600">
                                            {index + 1}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {playerDeck.length === 0 && (
                                <div className="text-slate-500 italic text-center">
                                    Your squad is empty. Recruit units below!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-blue-300 flex items-center gap-2">
                           <Sword size={20}/> Recruitment <span className="text-sm font-normal text-slate-400">({COSTS.BUY} Gold)</span>
                        </h3>
                        <button 
                            onClick={onRerollShop}
                            disabled={gold < COSTS.REROLL}
                            className={`text-sm flex items-center gap-1 px-3 py-1 rounded border transition-colors ${
                                gold >= COSTS.REROLL 
                                ? 'bg-slate-700 hover:bg-slate-600 border-slate-500 text-white' 
                                : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            <RefreshCw size={14}/> Reroll ({COSTS.REROLL}G)
                        </button>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        {shopInventory.map((card) => (
                            <div key={card.id} className="flex flex-col gap-2">
                                <CardComponent card={card} isFront={false} />
                                <button
                                    onClick={() => onBuyUnit(card)}
                                    disabled={gold < COSTS.BUY || playerDeck.length >= MAX_SQUAD_SIZE}
                                    className={`w-full py-2 rounded font-bold text-sm transition-colors ${
                                        gold >= COSTS.BUY && playerDeck.length < MAX_SQUAD_SIZE
                                        ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow'
                                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                                >
                                    {playerDeck.length >= MAX_SQUAD_SIZE ? 'Full' : `Hire (${COSTS.BUY}G)`}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  if (gameState === GameState.VICTORY) {
    return (
      <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-6xl font-fantasy text-yellow-400 mb-6 drop-shadow-lg">Victory!</h2>
        
        <div className="flex flex-col items-center gap-4 bg-slate-800 p-8 rounded-2xl border border-yellow-600/30 shadow-2xl max-w-md w-full">
            <div className="text-yellow-200 text-xl font-bold flex items-center gap-3 bg-slate-900/50 px-6 py-3 rounded-full border border-yellow-700/50">
                <Coins size={24} className="text-yellow-400"/> 
                <span>Reward: +5 Gold</span>
            </div>
            
            <p className="text-slate-400 text-center my-4">
                The enemy has been vanquished. Return to base to rest, recruit new heroes, and prepare for the next wave.
            </p>

            <button 
                onClick={onContinue}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
                Visit Shop <ArrowRight size={20} />
            </button>
        </div>
      </div>
    );
  }
  
  if (gameState === GameState.LOADING_NEXT) {
      return (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-white font-fantasy text-xl">Scouting next wave...</p>
        </div>
      )
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 bg-slate-900/90 border-t border-slate-700 p-4 flex gap-4 backdrop-blur-sm z-40">
      <div className="flex flex-col items-center justify-center px-6 border-r border-slate-700">
        <span className="text-xs text-slate-400 uppercase tracking-widest">Level</span>
        <span className="text-4xl font-fantasy text-white">{level}</span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <h3 className="text-xs text-slate-400 uppercase tracking-widest mb-2">Combat Log</h3>
        <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-1 pr-2 font-mono text-xs md:text-sm">
          {logs.map((log) => (
            <div key={log.id} className={`
              ${log.type === 'damage' ? 'text-red-300' : ''}
              ${log.type === 'heal' ? 'text-green-300' : ''}
              ${log.type === 'death' ? 'text-slate-500 line-through' : ''}
              ${log.type === 'info' ? 'text-blue-300' : ''}
            `}>
              {log.message}
            </div>
          ))}
          {logs.length === 0 && <span className="text-slate-600 italic">Waiting for combat...</span>}
        </div>
      </div>
    </div>
  );
};

export default GameUI;