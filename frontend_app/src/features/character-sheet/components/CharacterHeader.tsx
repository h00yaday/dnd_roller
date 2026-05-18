import { useState, useEffect } from 'react'; 
import type { Character } from '../../../types/character';
import { getModifier, toNum } from '../../../utils/math';

interface Props {
  character: Character;
  onBack: () => void;
  profBonus: number;
  onLongRest: () => void;
  onUpdateSpeed: (newSpeed: number) => void;
  onShortRest: () => void;
  onUpdateLevel: (newLevel: number) => void;
}

export default function CharacterHeader({ character, onBack, profBonus, onLongRest, onShortRest, onUpdateLevel, onUpdateSpeed }: Props) {
  const [isEditingLevel, setIsEditingLevel] = useState(false);
  const [tempLevel, setTempLevel] = useState<number | string>(character.level);
  const [isEditingSpeed, setIsEditingSpeed] = useState(false);
  const [tempSpeed, setTempSpeed] = useState<number | string>(character.speed);

  useEffect(() => {
    setTempSpeed(character.speed);
  }, [character.speed]);

  const handleSaveSpeed = () => {
    let numSpeed = typeof tempSpeed === 'string' ? parseInt(tempSpeed) : tempSpeed;
    if (isNaN(numSpeed) || numSpeed < 0) numSpeed = 0;
    
    if (numSpeed !== character.speed) {
      onUpdateSpeed(numSpeed);
    }
    setTempSpeed(numSpeed);
    setIsEditingSpeed(false);
  };

  useEffect(() => {
    setTempLevel(character.level);
  }, [character.level]);

  const handleSaveLevel = () => {
    let numLevel = typeof tempLevel === 'string' ? parseInt(tempLevel) : tempLevel;
    if (isNaN(numLevel) || numLevel < 1) numLevel = 1;
    if (numLevel > 20) numLevel = 20;

    if (numLevel !== character.level) {
      onUpdateLevel(numLevel);
    }
    setTempLevel(numLevel);
    setIsEditingLevel(false);
  };

  const decrementLevel = () => setTempLevel(prev => Math.max(1, (typeof prev === 'string' ? (parseInt(prev) || 1) : prev) - 1));
  const incrementLevel = () => setTempLevel(prev => Math.min(20, (typeof prev === 'string' ? (parseInt(prev) || 1) : prev) + 1));

  const hpPercentage = character.max_hp > 0
    ? Math.round((character.current_hp / character.max_hp) * 100)
    : 0;
  let hpColor = 'bg-green-500';
  if (hpPercentage <= 50) hpColor = 'bg-amber-500';
  if (hpPercentage <= 20) hpColor = 'bg-red-500';

  const dexMod = getModifier(character.dexterity);
  const totalInitiative = dexMod + toNum(character.initiative_bonus.toString());

  return (
    <div className="bg-slate-900 border-b border-slate-800 pt-6 pb-6 px-4 sticky top-0 z-40 shadow-xl">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={onBack} className="w-10 h-10 shrink-0 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            ←
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-1">{character.name}</h1>
            
            <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
              <span>{character.race} • {character.character_class} {character.subclass && `(${character.subclass})`} •</span>
              
              {isEditingLevel ? (
              <div className="flex items-center gap-1 bg-slate-800 rounded px-1 py-0.5 border border-slate-600">
                <button onClick={decrementLevel} className="text-slate-400 hover:text-red-400 font-bold px-2">-</button>
                
                <input
                  type="number"
                  value={tempLevel}
                  onChange={(e) => setTempLevel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveLevel()}
                  className="text-white font-bold w-10 text-center bg-transparent outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                />

                <button onClick={incrementLevel} className="text-slate-400 hover:text-green-400 font-bold px-2">+</button>
                <button onClick={handleSaveLevel} className="ml-1 text-xs text-blue-400 hover:text-blue-300 font-bold px-1">OK</button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span>Level {character.level}</span>
                <button onClick={() => setIsEditingLevel(true)} className="text-slate-400 hover:text-blue-400 font-bold text-xs px-1">Edit</button>
              </div>
            )}
            </div>
            
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-slate-800 px-4 py-2 rounded-xl text-center border border-slate-700">
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">AC</span>
            <span className="text-2xl font-black text-amber-400">{character.armor_class}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-xl text-center border border-slate-700">
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">Init.</span>
            <span className="text-2xl font-black text-amber-400">
              {totalInitiative >= 0 ? `+${totalInitiative}` : totalInitiative}
            </span>
          </div>
          <div 
            className="bg-slate-800 px-4 py-2 rounded-xl text-center border border-slate-700 cursor-pointer"
            onClick={() => !isEditingSpeed && setIsEditingSpeed(true)}
          >
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">Spd.</span>
            {isEditingSpeed ? (
              <input
                type="number"
                value={tempSpeed}
                onChange={(e) => setTempSpeed(e.target.value)}
                onBlur={handleSaveSpeed}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSpeed()}
                className="text-2xl font-black text-amber-400 w-12 text-center bg-transparent outline-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
            ) : (
              <span className="text-2xl font-black text-amber-400">{character.speed}</span>
            )}
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-xl text-center border border-slate-700">
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">PB</span>
            <span className="text-2xl font-black text-amber-400">+{profBonus}</span>
          </div>
        </div>

        <div className="w-full md:w-72 flex flex-col gap-2">
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 relative overflow-hidden">
            <div className="flex justify-between items-end relative z-10 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hit Points</span>
              <div className="text-right leading-none">
                <span className="text-2xl font-black text-white">{character.current_hp}</span>
                <span className="text-slate-500 font-bold text-sm"> / {character.max_hp}</span>
              </div>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden relative z-10">
              <div className={`h-full ${hpColor} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onShortRest}
              className="flex-1 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Short Rest
            </button>
            <button
              onClick={onLongRest}
              className="flex-1 py-1.5 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-lg hover:bg-teal-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Long Rest
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}