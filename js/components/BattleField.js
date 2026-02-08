import React from 'react';
import CardComponent from './Card.js';
import { Skull } from 'lucide-react';

const BattleField = ({ playerDeck, enemyDeck, lastAction, attackingIds }) => {
  
  const deadPlayers = playerDeck.filter(c => c.isDead).length;
  const deadEnemies = enemyDeck.filter(c => c.isDead).length;

  return (
    <div className="flex flex-col md:flex-row w-full h-full items-center justify-between gap-4 md:gap-12 px-2 md:px-12 py-4">
      
      {/* Player Side (Left) */}
      <div className="flex-1 w-full flex flex-col items-center md:items-end">
        <h2 className="text-blue-400 font-fantasy text-xl mb-4 flex items-center gap-2">
          Your Squad
          {deadPlayers > 0 && <span className="text-xs text-slate-500 flex items-center"><Skull size={12}/> {deadPlayers} dead</span>}
        </h2>
        
        <div className="flex flex-row items-center justify-center md:justify-end gap-2 md:gap-[-20px] perspective-1000 min-h-[240px]">
          {playerDeck.filter(c => !c.isDead).map((card, idx, arr) => {
            const isFront = idx === arr.length - 1;
            const isAttacking = attackingIds.includes(card.id);
            const isHit = lastAction?.targetId === card.id;
            
            return (
              <div key={card.id} className="transition-all duration-500" style={{ zIndex: idx }}>
                <CardComponent 
                  card={card} 
                  isFront={isFront}
                  isAttacking={isAttacking}
                  isDamageTaken={isHit}
                  damageValue={isHit ? lastAction?.damage : 0}
                />
              </div>
            );
          })}
          {playerDeck.every(c => c.isDead) && (
             <div className="text-slate-500 italic">No units left...</div>
          )}
        </div>
      </div>

      {/* VS Badge / Center Divider */}
      <div className="md:h-64 w-full md:w-px bg-slate-700/50 flex items-center justify-center relative my-4 md:my-0">
         <div className="absolute bg-slate-900 border-2 border-slate-600 rounded-full p-2 w-12 h-12 flex items-center justify-center z-20 shadow-xl">
            <span className="font-fantasy font-bold text-slate-400">VS</span>
         </div>
      </div>

      {/* Enemy Side (Right) */}
      <div className="flex-1 w-full flex flex-col items-center md:items-start">
        <h2 className="text-red-400 font-fantasy text-xl mb-4 flex items-center gap-2">
          Enemy Forces
           {deadEnemies > 0 && <span className="text-xs text-slate-500 flex items-center"><Skull size={12}/> {deadEnemies} dead</span>}
        </h2>
        
        <div className="flex flex-row items-center justify-center md:justify-start gap-2 md:gap-[-20px] perspective-1000 min-h-[240px]">
          {enemyDeck.filter(c => !c.isDead).map((card, idx) => {
             // For enemy, index 0 is front.
            const isFront = idx === 0;
            const isAttacking = attackingIds.includes(card.id);
            const isHit = lastAction?.targetId === card.id;

            return (
              <div key={card.id} className="transition-all duration-500" style={{ zIndex: 10 - idx }}>
                <CardComponent 
                  card={card} 
                  isFront={isFront}
                  isAttacking={isAttacking}
                  isDamageTaken={isHit}
                  damageValue={isHit ? lastAction?.damage : 0}
                />
              </div>
            );
          })}
           {enemyDeck.every(c => c.isDead) && (
             <div className="text-slate-500 italic">No enemies left...</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default BattleField;