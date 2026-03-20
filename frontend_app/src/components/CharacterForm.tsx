import { useState } from 'react';

interface CharacterFormProps {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CharacterForm({ token, onSuccess, onCancel }: CharacterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    level: 1,
    max_hp: 10,
    armor_class: 10,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/characters/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Ошибка при создании персонажа');
      }

      onSuccess(); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-6 w-full max-w-2xl mt-10 mb-10">
        <h2 className="text-2xl font-bold text-amber-400 mb-6 text-center">Создание нового персонажа</h2>
        
        {error && <div className="p-3 mb-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Имя</label>
              <input type="text" required name="name" value={formData.name} onChange={handleChange} 
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:border-orange-500 outline-none" 
                placeholder="Например: Эсмеральда" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Уровень</label>
                <input type="number" min="1" max="20" required name="level" value={formData.level} onChange={handleChange} 
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-center focus:border-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Max HP</label>
                <input type="number" min="1" required name="max_hp" value={formData.max_hp} onChange={handleChange} 
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-center focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">КД (Броня)</label>
                <input type="number" min="1" required name="armor_class" value={formData.armor_class} onChange={handleChange} 
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-center focus:border-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 border-b border-slate-700 pb-1">Характеристики</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((stat) => (
                <div key={stat} className="text-center">
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">{stat.slice(0, 3)}</label>
                  <input type="number" min="1" max="30" required name={stat} value={formData[stat as keyof typeof formData]} onChange={handleChange} 
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-center focus:border-orange-500 outline-none" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold rounded shadow-lg disabled:opacity-50">
              {isLoading ? 'Создаем...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}