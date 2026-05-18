import { useState } from 'react';
import type { AttackCreatePayload } from '../../../../types/character';

interface Props { onClose: () => void; onSubmit: (data: AttackCreatePayload) => Promise<void>; }

export default function AttackModal({ onClose, onSubmit }: Props) {
  const [form, setForm] = useState({ name: '', attack_bonus: 0, damage_dice: '1d8', damage_type: 'Slashing' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    await onSubmit(form);
    setIsSubmitting(false); onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-black text-amber-400 mb-6 uppercase tracking-wider">New Weapon</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500" placeholder="Warhammer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Bonus (Hit)</label>
              <input type="number" required value={form.attack_bonus} onChange={e => setForm({...form, attack_bonus: Number(e.target.value)})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-blue-500 text-center" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Damage Dice</label>
              <input type="text" required pattern="^[0-9dD+\-\s]+$" value={form.damage_dice} onChange={e => setForm({...form, damage_dice: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-red-500 text-center" placeholder="1d8 + 3" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Damage Type</label>
            <input type="text" required value={form.damage_type} onChange={e => setForm({...form, damage_type: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500" placeholder="Bludgeoning" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-bold">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold disabled:opacity-50">Equip</button>
          </div>
        </form>
      </div>
    </div>
  );
}