import { useState } from 'react';
import type { SpellCreatePayload } from '../../../../types/character';

interface Props { onClose: () => void; onSubmit: (data: SpellCreatePayload) => Promise<void>; }

export default function SpellModal({ onClose, onSubmit }: Props) {
  const [form, setForm] = useState({ 
    name: '', level: 0, description: '', damage_dice: '', damage_type: '', 
    requires_attack_roll: false, spell_attack_bonus: 0 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault(); 
  setIsSubmitting(true);
  
  const payload = {
    ...form,
    damage_dice: form.damage_dice.trim() || null,
    damage_type: form.damage_type.trim() || null,
  };
  
  await onSubmit(payload);
  setIsSubmitting(false); 
  onClose();
};

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
        <h3 className="text-xl font-black text-indigo-400 mb-6 uppercase tracking-wider">Learn Spell</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Name</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500" placeholder="Fire Bolt" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Level</label>
              <input type="number" min="0" max="9" required value={form.level} onChange={e => setForm({...form, level: Number(e.target.value)})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500 text-center" />
            </div>
          </div>

          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.requires_attack_roll} 
                onChange={e => setForm({...form, requires_attack_roll: e.target.checked})} 
                className="w-4 h-4 accent-indigo-500 rounded bg-slate-900 border-slate-700"
              />
              <span className="text-sm font-bold text-slate-300">Requires attack roll</span>
            </label>
            
            {form.requires_attack_roll && (
              <div className="animate-fade-in">
                <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Spell Attack Bonus</label>
                <input type="number" value={form.spell_attack_bonus} onChange={e => setForm({...form, spell_attack_bonus: Number(e.target.value)})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500" placeholder="e.g., 5" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Damage (Optional)</label>
              <input type="text" pattern="^[0-9dD+\-\s]+$" value={form.damage_dice} onChange={e => setForm({...form, damage_dice: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-red-500 text-center" placeholder="1d10" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Damage Type</label>
              <input type="text" value={form.damage_type} onChange={e => setForm({...form, damage_type: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500" placeholder="Fire" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500 resize-none" placeholder="You hurl a mote of fire..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-bold">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-50">Learn</button>
          </div>
        </form>
      </div>
    </div>
  );
}