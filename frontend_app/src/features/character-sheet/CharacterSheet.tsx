import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Attack,
  AttackCreatePayload,
  Character,
  Feature,
  FeatureCreatePayload,
  RollResult,
  SkillKey,
  StatKey,
  Spell,
  SpellCreatePayload,
} from '../../types/character';
import { getProfBonus } from '../../utils/math';
import { fetchJsonWithAuth, fetchWithAuth, UnauthorizedError } from '../../utils/api';

import CharacterHeader from './components/CharacterHeader';
import StatsTab from './components/StatsTab';
import CombatTab from './components/CombatTab';
import SpellsTab from './components/SpellsTab';
import FeaturesTab from './components/FeaturesTab';

import RollModal from './components/modals/RollModal';
import AttackModal from './components/modals/AttackModal';
import SpellModal from './components/modals/SpellModal';
import FeatureModal from './components/modals/FeatureModal';

interface Props { character: Character; onBack: () => void; }

export default function CharacterSheet({ character,  onBack }: Props) {
  const [localChar, setLocalChar] = useState<Character>({
    ...character, skills: character.skills || {}, saving_throws: character.saving_throws || {}, spell_slots: character.spell_slots || {}, features: character.features || []
  });
  const [activeTab, setActiveTab] = useState<'stats' | 'combat' | 'spells' | 'features'>('stats');
  
  const [rollResult, setRollResult] = useState<RollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showAttackModal, setShowAttackModal] = useState(false);
  const [showSpellModal, setShowSpellModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);

  const pendingPatchRef = useRef<Partial<Character>>({});
  const patchTimerRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;

  const flushCharacterPatch = useCallback(async () => {
    const payload = pendingPatchRef.current;
    pendingPatchRef.current = {};
    patchTimerRef.current = null;

    if (Object.keys(payload).length === 0) return;
    
    try {
      await fetchWithAuth(`/characters/${character.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      retryCountRef.current = 0;
    } catch (err: unknown) {
      if (!(err instanceof UnauthorizedError)) {
        retryCountRef.current++;
        if (retryCountRef.current < maxRetries) {
          console.warn(`Character patch failed (attempt ${retryCountRef.current}/${maxRetries}), will retry...`);
          setTimeout(() => {
            if (Object.keys(payload).length > 0) {
              void flushCharacterPatch();
            }
          }, 1000 * retryCountRef.current);
        } else {
          console.error(`Character patch failed after ${maxRetries} attempts, discarding changes`);
          retryCountRef.current = 0;
        }
      }
    }
  }, [character.id, maxRetries]);

  const queueCharacterPatch = useCallback((patch: Partial<Character>) => {
    pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
    if (patchTimerRef.current !== null) {
      window.clearTimeout(patchTimerRef.current);
    }
    patchTimerRef.current = window.setTimeout(() => {
      void flushCharacterPatch();
    }, 350);
  }, [flushCharacterPatch]);

  useEffect(() => {
    return () => {
      if (patchTimerRef.current !== null) {
        window.clearTimeout(patchTimerRef.current);
      }
      if (Object.keys(pendingPatchRef.current).length > 0) {
        void flushCharacterPatch();
      }
    };
  }, [flushCharacterPatch]);

  const profBonus = getProfBonus(localChar.level);

  const updateField = useCallback(<K extends keyof Character>(field: K, value: Character[K]) => {
    setLocalChar(prev => ({ ...prev, [field]: value }));
    queueCharacterPatch({ [field]: value } as Partial<Character>);
  }, [queueCharacterPatch]);

  const toggleSkill = useCallback((skillId: SkillKey) => {
    const current = localChar.skills[skillId] || 0;
    updateField('skills', { ...localChar.skills, [skillId]: current === 0 ? 1 : current === 1 ? 2 : 0 });
  }, [localChar.skills, updateField]);

  const toggleSavingThrow = useCallback((statId: StatKey) => {
    const current = localChar.saving_throws[statId] || 0;
    updateField('saving_throws', { ...localChar.saving_throws, [statId]: current === 0 ? 1 : 0 });
  }, [localChar.saving_throws, updateField]);

  const updateHP = useCallback((amount: number) => {
    updateField('current_hp', Math.max(0, Math.min(localChar.max_hp, localChar.current_hp + amount)));
  }, [localChar.current_hp, localChar.max_hp, updateField]);


  const handleRoll = useCallback(async (url: string) => {
    setIsRolling(true);
    try {
      const result = await fetchJsonWithAuth<RollResult>(url, { method: 'POST' });
      setRollResult(result);
    } catch (err: unknown) {
      if (!(err instanceof UnauthorizedError)) alert('Failed to roll dice :(');
    } finally { setIsRolling(false); }
  }, []);

  const submitAttack = useCallback(async (attackData: AttackCreatePayload) => {
    try {
      const newAttack = await fetchJsonWithAuth<Attack>(`/characters/${character.id}/attacks`, {
        method: 'POST', body: JSON.stringify(attackData),
      });
      setLocalChar(prev => ({ ...prev, attacks: [...(prev.attacks || []), newAttack] }));
    } catch (err: unknown) { if (!(err instanceof UnauthorizedError)) console.error(err); }
  }, [character.id]);

  const submitSpell = useCallback(async (spellData: SpellCreatePayload) => {
    try {
      const newSpell = await fetchJsonWithAuth<Spell>(`/characters/${character.id}/spells`, {
        method: 'POST', body: JSON.stringify(spellData),
      });
      setLocalChar(prev => ({ ...prev, spells: [...(prev.spells || []), newSpell] }));
    } catch (err: unknown) { if (!(err instanceof UnauthorizedError)) console.error(err); }
  }, [character.id]);

  const deleteItem = useCallback(async (type: 'attacks' | 'spells' | 'features', id: number) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      const res = await fetchWithAuth(`/characters/${character.id}/${type}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLocalChar(prev => {
          const collection = prev[type] as Array<{ id: number }>;
          return { ...prev, [type]: collection.filter((item) => item.id !== id) };
        });
      }
    } catch (err: unknown) { if (!(err instanceof UnauthorizedError)) alert('Deletion error'); }
  }, [character.id]);

  const updateSpellSlot = useCallback((level: number, total: number, used: number) => {
    updateField('spell_slots', { ...localChar.spell_slots, [level]: { total, used } });
  }, [localChar.spell_slots, updateField]);

  const handleCastSpell = useCallback(async (spellId: number, castLevel: number) => {
    setIsRolling(true);
    try {
      const url = `/characters/${character.id}/spells/${spellId}/cast?cast_level=${castLevel}`;
      const data = await fetchJsonWithAuth<RollResult>(url, { method: 'POST' });

      setRollResult(data);

      if (castLevel > 0) {
        setLocalChar(prev => {
          const currentSlots = prev.spell_slots[castLevel] || { total: 0, used: 0 };
          return { ...prev, spell_slots: { ...prev.spell_slots, [castLevel]: { ...currentSlots, used: currentSlots.used + 1 } } };
        });
      }
    } catch (err: unknown) {
      if (!(err instanceof UnauthorizedError)) alert('Failed to cast spell :(');
    } finally { setIsRolling(false); }
  }, [character.id]);

  const handleLongRest = useCallback(async () => {
    if (!window.confirm('Take a Long Rest? You will recover all HP and spell slots.')) return;
    await flushCharacterPatch();
    const updatedSlots = { ...localChar.spell_slots };
    for (const level in updatedSlots) updatedSlots[level] = { ...updatedSlots[level], used: 0 };

    setLocalChar(prev => ({ ...prev, current_hp: prev.max_hp, spell_slots: updatedSlots }));

    try {
      queueCharacterPatch({ current_hp: localChar.max_hp, spell_slots: updatedSlots } as Partial<Character>);
      await flushCharacterPatch();
    } catch (err: unknown) { if (!(err instanceof UnauthorizedError)) console.error('Failed to save rest'); }
  }, [flushCharacterPatch, localChar.max_hp, localChar.spell_slots, queueCharacterPatch]);

  const handleShortRest = () => {
    const input = window.prompt('How much HP did you recover during the short rest? (Use Hit Dice)');
    if (input !== null) {
      const amount = parseInt(input, 10);
      if (!isNaN(amount) && amount > 0) updateHP(amount);
    }
  };

  const submitFeature = useCallback(async (featureData: FeatureCreatePayload) => {
    try {
      const newFeature = await fetchJsonWithAuth<Feature>(`/characters/${character.id}/features`, {
        method: 'POST', body: JSON.stringify(featureData),
      });
      setLocalChar(prev => ({ ...prev, features: [...(prev.features || []), newFeature] }));
    } catch (err: unknown) { if (!(err instanceof UnauthorizedError)) console.error(err); }
  }, [character.id]);

  const openAttackModal = useCallback(() => setShowAttackModal(true), []);
  const openSpellModal = useCallback(() => setShowSpellModal(true), []);
  const openFeatureModal = useCallback(() => setShowFeatureModal(true), []);
  const closeAttackModal = useCallback(() => setShowAttackModal(false), []);
  const closeSpellModal = useCallback(() => setShowSpellModal(false), []);
  const closeFeatureModal = useCallback(() => setShowFeatureModal(false), []);
  const updateLevel = useCallback((newLevel: number) => updateField('level', newLevel), [updateField]);
  const updateSpeed = useCallback((newSpeed: number) => updateField('speed', newSpeed), [updateField]);
  const updateStat = useCallback((statId: StatKey, value: number) => {
    updateField(statId, Math.max(1, Math.min(30, value)));
  }, [updateField]);
  const updateArmorClass = useCallback((newAC: number) => updateField('armor_class', newAC), [updateField]);
  const deleteAttack = useCallback((id: number) => { void deleteItem('attacks', id); }, [deleteItem]);
  const deleteSpell = useCallback((id: number) => { void deleteItem('spells', id); }, [deleteItem]);
  const deleteFeature = useCallback((id: number) => { void deleteItem('features', id); }, [deleteItem]);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 animate-fade-in pb-10 font-sans relative">
      <CharacterHeader 
        character={localChar} 
        onBack={onBack} 
        onUpdateSpeed={updateSpeed}
        profBonus={profBonus} 
        onLongRest={handleLongRest} 
        onShortRest={handleShortRest} 
        onUpdateLevel={updateLevel}
      />

      <div className="max-w-6xl mx-auto px-4 mt-6 flex gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'stats', label: 'Stats & Skills' },
          { id: 'combat', label: 'Combat & Equipment' },
          { id: 'spells', label: 'Spells' },
          { id: 'features', label: 'Features' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as 'stats' | 'combat' | 'spells' | 'features')} className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-800 text-amber-400 border-t-2 border-amber-400' : 'bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        {activeTab === 'stats' && <StatsTab character={localChar} profBonus={profBonus} onToggleSkill={toggleSkill} onToggleSave={toggleSavingThrow} onUpdateStat={updateStat} onRoll={handleRoll} />}
        {activeTab === 'combat' && (
          <CombatTab 
            character={localChar} 
            isRolling={isRolling} 
            onUpdateHp={updateHP} 
            onUpdateAC={updateArmorClass}
            onRoll={handleRoll} 
            onAddAttack={openAttackModal}
            onDeleteAttack={deleteAttack}
          />
        )}
        {activeTab === 'spells' && <SpellsTab character={localChar} isRolling={isRolling} onAddSpell={openSpellModal} onDeleteSpell={deleteSpell} onCast={handleCastSpell} onUpdateSlots={updateSpellSlot} />}
        {activeTab === 'features' && (
          <FeaturesTab 
            character={localChar} 
            onAddFeature={openFeatureModal}
            onDeleteFeature={deleteFeature}
          />
        )}
      </div>

      <RollModal result={rollResult} onClose={() => setRollResult(null)} />
      {showAttackModal && <AttackModal onClose={closeAttackModal} onSubmit={submitAttack} />}
      {showSpellModal && <SpellModal onClose={closeSpellModal} onSubmit={submitSpell} />}
      {showFeatureModal && <FeatureModal onClose={closeFeatureModal} onSubmit={submitFeature} />}
    </div>
  );
}