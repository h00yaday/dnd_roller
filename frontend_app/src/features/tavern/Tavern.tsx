import { useState } from 'react';
import type { Character } from '../../types/character';
import CharacterForm from './components/CharacterForm';

interface Props {
  characters: Character[];
  loading: boolean;
  onSelectCharacter: (char: Character) => void;
  onDeleteCharacter: (e: React.MouseEvent, id: number) => void;
  onLogout: () => void;
  onRefresh: () => void;
}

export default function Tavern({ 
  characters, loading, onSelectCharacter, onDeleteCharacter, onLogout, onRefresh 
}: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200 font-sans animate-fade-in">
      <header className="max-w-6xl mx-auto mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400 tracking-wider uppercase">
            "Esmeralda's" Tavern
          </h1>
          <p className="mt-2 text-slate-400 font-medium">Select a hero or create a new one</p>
        </div>
        
        <div className="flex space-x-3">
          <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-bold text-white shadow-lg shadow-amber-900/20 transition-all uppercase tracking-wider">
            + New Hero
          </button>
          <button onClick={onLogout} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-bold transition-colors">
            Log Out
          </button>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto">
        {showForm && (
          <CharacterForm 
            onCancel={() => setShowForm(false)} 
            onSuccess={() => { setShowForm(false); onRefresh(); }} 
          />
        )}

        {loading ? (
           <div className="flex justify-center py-20"><p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading heroes...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map(char => (
              <div key={char.id} onClick={() => onSelectCharacter(char)} className="group relative p-6 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 hover:border-amber-500/50 hover:shadow-amber-900/10 cursor-pointer transition-all transform hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 group-hover:bg-amber-500 transition-colors"></div>
                <button onClick={(e) => onDeleteCharacter(e, char.id)} className="absolute top-4 right-4 text-slate-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors z-10 opacity-0 group-hover:opacity-100" title="Delete">
                  ✕
                </button>

                <div className="mb-4 pr-8">
                  <h2 className="text-2xl font-black text-slate-200 group-hover:text-amber-400 transition-colors">{char.name}</h2>
                  <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Lvl {char.level} | {char.race} {char.character_class}</p>
                </div>
              </div>
            ))}
            
            {characters.length === 0 && !showForm && (
              <div className="col-span-full flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 bg-slate-900/50">
                <p className="font-bold uppercase tracking-wider">The tavern is currently empty.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}