import React, { useState } from 'react';
import { Card as CardType } from '../types';
import { Shield, Sword, Heart, Skull, User } from 'lucide-react';

interface CardProps {
  card: CardType;
  isFront: boolean;
  isDamageTaken?: boolean;
  damageValue?: number;
  isAttacking?: boolean;
}

const Card: React.FC<CardProps> = ({ card, isFront, isDamageTaken, damageValue, isAttacking }) => {
  const [imgError, setImgError] = useState(false);

  const hpPercent = Math.max(0, (card.stats.hp / card.stats.maxHp) * 100);
  let hpColor = 'bg-green-500';
  if (hpPercent < 50) hpColor = 'bg-yellow-500';
  if (hpPercent < 20) hpColor = 'bg-red-500';

  const getFallbackIcon = () => {
    const lowerName = card.name.toLowerCase();
    if (lowerName.includes('saber') || lowerName.includes('knight') || lowerName.includes('warrior')) return <Sword size={48} className="opacity-20 text-white" />;
    if (lowerName.includes('lancer') || lowerName.includes('guard')) return <Shield size={48} className="opacity-20 text-white" />;
    if (lowerName.includes('dead')) return <Skull size={48} className="opacity-20 text-white" />;
    return <User size={48} className="opacity-20 text-white" />;
  };

  return (
    <div 
      className={`
        relative w-32 h-48 md:w-40 md:h-56 rounded-xl border-4 shadow-lg flex flex-col overflow-hidden transition-all duration-300 bg-slate-800
        ${isFront ? 'scale-105 z-10 ring-4 ring-yellow-400/50' : 'scale-100 opacity-90'}
        ${isDamageTaken ? 'animate-shake' : ''}
        ${isAttacking ? 'translate-y-[-10px]' : ''}
        ${card.isDead ? 'grayscale opacity-50' : ''}
      `}
      style={{ 
        borderColor: card.color || '#475569',
      }}
    >
      <div className="absolute inset-0 z-0 bg-slate-700">
        {!imgError ? (
            <img 
                src={card.image} 
                alt={card.name} 
                onError={() => {
                    console.warn(`Failed to load image for ${card.name}: ${card.image}`);
                    setImgError(true);
                }}
                className="w-full h-full object-cover opacity-80" 
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                {getFallbackIcon()}
                <span className="absolute bottom-20 text-[10px] text-slate-500">Img Not Found</span>
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-2 justify-between">
        <div>
          <h3 className="text-xs md:text-sm font-bold text-white truncate drop-shadow-md font-fantasy tracking-wide">{card.name}</h3>
          <p className="text-[10px] text-gray-300 truncate">{card.description}</p>
        </div>

        <div className="mt-auto space-y-2">
          <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600 backdrop-blur-sm">
            <div 
              className={`h-full ${hpColor} transition-all duration-300 ease-out`} 
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-white px-1 drop-shadow-md">
             <span className="text-[10px]">{card.stats.hp}/{card.stats.maxHp}</span>
             <Heart size={12} className="text-red-400 fill-red-400" />
          </div>

          <div className="flex justify-between gap-1">
            <div className="flex-1 bg-slate-800/80 rounded p-1 flex items-center justify-center gap-1 border border-red-900/50 backdrop-blur-md">
              <Sword size={14} className="text-red-400" />
              <span className="text-white font-bold">{card.stats.atk}</span>
            </div>
            <div className="flex-1 bg-slate-800/80 rounded p-1 flex items-center justify-center gap-1 border border-blue-900/50 backdrop-blur-md">
              <Shield size={14} className="text-blue-400" />
              <span className="text-white font-bold">{card.stats.def}</span>
            </div>
          </div>
        </div>
      </div>

      {isDamageTaken && damageValue !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <span className="text-4xl font-extrabold text-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-float">
            -{damageValue}
          </span>
        </div>
      )}
    </div>
  );
};

export default Card;