import { Card, SUIT_COLORS, SUIT_SYMBOLS } from '@/types/game';
import { motion } from 'motion/react';
import React from 'react';
import { CheckCircle2, Lock, Ghost, Sparkles } from 'lucide-react';

interface CardProps {
  card: Card;
  onClick?: (card: Card) => void;
  disabled?: boolean;
  noRotation?: boolean;
  layoutId?: string;
  isMini?: boolean;
}

export const CardComponent: React.FC<CardProps & { index?: number, total?: number, className?: string }> = ({ 
  card, onClick, disabled, index = 0, total = 8, noRotation = false, layoutId, isMini = false, className = ""
}) => {
  // Fanning effect
  const mid = (total - 1) / 2;
  const rotate = noRotation ? 0 : (index - mid) * 4; 
  const translateY = noRotation ? 0 : Math.pow(Math.abs(index - mid), 2) * 1.5; 

  const isActuallyDisabled = disabled || card.isLocked;

  if (isMini) {
    return (
      <motion.div
        layoutId={layoutId}
        className={`
          flex items-center gap-1 px-2 py-1 rounded border font-mono font-black text-[10px]
          ${card.isJunk ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-900 border-white/20'}
          ${!card.isJunk && SUIT_COLORS[card.suit]}
          ${className}
        `}
      >
        <span>{SUIT_SYMBOLS[card.suit]}</span>
        <span>{card.rank}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      layoutId={layoutId}
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: translateY,
        rotate: rotate,
        zIndex: index,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        mass: 1,
      }}
      exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.2 } }}
      whileHover={!isActuallyDisabled ? { y: translateY - 20, scale: 1.05, zIndex: 100 } : {}}
      whileTap={!isActuallyDisabled ? { scale: 0.95 } : {}}
      onClick={() => !isActuallyDisabled && onClick?.(card)}
      className={`
        relative 
        w-16 h-24 sm:w-24 sm:h-32 md:w-28 md:h-40 
        rounded-lg sm:rounded-xl 
        border-[2px] cursor-pointer select-none
        flex flex-col shadow-xl shrink-0
        backdrop-blur-xl overflow-hidden transition-colors duration-200
        ${card.isSelected 
          ? 'bg-blue-600 border-blue-400 ring-2 ring-blue-400/60 shadow-[0_0_30px_rgba(59,130,246,0.4)]' 
          : 'bg-slate-900 border-white/10 hover:border-blue-500/50 hover:bg-slate-800 shadow-lg'}
        ${isActuallyDisabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
        ${card.isGlass ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : ''}
        ${card.isJunk ? 'grayscale border-slate-600 opacity-50' : ''}
        ${index === 0 ? 'ml-0' : '-ml-10 sm:-ml-14 md:-ml-16'}
        ${className}
      `}
    >
      {/* Glass Effect Overlay */}
      {card.isGlass && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none z-10" />
      )}

      {/* Junk Card Overlay */}
      {card.isJunk && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <Ghost size={60} />
        </div>
      )}

      {/* Top Left Rank & Suit */}
      <div className={`absolute top-2 left-2 flex flex-col items-center leading-none ${card.isHidden ? 'text-slate-400' : SUIT_COLORS[card.suit]} drop-shadow-[0_0_3px_rgba(0,0,0,0.5)]`}>
        <span className="text-sm sm:text-xl font-black font-mono">{card.isHidden ? '?' : card.rank}</span>
        <span className="text-[11px] sm:text-base">{card.isHidden ? '?' : SUIT_SYMBOLS[card.suit]}</span>
      </div>

      {/* Center Suit Symbol */}
      <div className="flex-1 flex items-center justify-center p-3">
        {card.isJunk ? (
          <span className="text-xs font-mono text-slate-400 uppercase tracking-tighter opacity-60 font-black">废牌</span>
        ) : (
          <span className={`text-5xl sm:text-7xl opacity-20 ${card.isHidden ? 'text-slate-400' : SUIT_COLORS[card.suit]} drop-shadow-[0_0_15px_currentColor]`}>
            {card.isHidden ? '?' : SUIT_SYMBOLS[card.suit]}
          </span>
        )}
      </div>

      {/* Bottom Right Rank & Suit (Inverted) */}
      <div className={`absolute bottom-2 right-2 flex flex-col items-center leading-none rotate-180 ${card.isHidden ? 'text-slate-400' : SUIT_COLORS[card.suit]} drop-shadow-[0_0_3px_rgba(0,0,0,0.5)]`}>
        <span className="text-sm sm:text-xl font-black font-mono">{card.isHidden ? '?' : card.rank}</span>
        <span className="text-[11px] sm:text-base">{card.isHidden ? '?' : SUIT_SYMBOLS[card.suit]}</span>
      </div>
      
      {/* Selection Indicator */}
      {card.isSelected && !card.isLocked && (
        <div className="absolute top-1 right-1 text-blue-200 animate-in zoom-in duration-200">
          <CheckCircle2 size={16} fill="currentColor" className="text-blue-600" />
        </div>
      )}

      {/* Locked Indicator */}
      {card.isLocked && (
        <div className="absolute top-1 right-1 text-rose-500 animate-in zoom-in duration-200">
          <Lock size={16} />
        </div>
      )}

      {/* Glass Indicator */}
      {card.isGlass && (
        <div className="absolute bottom-1 left-1 text-cyan-300 animate-pulse">
          <Sparkles size={12} />
        </div>
      )}
      
      {/* Selection Overlay */}
      {card.isSelected && (
        <div className="absolute inset-0 bg-blue-400/10 pointer-events-none" />
      )}
    </motion.div>
  );
}
