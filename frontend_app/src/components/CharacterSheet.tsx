import { useState } from 'react';

interface Attack {
  id: number;
  name: string;
  attack_bonus: number;
  damage_dice: string;
  damage_type: string;
}

interface Spell {
  id: number;
  name: string;
  level: number;
  description: string;
}

interface Character {
  id: number;
  name: string;
  level: number;
  max_hp: number;
  current_hp: number;
  armor_class: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  attacks: Attack[];
  spells: Spell[];
}

interface CharacterSheetProps {
  character: Character;
  token: string;
  onBack: () => void;
}

export default function CharacterSheet({ character, token, onBack }: CharacterSheetProps) {
  // Локальное состояние персонажа для мгновенного обновления интерфейса
  const [localChar, setLocalChar] = useState<Character>(character);
  
  const [rollResult, setRollResult] = useState<any | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Состояния для модалок
  const [showAttackForm, setShowAttackForm] = useState(false);
  const [showSpellForm, setShowSpellForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Состояния форм
  const [attackForm, setAttackForm] = useState({ name: '', attack_bonus: 0, damage_dice: '1d8', damage_type: 'Рубящий' });
  const [spellForm, setSpellForm] = useState({ name: '', level: 0, description: '' });

  const getModifier = (score: number) => Math.floor((score - 10) / 2);
  const formatModifier = (mod: number) => (mod > 0 ? `+${mod}` : mod.toString());

  const stats = [
    { label: 'СИЛ', value: localChar.strength },
    { label: 'ЛОВ', value: localChar.dexterity },
    { label: 'ТЕЛ', value: localChar.constitution },
    { label: 'ИНТ', value: localChar.intelligence },
    { label: 'МУД', value: localChar.wisdom },
    { label: 'ХАР', value: localChar.charisma },
  ];

  const handleAttackRoll = async (attack: Attack) => {
    setIsRolling(true);
    try {
      const response = await fetch(`http://localhost:8000/characters/${localChar.id}/attacks/${attack.id}/roll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Ошибка броска');
      const data = await response.json();
      setRollResult(data);
    } catch (err) {
      console.error(err);
      alert('Не удалось бросить кубики :(');
    } finally {
      setIsRolling(false);
    }
  };

  const submitAttack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8000/characters/${localChar.id}/attacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(attackForm),
      });
      if (!response.ok) throw new Error('Ошибка добавления');
      const newAttack = await response.json();
      
      setLocalChar(prev => ({ ...prev, attacks: [...prev.attacks, newAttack] }));
      setShowAttackForm(false);
      setAttackForm({ name: '', attack_bonus: 0, damage_dice: '1d8', damage_type: 'Рубящий' });
    } catch (err) {
      alert('Не удалось добавить атаку');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitSpell = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8000/characters/${localChar.id}/spells`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(spellForm),
      });
      if (!response.ok) throw new Error('Ошибка добавления');
      const newSpell = await response.json();
      
      setLocalChar(prev => ({ ...prev, spells: [...prev.spells, newSpell] }));
      setShowSpellForm(false);
      setSpellForm({ name: '', level: 0, description: '' });
    } catch (err) {
      alert('Не удалось добавить заклинание');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-200 animate-fade-in pb-10">
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            ← Назад в таверну
          </button>
          <div className="text-right">
            <h2 className="text-3xl font-extrabold text-amber-400">{localChar.name}</h2>
            <p className="text-sm text-slate-400">Уровень {localChar.level}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex gap-4 text-center">
            <div className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-700/50">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">КД (Броня)</span>
              <span className="text-3xl font-mono text-blue-400">{localChar.armor_class}</span>
            </div>
            <div className="flex-1 bg-slate-900 rounded-xl p-4 border border-slate-700/50">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Хитпоинты</span>
              <span className="text-3xl font-mono text-emerald-400">{localChar.current_hp}</span>
              <span className="text-sm text-slate-500">/{localChar.max_hp}</span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl grid grid-cols-2 gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="bg-slate-900 rounded-xl p-3 border border-slate-700/50 text-center relative overflow-hidden">
                <span className="text-xs font-bold text-slate-500 block mb-1">{stat.label}</span>
                <span className="text-3xl font-black text-slate-200 block">{formatModifier(getModifier(stat.value))}</span>
                <div className="absolute bottom-1 w-full text-center">
                  <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-2 rounded-full">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Результат броска */}
          {rollResult && (
            <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 rounded-2xl p-6 border border-orange-500/30 shadow-2xl relative">
              <button onClick={() => setRollResult(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
              <h3 className="text-lg font-bold text-orange-400 mb-2">{rollResult.action}</h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div>
                  <p className="text-sm text-slate-400">Попадание (d20 + бонус)</p>
                  <p className="text-2xl font-mono">
                    <span className={rollResult.hit_roll.is_critical ? "text-amber-400 font-black" : rollResult.hit_roll.is_critical_fail ? "text-red-500 font-black" : "text-slate-200"}>
                      {rollResult.hit_roll.d20_face}
                    </span> 
                    <span className="text-slate-500"> {formatModifier(rollResult.hit_roll.bonus)} = </span>
                    <span className="font-bold text-blue-400">{rollResult.hit_roll.total}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Урон ({rollResult.damage.type})</p>
                  <p className="text-2xl font-mono text-red-400 font-bold">{rollResult.damage.total}</p>
                </div>
              </div>
            </div>
          )}

          {/* Атаки */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-200">Атаки</h3>
              <button onClick={() => setShowAttackForm(true)} className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors">
                + Добавить
              </button>
            </div>
            
            {localChar.attacks.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Оружие не экипировано.</p>
            ) : (
              <div className="space-y-3">
                {localChar.attacks.map(attack => (
                  <div key={attack.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center hover:border-orange-500/50 transition-colors">
                    <div>
                      <h4 className="font-bold text-slate-200">{attack.name}</h4>
                      <p className="text-sm text-slate-400 font-mono">
                        Бонус: <span className="text-blue-400">{formatModifier(attack.attack_bonus)}</span> | 
                        Урон: <span className="text-red-400">{attack.damage_dice}</span> {attack.damage_type}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleAttackRoll(attack)}
                      disabled={isRolling}
                      className="px-4 py-2 bg-orange-600/20 text-orange-400 border border-orange-500/50 rounded-lg hover:bg-orange-600 hover:text-white transition-all active:scale-95 font-bold disabled:opacity-50"
                    >
                      Бросок!
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Заклинания */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-200">Заклинания</h3>
              <button onClick={() => setShowSpellForm(true)} className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors">
                + Добавить
              </button>
            </div>
            
            {localChar.spells.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Книга заклинаний пуста.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {localChar.spells.map(spell => (
                  <div key={spell.id} className="bg-slate-900 rounded-xl p-3 border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-indigo-400">{spell.name}</h4>
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded font-bold">Ур. {spell.level}</span>
                    </div>
                    {spell.description && <p className="text-xs text-slate-400 mt-2">{spell.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модалка: Новая атака */}
      {showAttackForm && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-amber-400 mb-4">Новая атака</h3>
            <form onSubmit={submitAttack} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Название оружия/атаки</label>
                <input type="text" required value={attackForm.name} onChange={e => setAttackForm({...attackForm, name: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 outline-none focus:border-orange-500" placeholder="Например: Длинный меч" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Бонус к атаке</label>
                  <input type="number" required value={attackForm.attack_bonus} onChange={e => setAttackForm({...attackForm, attack_bonus: Number(e.target.value)})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 outline-none focus:border-blue-500 text-center" />
                </div>
                <div>
                  <div>
                  <label className="block text-sm text-slate-400 mb-1">Кости урона</label>
                  <input 
                    type="text" 
                    required 
                    // Новая регулярка: пропускает любые комбинации кубов и чисел с плюсами/минусами
                    pattern="^\s*([+-]?\s*(\d+[dD]\d+|\d+)\s*)+$"
                    title="Например: 1d8, 2d6+3 или 1d8+1d4+2"
                    value={attackForm.damage_dice} 
                    onChange={e => setAttackForm({...attackForm, damage_dice: e.target.value})} 
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 outline-none focus:border-red-500 text-center valid:border-emerald-500/50 invalid:border-red-500/50 invalid:text-red-400 transition-colors" 
                    placeholder="1d8 + 2d6 + 3" 
                  />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Тип урона</label>
                <input type="text" required value={attackForm.damage_type} onChange={e => setAttackForm({...attackForm, damage_type: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 outline-none focus:border-orange-500" placeholder="Рубящий, Огонь..." />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAttackForm(false)} className="px-4 py-2 text-slate-400 hover:text-white">Отмена</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold disabled:opacity-50">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка: Новое заклинание */}
      {showSpellForm && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-indigo-400 mb-4">Новое заклинание</h3>
            <form onSubmit={submitSpell} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">Название</label>
                  <input type="text" required value={spellForm.name} onChange={e => setSpellForm({...spellForm, name: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 outline-none focus:border-indigo-500" placeholder="Огненный шар" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Уровень</label>
                  <input type="number" min="0" max="9" required value={spellForm.level} onChange={e => setSpellForm({...spellForm, level: Number(e.target.value)})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 outline-none focus:border-indigo-500 text-center" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Описание (опционально)</label>
                <textarea rows={3} value={spellForm.description} onChange={e => setSpellForm({...spellForm, description: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 outline-none focus:border-indigo-500 resize-none" placeholder="Сфера огня взрывается..." />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowSpellForm(false)} className="px-4 py-2 text-slate-400 hover:text-white">Отмена</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold disabled:opacity-50">Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}