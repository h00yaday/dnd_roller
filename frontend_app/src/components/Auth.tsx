import { useState } from 'react';

interface AuthProps {
  onLogin: (token: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  // ... (вся логика handleSubmit и состояния остается точно такой же, как была)
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLoginMode) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch('http://localhost:8000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Ошибка при входе');

        localStorage.setItem('token', data.access_token);
        onLogin(data.access_token);
      } else {
        const response = await fetch('http://localhost:8000/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Ошибка при регистрации');

        setIsLoginMode(true);
        setError('Регистрация успешна! Теперь войдите.');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
        <h2 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 mb-8">
          {/* ИСПРАВЛЕНО ЗДЕСЬ */}
          {isLoginMode ? 'Вход в Таверну' : 'Новый Пользователь'}
        </h2>

        {error && (
          <div className={`p-3 rounded-lg mb-6 text-sm ${error.includes('успешна') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Имя пользователя</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-200 outline-none transition-all"
              placeholder="Например: Esmeralda"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Пароль</label>
            <input
              type="password"
              required
              minLength={3}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-200 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold rounded-lg shadow-lg transform transition-all active:scale-95 disabled:opacity-70"
          >
            {isLoading ? 'Загрузка...' : (isLoginMode ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          {isLoginMode ? 'Еще нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
            className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
          >
            {/* ИСПРАВЛЕНО ЗДЕСЬ */}
            {isLoginMode ? 'Создать аккаунт' : 'Войти в систему'}
          </button>
        </p>
      </div>
    </div>
  );
}