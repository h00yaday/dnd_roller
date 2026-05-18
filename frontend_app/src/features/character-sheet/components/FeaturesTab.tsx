import type { Character } from '../../../types/character';

interface Props { 
  character: Character;
  onAddFeature: () => void;
  onDeleteFeature: (id: number) => void;
}

export default function FeaturesTab({ character, onAddFeature, onDeleteFeature }: Props) {
  const statNames: Record<string, string> = {
    strength: "Strength", dexterity: "Dexterity", constitution: "Constitution",
    intelligence: "Intelligence", wisdom: "Wisdom", charisma: "Charisma",
    armor_class: "AC", speed: "Speed", max_hp: "Max HP", initiative_bonus: "Initiative"
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
      <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-6">
        <h3 className="text-2xl font-black text-slate-200">Features & Traits</h3>
        <button onClick={onAddFeature} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-emerald-900/20">
          + Add
        </button>
      </div>

      {character.features.length === 0 ? (
        <p className="text-slate-500 italic text-center py-6">Your class features, racial traits, and feats will appear here.</p>
      ) : (
        <div className="space-y-4">
          {character.features.map(f => (
            <div key={f.id} className="bg-slate-900 rounded-xl p-5 border border-slate-700/50 hover:border-emerald-500/30 transition-colors relative group">
              <button 
                onClick={() => onDeleteFeature(f.id)}
                className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                ✕
              </button>

              <span className="inline-block px-2 py-1 bg-emerald-900/30 border border-emerald-800 text-[10px] font-bold text-emerald-400 uppercase tracking-wider rounded mb-2">
                {f.source}
              </span>
              
              <h4 className="font-bold text-xl text-slate-200 mb-2 pr-8">{f.name}</h4>
              <p className="text-slate-400 text-sm whitespace-pre-wrap">{f.description}</p>
              
              {f.modifiers && Object.keys(f.modifiers).length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                  {Object.entries(f.modifiers).map(([stat, val]) => (
                    <span key={stat} className="text-xs font-bold bg-amber-900/30 text-amber-400 px-2 py-1 rounded border border-amber-700/50">
                      {statNames[stat] || stat}: {val > 0 ? `+${val}` : val}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}