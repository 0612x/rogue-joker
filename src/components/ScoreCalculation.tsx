import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScoreBreakdown, Card, HAND_TYPE_NAMES, HandType } from '@/types/game';
import { CardComponent } from '@/components/Card';

interface ScoreCalculationProps {
  breakdown: ScoreBreakdown;
  cards: Card[];
  handName?: string;
  onComplete: () => void;
}

export default function ScoreCalculation({ breakdown, cards, handName, onComplete }: ScoreCalculationProps) {
  // State for the displayed numbers
  const [displayChips, setDisplayChips] = useState(0);
  const [displayMult, setDisplayMult] = useState(0);
  const [displayTotal, setDisplayTotal] = useState<number | null>(null);
  
  // State for the animation sequence
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [showTotal, setShowTotal] = useState(false);

  // Pulse states for score counters
  const [chipsPulse, setChipsPulse] = useState(false);
  const [multPulse, setMultPulse] = useState(false);

  // Refs for audio/timing management if needed (using timeouts for now)
  const timeouts = useRef<NodeJS.Timeout[]>([]);

  const addTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeouts.current.push(id);
    return id;
  };

  useEffect(() => {
    // 0. Initial Setup
    // Get Base Chips/Mult from breakdown (assuming index 0 is always Base)
    const baseChips = breakdown.chipBreakdown[0]?.value || 0;
    const baseMult = breakdown.multBreakdown[0]?.value || 0;

    setDisplayChips(0);
    setDisplayMult(0);

    // 1. Reveal Base Score (Hand Type)
    addTimeout(() => {
      setDisplayChips(baseChips);
      setDisplayMult(baseMult);
      setChipsPulse(true);
      setMultPulse(true);
      setTimeout(() => { setChipsPulse(false); setMultPulse(false); }, 200);
    }, 300);

    // 2. Animate Cards (One by one)
    let currentTime = 500;
    const cardInterval = 400; // Faster animation

    cards.forEach((card, index) => {
      addTimeout(() => {
        // Highlight Card
        setActiveCardIndex(index);
        
        // Schedule Score Update
        addTimeout(() => {
            // Add Card Value to Chips
            setDisplayChips(prev => prev + card.value);
            setChipsPulse(true);
            setTimeout(() => setChipsPulse(false), 200);

            // Handle Glass Card (x2 Mult)
            if (card.isGlass) {
                setDisplayMult(prev => prev * 2);
                setMultPulse(true);
                setTimeout(() => setMultPulse(false), 200);
            }
        }, 150); 

        // TODO: specific card mult effects could be handled here
      }, currentTime);

      // Clear Highlight
      addTimeout(() => {
        setActiveCardIndex(null);
      }, currentTime + 300);

      currentTime += cardInterval;
    });

    // 3. Finalize Chips/Mult (Sync with actual totals to be safe)
    addTimeout(() => {
      setDisplayChips(breakdown.chips);
      setDisplayMult(breakdown.mult);
    }, currentTime + 100);

    // 4. Calculate Total (The "Bang")
    addTimeout(() => {
      setShowTotal(true);
      setDisplayTotal(breakdown.total);
    }, currentTime + 300);

    // 5. Complete
    addTimeout(() => {
      onComplete();
    }, currentTime + 1500);

    return () => {
      timeouts.current.forEach(clearTimeout);
    };
  }, [breakdown, cards, onComplete]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none p-4">
      
      {/* Score Board Panel */}
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className={`
            relative bg-slate-900/90 border border-white/10 p-4 sm:p-6 rounded-3xl 
            shadow-2xl backdrop-blur-xl flex flex-col items-center gap-2 min-w-[300px] max-w-[90vw] overflow-hidden transition-all duration-500
            ${showTotal ? 'border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.3)]' : ''}
        `}
      >
        {/* Hand Name */}
        {handName && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg sm:text-xl font-black text-white uppercase tracking-widest mb-2 z-10 text-center"
            >
                {HAND_TYPE_NAMES[handName as HandType] || handName}
            </motion.div>
        )}

        {/* Played Cards Display - Integrated as Mini Code Blocks */}
        <div className="flex gap-1 sm:gap-1.5 items-center justify-center h-12 sm:h-16 w-full z-20 my-4">
            {cards.map((card, index) => {
            const isActive = activeCardIndex === index;
            
            return (
                <motion.div
                key={card.id}
                layoutId={card.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                    scale: isActive ? 1.2 : 1,
                    opacity: 1,
                    zIndex: isActive ? 50 : 1
                }}
                className="relative"
                >
                <CardComponent card={card} isMini={true} layoutId={card.id} />
                
                {/* Floating Score Text */}
                <AnimatePresence>
                    {isActive && (
                        <motion.div 
                            initial={{ opacity: 0, y: 0, scale: 0.5 }}
                            animate={{ opacity: 1, y: -30, scale: 1.2 }}
                            exit={{ opacity: 0, y: -40, scale: 1 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap flex flex-col items-center"
                        >
                            <div className="text-sm font-black text-blue-400 drop-shadow-md">
                                +{card.value}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                </motion.div>
            );
            })}
        </div>

        {/* Score Equation */}
        <div className="flex items-center gap-3 sm:gap-6 text-2xl sm:text-4xl font-black font-mono z-10 bg-black/20 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl border border-white/5 w-full justify-center">
          {/* Chips */}
          <div className="flex flex-col items-center group">
            <motion.span 
                key={displayChips}
                animate={{ 
                    scale: chipsPulse ? 1.3 : 1,
                    color: chipsPulse ? '#fff' : '#60a5fa',
                }}
                transition={{ duration: 0.1 }}
                className="text-blue-400"
            >
                {displayChips}
            </motion.span>
            <span className="text-[8px] sm:text-[10px] text-blue-400/60 font-sans font-bold tracking-widest uppercase mt-1">筹码</span>
          </div>

          <span className="text-slate-600 text-xl sm:text-2xl">X</span>

          {/* Mult */}
          <div className="flex flex-col items-center">
            <motion.span 
                key={displayMult}
                animate={{ 
                    scale: multPulse ? 1.3 : 1,
                    color: multPulse ? '#fff' : '#f43f5e',
                }}
                transition={{ duration: 0.1 }}
                className="text-rose-500"
            >
                {displayMult}
            </motion.span>
            <span className="text-[8px] sm:text-[10px] text-rose-500/60 font-sans font-bold tracking-widest uppercase mt-1">倍率</span>
          </div>
        </div>

        {/* Total Display */}
        <div className="h-20 sm:h-24 flex items-center justify-center z-10 w-full mt-2 relative">
            <AnimatePresence mode="wait">
            {showTotal && (
                <motion.div 
                initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1.2, filter: 'blur(0px)' }}
                className="flex flex-col items-center"
                >
                    <div className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 drop-shadow-lg filter">
                        {displayTotal}
                    </div>
                    <div className="text-[10px] text-amber-500/80 font-bold tracking-[0.2em] uppercase mt-1">总评分</div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
