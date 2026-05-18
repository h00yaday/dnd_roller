import { useState } from 'react';
import type { Character, SkillKey, StatKey } from '../../../types/character';
import { SKILLS, STATS } from '../../../constants/dnd';
import { getModifier, formatMod } from '../../../utils/math';

interface Props {
  character: Character;
  profBonus: number;
  onToggleSkill: (skillId: SkillKey) => void;
  onToggleSave: (statId: StatKey) => void;
  onUpdateStat: (statId: StatKey, value: number) => void;
  onRoll: (url: string) => void; 
}

const STAT_LABELS_SHORT: Record<StatKey, string> = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA'
};

export default function StatsTab({ character, profBonus, onToggleSkill, onToggleSave, onUpdateStat, onRoll }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempStats, setTempStats] = useState<Partial<Record<StatKey, string>>>({});

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`text-xs font-bold px-4 py-2 rounded transition-colors ${
            isEditing 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30' 
              : 'bg-slate-800 text-slate-300 border border-slate-600 hover:border-amber-400 hover:text-amber-300'
          }`}
        >
          {isEditing ? 'Done (Editing enabled)' : 'Edit Stats, Skills & Saves'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {STATS.map(stat => {
            const statId = stat.id;
            const score = Number(character[statId]);
            const mod = getModifier(score);
            const statLabel = STAT_LABELS_SHORT[statId];
            const profLevelSave = character.saving_throws[statId] || 0;
            const totalSaveBonus = mod + (profLevelSave * profBonus);

            return (
              <div 
                key={statId} 
                onClick={() => !isEditing && onRoll(`/characters/${character.id}/roll-check?action=${encodeURIComponent(`Check: ${statLabel}`)}&bonus=${mod}`)}
                className={`bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg group relative transition-all ${
                  !isEditing ? 'cursor-pointer hover:border-blue-500/50 hover:bg-slate-700/50' : ''
                }`}
                title={!isEditing ? `Roll Check: ${statLabel}` : ''}
              >
                <div className="text-center mb-3">
                  <span className="text-xs font-black text-slate-500 tracking-widest block">{statLabel}</span>
                  <span className="text-4xl font-black text-slate-200 block drop-shadow-md">{formatMod(mod)}</span>
                  {isEditing && (
                    <div className="mt-2 flex justify-center items-center gap-1.5 bg-slate-900 rounded-full px-2 py-0.5 mx-auto w-max border border-slate-700/50">
                      <button onClick={(e) => {
                        e.stopPropagation();
                        const newVal = score - 1;
                        onUpdateStat(statId, newVal);
                        setTempStats(prev => ({...prev, [statId]: String(newVal)}));
                      }} className="text-slate-500 hover:text-red-400 font-bold text-lg leading-none px-1.5">-</button>

                      <input
                        type="number"
                        value={tempStats[statId] !== undefined ? tempStats[statId] : score}
                        onChange={(e) => setTempStats(prev => ({ ...prev, [statId]: e.target.value }))}
                        onBlur={() => {
                          const val = tempStats[statId];
                          if (val !== undefined) {
                            const num = parseInt(val);
                            onUpdateStat(statId, isNaN(num) ? 0 : num);
                            const newTemp = { ...tempStats };
                            delete newTemp[statId];
                            setTempStats(newTemp);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent text-amber-400 w-8 text-center font-mono text-xs outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                      />

                      <button onClick={(e) => {
                        e.stopPropagation();
                        const newVal = score + 1;
                        onUpdateStat(statId, newVal);
                        setTempStats(prev => ({...prev, [statId]: String(newVal)}));
                      }} className="text-slate-500 hover:text-green-400 font-bold text-lg leading-none px-1.5">+</button>
                    </div>
                  )}
                </div>

                <div
                  onClick={(e) => {
                    if (isEditing) {
                      e.stopPropagation();
                      onToggleSave(statId);
                    } else {
                      e.stopPropagation();
                      onRoll(`/characters/${character.id}/roll-check?action=${encodeURIComponent(`Saving Throw: ${statLabel}`)}&bonus=${totalSaveBonus}`);
                    }
                  }}
                  className={`flex items-center justify-between p-2 rounded transition-colors group ${
                    isEditing
                      ? 'cursor-pointer hover:bg-slate-700/50 bg-slate-900/30'
                      : 'cursor-pointer hover:bg-slate-700/80 bg-slate-900/50'
                  }`}
                  title={isEditing ? `Toggle saving throw proficiency for ${statLabel}` : `Roll Saving Throw: ${statLabel}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${profLevelSave > 0 ? 'border-amber-400 bg-amber-400/20' : 'border-slate-600 bg-slate-950'}`}>
                      {profLevelSave > 0 && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_5px_#fbbf24]" />}
                    </div>
                    <span className={`text-xs ${profLevelSave > 0 ? 'text-slate-200 font-bold' : 'text-slate-400'}`}>Save</span>
                  </div>
                  <span className={`font-mono text-sm ${profLevelSave > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>{formatMod(totalSaveBonus)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-7 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
          <h3 className="text-xl font-bold text-slate-300 mb-5 border-b border-slate-700 pb-3">Skills</h3>
          <div className="space-y-1.5">
            {SKILLS.map(skill => {
              const statScore = Number(character[skill.stat]);
              const mod = getModifier(statScore);
              const profLevel = character.skills[skill.id] || 0;
              const totalBonus = mod + (profLevel * profBonus);
              const skillStatLabel = STAT_LABELS_SHORT[skill.stat];

              return (
                <div 
                  key={skill.id} 
                  onClick={() => {
                    if (isEditing) {
                      onToggleSkill(skill.id);
                    } else {
                      onRoll(`/characters/${character.id}/roll-check?action=${encodeURIComponent(`Skill: ${skill.name}`)}&bonus=${totalBonus}`);
                    }
                  }} 
                  className={`flex items-center justify-between p-2 rounded transition-colors group ${
                    isEditing 
                      ? 'cursor-pointer hover:bg-slate-700/50 bg-slate-900/30' 
                      : 'cursor-pointer hover:bg-slate-700/80 hover:text-blue-300 bg-transparent'
                  }`}
                  title={isEditing ? `Toggle skill proficiency for ${skill.name}` : `Roll: ${skill.name}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${profLevel > 0 ? 'border-amber-400 bg-amber-400/20' : 'border-slate-600 bg-slate-900'}`}>
                      {profLevel === 2 && (
                        <div className="flex flex-col gap-0.5 justify-center items-center">
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_3px_#fbbf24]" />
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_3px_#fbbf24]" />
                        </div>
                      )}
                      {profLevel === 1 && <div className="w-2 h-2 bg-amber-400 rounded-full" />}
                    </div>
                    
                    <span className={`text-sm transition-colors ${profLevel > 0 ? 'text-slate-200 font-bold group-hover:text-blue-300' : 'text-slate-400 group-hover:text-blue-400'}`}>
                      {skill.name} <span className="text-xs text-slate-600 font-normal">({skillStatLabel})</span>
                    </span>
                  </div>
                  <span className={`font-mono text-sm transition-colors ${profLevel > 0 ? 'text-amber-400 font-bold group-hover:text-blue-400' : 'text-slate-500 group-hover:text-blue-400'}`}>{formatMod(totalBonus)}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}