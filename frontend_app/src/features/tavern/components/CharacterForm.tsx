import { useState } from 'react';
import { fetchWithAuth } from '../../../utils/api';
import type { StatKey } from '../../../types/character';

interface CharacterFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CharacterForm({ onCancel, onSuccess }: CharacterFormProps) {
  type FormState = {
    name: string;
    race: string;
    character_class: string;
    background: string;
    level: number | string;
    max_hp: number | string;
    armor_class: number | string;
    strength: number | string;
    dexterity: number | string;
    constitution: number | string;
    intelligence: number | string;
    wisdom: number | string;
    charisma: number | string;
  };

  const [form, setForm] = useState<FormState>({
    name: '',
    race: 'Human',
    character_class: 'Fighter',
    background: '',
    level: 1,
    max_hp: 10,
    armor_class: 10,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      race: form.race.trim(),
      character_class: form.character_class.trim(),
      background: form.background.trim(),
      level: Math.max(1, Math.min(20, Number(form.level) || 1)),
      max_hp: Math.max(1, Math.min(999, Number(form.max_hp) || 10)),
      armor_class: Math.max(0, Math.min(50, Number(form.armor_class) || 10)),
      strength: Math.max(1, Math.min(30, Number(form.strength) || 10)),
      dexterity: Math.max(1, Math.min(30, Number(form.dexterity) || 10)),
      constitution: Math.max(1, Math.min(30, Number(form.constitution) || 10)),
      intelligence: Math.max(1, Math.min(30, Number(form.intelligence) || 10)),
      wisdom: Math.max(1, Math.min(30, Number(form.wisdom) || 10)),
      charisma: Math.max(1, Math.min(30, Number(form.charisma) || 10))
    };
    
    console.log('FORM DEBUG:', { form, payload });

    try {
      const response = await fetchWithAuth('/characters/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Error creating character');
      }
    } catch (err: unknown) {
      console.error(err);
      if (!(err instanceof Error) || err.message !== 'Unauthorized') {
        alert('Failed to connect to the server');
      }
    } finally {
      setLoading(false);
    }
  };

  const stats: Array<{ key: StatKey; label: string }> = [
    { key: 'strength', label: 'STR' }, { key: 'dexterity', label: 'DEX' },
    { key: 'constitution', label: 'CON' }, { key: 'intelligence', label: 'INT' },
    { key: 'wisdom', label: 'WIS' }, { key: 'charisma', label: 'CHA' }
  ];

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 mb-10 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-200 tracking-wider uppercase">New Hero</h2>
        <button onClick={onCancel} className="text-slate-500 hover:text-red-400 font-bold transition-colors">✕ Close</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Character Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500 transition-colors" placeholder="Gandalf" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Race</label>
            <input type="text" required value={form.race} onChange={e => setForm({...form, race: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500 transition-colors" placeholder="Elf" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Class</label>
            <input type="text" required value={form.character_class} onChange={e => setForm({...form, character_class: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500 transition-colors" placeholder="Wizard" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Background</label>
            <input type="text" value={form.background} onChange={e => setForm({...form, background: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500 transition-colors" placeholder="Sage (optional)" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Level</label>
            <input type="number" min="1" max="20" required value={form.level} onChange={e => setForm({...form, level: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500 transition-colors text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max HP</label>
              <input type="number" min="1" required value={form.max_hp} onChange={e => setForm({...form, max_hp: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-bold outline-none focus:border-emerald-500 transition-colors text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AC (Armor)</label>
              <input type="number" required value={form.armor_class} onChange={e => setForm({...form, armor_class: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-blue-400 font-bold outline-none focus:border-blue-500 transition-colors text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Base Stats (Values 1-30)</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {stats.map(stat => (
              <div key={stat.key} className="bg-slate-900 p-2 rounded-lg border border-slate-700/50">
                <label className="block text-[10px] text-center text-slate-500 font-bold mb-1">{stat.label}</label>
                <input 
                  type="number" min="1" max="30" required 
                  value={form[stat.key]}
                  onChange={e => setForm({...form, [stat.key]: e.target.value})} 
                  className="w-full bg-transparent text-center text-xl font-bold text-amber-400 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]" 
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading} className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-lg transition-colors shadow-lg shadow-amber-900/20 disabled:opacity-50 uppercase tracking-wider">
            {loading ? 'Registering...' : 'Create Character'}
          </button>
        </div>
      </form>
    </div>
  );
}