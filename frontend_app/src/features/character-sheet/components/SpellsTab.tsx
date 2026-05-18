import { useState } from 'react';
import type { Character } from '../../../types/character';

interface Props {
  character: Character;
  isRolling: boolean;
  onAddSpell: () => void;
  onDeleteSpell: (id: number) => void;
  onCast: (spellId: number, level: number) => void;
  onUpdateSlots: (level: number, total: number, used: number) => void;
}

export default function SpellsTab({ character, isRolling, onAddSpell, onDeleteSpell, onCast, onUpdateSlots }: Props) {
  const [isEditingSlots, setIsEditingSlots] = useState(false);

  const hasAnySlots = [1, 2, 3, 4, 5, 6, 7, 8, 9].some(level => (character.spell_slots?.[level]?.total || 0) > 0);

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
      <div className="flex justify-between items-end mb-6 border-b border-slate-700 pb-2">
        <h3 className="text-2xl font-black text-slate-200">Spellbook</h3>
        <button onClick={onAddSpell} className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">+ Add Spell</button>
      </div>

      <div className="mb-8 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-indigo-400 text-sm uppercase tracking-wider">Spell Slots</h4>
          <button 
            onClick={() => setIsEditingSlots(!isEditingSlots)}
            className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${
              isEditingSlots 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30' 
                : 'bg-slate-800 text-slate-300 border border-slate-600 hover:border-indigo-400 hover:text-indigo-300'
            }`}
          >
            {isEditingSlots ? 'Done' : 'Edit'}
          </button>
        </div>

        {!isEditingSlots && !hasAnySlots ? (
          <p className="text-slate-500 text-sm text-center py-2 italic">You have no spell slots yet. Click "Edit" to add them.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
              const slotData = character.spell_slots?.[level] || { total: 0, used: 0 };
              const { total, used } = slotData;

              if (!isEditingSlots && total === 0) return null;

              return (
                <div key={level} className="flex flex-col items-center bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between w-full mb-3 border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400 font-bold">{level} LVL</span>
                    
                    {isEditingSlots ? (
                      <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-2 py-0.5">
                        <button onClick={() => onUpdateSlots(level, Math.max(0, total - 1), Math.min(used, Math.max(0, total - 1)))} className="text-slate-500 hover:text-red-400 font-bold text-lg leading-none">-</button>
                        <span className="text-sm font-bold text-slate-300 w-4 text-center">{total}</span>
                        <button onClick={() => onUpdateSlots(level, total + 1, used)} className="text-slate-500 hover:text-green-400 font-bold text-lg leading-none">+</button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">
                        {total - used} / {total}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 justify-center min-h-[20px] w-full">
                    {Array.from({ length: Math.max(total, 0) }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const newUsed = (i + 1 === used) ? i : i + 1;
                          onUpdateSlots(level, total, newUsed);
                        }}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                          i < used 
                            ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
                            : 'bg-slate-800 border-slate-600 hover:border-indigo-400 hover:bg-slate-700'
                        }`}
                        title={i < used ? "Restore slot" : "Expend slot"}
                      />
                    ))}
                    {total === 0 && <span className="text-xs text-slate-600 italic">No slots</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {character.spells?.length === 0 ? (
        <p className="text-slate-500 italic text-center py-6 border-t border-slate-700/50 mt-4">You do not know any spells.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(character.spells || [])?.map(spell => (
            <div key={spell.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 hover:border-indigo-500/30 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-indigo-400 text-lg">{spell.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded font-bold">Lvl {spell.level}</span>
                    <button onClick={() => onDeleteSpell(spell.id)} className="text-slate-500 hover:text-red-400">✕</button>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap mb-2">
                  {spell.requires_attack_roll && (
                    <span className="text-xs text-blue-400 font-mono bg-blue-900/20 inline-block px-2 py-1 rounded border border-blue-900/50">
                      Attack: {spell.spell_attack_bonus && spell.spell_attack_bonus >= 0 ? `+${spell.spell_attack_bonus}` : spell.spell_attack_bonus}
                    </span>
                  )}
                  {spell.damage_dice && (
                    <span className="text-xs text-red-400 font-mono bg-red-900/10 inline-block px-2 py-1 rounded border border-red-900/30">
                      Damage: {spell.damage_dice} {spell.damage_type}
                    </span>
                  )}
                </div>

                {spell.description && <p className="text-xs text-slate-400 mt-1 line-clamp-3 mb-4">{spell.description}</p>}
              </div>
              <button 
                onClick={() => onCast(spell.id, spell.level)} 
                disabled={isRolling} 
                className="w-full mt-auto py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-sm font-bold uppercase tracking-wider disabled:opacity-50">
                Cast
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}