import { memo, useCallback, useEffect, useState } from 'react';
import type { Character } from '../../../types/character';
import { formatMod } from '../../../utils/math';

interface Props {
  character: Character;
  isRolling: boolean;
  onUpdateHp: (amount: number) => void;
  onUpdateAC: (newAC: number) => void;
  onRoll: (url: string) => void;
  onAddAttack: () => void;
  onDeleteAttack: (id: number) => void;
}

function CombatTab({ character, isRolling, onUpdateHp, onUpdateAC, onRoll, onAddAttack, onDeleteAttack }: Props) {
  const [isEditingAC, setIsEditingAC] = useState(false);
  const [tempAC, setTempAC] = useState<number | string>(character.armor_class);

  useEffect(() => {
    setTempAC(character.armor_class);
  }, [character.armor_class]);

  const handleSaveAC = useCallback(() => {
    let numAC = typeof tempAC === 'string' ? parseInt(tempAC, 10) : tempAC;
    if (isNaN(numAC)) numAC = 0;

    if (numAC !== character.armor_class) {
      onUpdateAC(numAC);
    }
    setTempAC(numAC);
    setIsEditingAC(false);
  }, [character.armor_class, onUpdateAC, tempAC]);

  const decrementAC = useCallback(
    () =>
      setTempAC((prev) =>
        Math.max(0, (typeof prev === 'string' ? (parseInt(prev, 10) || 0) : prev) - 1)
      ),
    []
  );
  const incrementAC = useCallback(
    () => setTempAC((prev) => (typeof prev === 'string' ? (parseInt(prev, 10) || 0) : prev) + 1),
    []
  );
  const hpPercent = character.max_hp > 0
    ? Math.max(0, (character.current_hp / character.max_hp) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
         <div className="absolute top-0 w-full h-2 bg-slate-900">
           <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${hpPercent}%` }}></div>
         </div>
         <h3 className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-sm">Hit Points</h3>
         <div className="flex items-center gap-6">
           <button onClick={() => onUpdateHp(-1)} className="w-12 h-12 rounded-full bg-red-900/30 text-red-500 hover:bg-red-500 hover:text-white font-black text-xl transition-colors">-</button>
           <div className="text-center">
             <span className="text-6xl font-black text-slate-100">{character.current_hp}</span>
             <span className="text-xl text-slate-500 font-bold"> / {character.max_hp}</span>
           </div>
           <button onClick={() => onUpdateHp(1)} className="w-12 h-12 rounded-full bg-emerald-900/30 text-emerald-500 hover:bg-emerald-500 hover:text-white font-black text-xl transition-colors">+</button>
         </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col items-center justify-center shadow-xl relative">
        <div className="absolute top-4 right-4">
          <button 
            onClick={isEditingAC ? handleSaveAC : () => setIsEditingAC(true)}
            className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${
              isEditingAC 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30' 
                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-blue-400 hover:text-blue-300'
            }`}
          >
            {isEditingAC ? 'Done' : 'Edit'}
          </button>
        </div>

        <span className="text-sm text-slate-400 font-bold block mb-4 uppercase tracking-widest">Armor Class</span>
        
        {isEditingAC ? (
    <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-2xl border border-slate-700">
      <button onClick={decrementAC} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 font-black text-xl transition-colors">-</button>
      
      <input
        type="number"
        value={tempAC}
        onChange={(e) => setTempAC(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSaveAC()}
        className="text-5xl font-black text-blue-400 w-24 text-center bg-transparent outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
      />

      <button onClick={incrementAC} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-green-400 hover:bg-slate-700 font-black text-xl transition-colors">+</button>
    </div>
  ) : (
    <span className="text-5xl font-black text-slate-200">{character.armor_class}</span>
  )}
      </div>
      <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
        <div className="flex justify-between items-end mb-6 border-b border-slate-700 pb-2">
          <h3 className="text-2xl font-black text-slate-200">Weapons & Attacks</h3>
          <button onClick={onAddAttack} className="text-amber-400 hover:text-amber-300 font-bold text-sm">+ Add Attack</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(character.attacks || []).map(attack => (
            <div key={attack.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center group hover:border-orange-500/50 transition-colors">
               <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg text-slate-200">{attack.name}</h4>
                    <button onClick={() => onDeleteAttack(attack.id)} className="text-xs text-slate-600 hover:text-red-500 transition-colors">✕</button>
                  </div>
                  <div className="flex gap-3 mt-1 text-sm font-mono">
                    <span className="text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-900/50">Hit: {formatMod(attack.attack_bonus)}</span>
                    <span className="text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-900/50">Damage: {attack.damage_dice} {attack.damage_type}</span>
                  </div>
               </div>
               <button onClick={() => onRoll(`/characters/${character.id}/attacks/${attack.id}/roll`)} disabled={isRolling} className="h-12 w-24 bg-orange-600/20 text-orange-500 border border-orange-500/30 rounded-lg hover:bg-orange-600 hover:text-white font-black uppercase text-sm transition-all active:scale-95 shadow-lg disabled:opacity-50">ATTACK</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(CombatTab);