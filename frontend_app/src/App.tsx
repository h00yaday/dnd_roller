import { useState, useEffect } from 'react';
import Auth from './components/Auth';

interface Character {
  id: number;
  name: string;
  level: number;
  max_hp: number;
  current_hp: number;
  armor_class: number;
  strength: number;
  dexterity: number;
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  // Срабатывает каждый раз, когда меняется токен
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    fetch('http://localhost:8000/characters/', {
      headers: {
        'Authorization': `Bearer ${token}` // Передаем токен FastAPI бэкенду
      }
    })
      .then(res => {
        if (res.status === 401) {
          handleLogout(); // Если токен протух - разлогиниваем
          throw new Error('Токен истек или недействителен');
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCharacters(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка при получении персонажей:", err);
        setLoading(false);
      });
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <Auth onLogin={(newToken) => setToken(newToken)} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-200">
      <header className="mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 drop-shadow-sm">
            Таверна "У Эсмеральды"
          </h1>
          <p className="mt-2 text-slate-400">Управление персонажами и броски кубиков</p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          Выйти
        </button>
      </header>
      
      {loading ? (
        <p className="text-center text-slate-400 animate-pulse">Заглядываем в книгу учета...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map(char => (
            <div key={char.id} className="relative p-6 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 hover:border-slate-500 transition-colors">
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-amber-400">{char.name}</h2>
                  <p className="text-sm text-slate-400">Уровень {char.level}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">КД</span>
                  <span className="text-xl font-bold font-mono text-blue-400">{char.armor_class}</span>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium tracking-wide text-sm">Хитпоинты</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {char.current_hp} <span className="text-slate-500 font-normal">/ {char.max_hp}</span>
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${(char.current_hp / char.max_hp) * 100}%` }}
                  ></div>
                </div>
              </div>
              
            </div>
          ))}
          
          {characters.length === 0 && (
            <div className="col-span-full text-center p-10 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500">
              Пока нет ни одного персонажа. Нужно создать хотя бы одного!
            </div>
          )}
        </div>
      )}
    </div>
  );
}