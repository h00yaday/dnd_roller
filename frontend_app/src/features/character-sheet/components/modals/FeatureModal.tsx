import { useEffect, useRef, useState } from 'react';
import type { FeatureCreatePayload } from '../../../../types/character';

const SEARCH_DEBOUNCE_MS = 800;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_SIZE = 40;

interface Props { 
  onClose: () => void; 
  onSubmit: (data: FeatureCreatePayload) => Promise<void>; 
}

export default function FeatureModal({ onClose, onSubmit }: Props) {
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    source: 'Class Feature', 
    modifiers: {} as Record<string, number> 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<Record<string, unknown>>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchCacheRef = useRef(new Map<string, { expiresAt: number; value: Array<Record<string, unknown>> }>());
  const searchAbortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(new Map<string, Promise<Array<Record<string, unknown>>>>());

  const [tempStat, setTempStat] = useState('strength');
  const [tempVal, setTempVal] = useState('');

  const extractModifiersFromText = (text: string): Record<string, number> => {
    const mods: Record<string, number> = {};
    const lowerText = text.toLowerCase();

    const statPatterns = [
      { key: 'strength', regex: /(?:strength|сила|силу).*?\+(\d)/i },
      { key: 'dexterity', regex: /(?:dexterity|ловкость|ловкости).*?\+(\d)/i },
      { key: 'constitution', regex: /(?:constitution|телосложение|телосложению).*?\+(\d)/i },
      { key: 'intelligence', regex: /(?:intelligence|интеллект|интеллекту).*?\+(\d)/i },
      { key: 'wisdom', regex: /(?:wisdom|мудрость|мудрости).*?\+(\d)/i },
      { key: 'charisma', regex: /(?:charisma|харизма|харизме).*?\+(\d)/i },
      { key: 'speed', regex: /(?:speed|скорость).*?(?:increases by|\+)\s*(\d+)/i },
      { key: 'max_hp', regex: /(?:hit point maximum|максимум хитов).*?(?:increases by|\+)\s*(\d+)/i },
      { key: 'armor_class', regex: /(?:armor class|класс доспеха|ac).*?\+(\d)/i }
    ];

    statPatterns.forEach(({ key, regex }) => {
      const match = lowerText.match(regex);
      if (match && match[1]) mods[key] = parseInt(match[1], 10);
    });

    return mods;
  };

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]); 
      return;
    }

    const cached = searchCacheRef.current.get(searchQuery);
    if (cached && cached.expiresAt > Date.now()) {
      setSearchResults(cached.value);
      return;
    }

    const delay = setTimeout(async () => {
      searchAbortRef.current?.abort();
      const abortController = new AbortController();
      searchAbortRef.current = abortController;
      setIsSearching(true);
      try {
        let request = inFlightRef.current.get(searchQuery);
        if (!request) {
          request = (async () => {
            const [featsRes, bgRes] = await Promise.all([
              fetch(`https://api.open5e.com/v1/feats/?search=${searchQuery}`, { signal: abortController.signal }),
              fetch(`https://api.open5e.com/v1/backgrounds/?search=${searchQuery}`, { signal: abortController.signal })
            ]);
            const featsData = await featsRes.json();
            const bgData = await bgRes.json();
            return [
              ...(featsData.results || []).map((item: Record<string, unknown>) => ({ ...item, route: 'Feat' })),
              ...(bgData.results || []).map((item: Record<string, unknown>) => ({ ...item, route: 'Background' }))
            ].slice(0, 10);
          })();
          inFlightRef.current.set(searchQuery, request);
        }

        const combined = await request;
        inFlightRef.current.delete(searchQuery);

        if (searchCacheRef.current.size >= CACHE_MAX_SIZE) {
          const oldestKey = searchCacheRef.current.keys().next().value;
          if (oldestKey) searchCacheRef.current.delete(oldestKey);
        }
        searchCacheRef.current.set(searchQuery, {
          value: combined,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        setSearchResults(combined);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          console.error("Search error", e);
        }
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(delay);
    };
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
    };
  }, []);

  const handleSelectResult = (item: Record<string, unknown>) => {
    const description = (item.desc as string | undefined) || '';
    const extractedMods = extractModifiersFromText(description);

    setForm({
      name: String(item.name || ''),
      source: String(item.route || 'Other'),
      description: description,
      modifiers: { ...extractedMods, ...form.modifiers }
    });
    
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleAddModifier = () => {
    const val = parseInt(tempVal);
    if (!isNaN(val) && val !== 0) {
      setForm({ ...form, modifiers: { ...form.modifiers, [tempStat]: val } });
      setTempVal(''); 
    }
  };

  const handleRemoveModifier = (stat: string) => {
    const newMods = { ...form.modifiers };
    delete newMods[stat];
    setForm({ ...form, modifiers: newMods });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true);
    await onSubmit(form);
    setIsSubmitting(false); 
    onClose();
  };

  const statNames: Record<string, string> = {
    strength: "Strength", dexterity: "Dexterity", constitution: "Constitution",
    intelligence: "Intelligence", wisdom: "Wisdom", charisma: "Charisma",
    armor_class: "Armor Class (AC)", speed: "Speed", max_hp: "Max HP",
    initiative_bonus: "Initiative"
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h3 className="text-xl font-black text-emerald-400 mb-6 uppercase tracking-wider">Add Feature</h3>
        
        <div className="mb-6 relative bg-slate-900/50 p-4 rounded-xl border border-emerald-900/50">
          <label className="block text-xs text-emerald-500 font-bold uppercase mb-1">Quick Search (D&D 5e Database)</label>
          <input 
            type="text" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="w-full p-2 bg-slate-900 border border-emerald-700/50 rounded-lg text-slate-200 outline-none focus:border-emerald-400" 
            placeholder="Enter name (e.g., Mobile, Acolyte)..." 
          />
          {isSearching && <p className="text-[10px] text-slate-400 mt-1 absolute">Searching the scrolls...</p>}
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-emerald-700/50 rounded-lg shadow-2xl z-10 max-h-48 overflow-y-auto">
              {searchResults.map((res, idx) => (
                <button 
                  key={idx} type="button" onClick={() => handleSelectResult(res)}
                  className="w-full text-left p-3 hover:bg-emerald-900/40 text-slate-200 text-sm border-b border-slate-700/50 last:border-0 transition-colors"
                >
                  <span className="font-bold text-emerald-400">{String(res.name)}</span> <span className="text-xs text-slate-400 ml-2">({String(res.route)})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Name</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-emerald-500" placeholder="Darkvision" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Type (Source)</label>
              <select required value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-emerald-500">
                <option value="Class Feature">🛡️ Class</option>
                <option value="Racial Trait">🧬 Race</option>
                <option value="Background">📜 Background</option>
                <option value="Feat">✨ Feat</option>
                <option value="Boon / Curse">💀 Boon / Curse</option>
                <option value="Other">📌 Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Description (Editable)</label>
            <textarea 
              required 
              value={form.description} 
              onChange={e => {
                const newText = e.target.value;
                setForm(prev => ({
                  ...prev,
                  description: newText,
                  modifiers: { ...extractModifiersFromText(newText), ...prev.modifiers }
                }));
              }} 
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-emerald-500 h-28 resize-none text-sm" 
              placeholder="How does it work? What does it do?" 
            />
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
            <div className="flex justify-between items-end mb-2">
              <label className="block text-xs text-amber-500 font-bold uppercase">Mechanical Bonuses</label>
            </div>
            
            <div className="flex gap-2 mb-3">
              <select value={tempStat} onChange={e => setTempStat(e.target.value)} className="bg-slate-800 border border-slate-600 text-slate-200 p-2 rounded flex-1 outline-none text-sm">
                {Object.entries(statNames).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <input type="number" value={tempVal} onChange={e => setTempVal(e.target.value)} placeholder="0" className="bg-slate-800 border border-slate-600 text-slate-200 p-2 rounded w-16 outline-none text-center" />
              <button type="button" onClick={handleAddModifier} className="bg-slate-700 hover:bg-slate-600 px-3 rounded text-amber-400 font-black transition-colors">+</button>
            </div>
            
            {Object.keys(form.modifiers).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(form.modifiers).map(([stat, val]) => (
                  <span key={stat} className="text-xs font-bold bg-amber-900/30 text-amber-400 px-2 py-1 rounded border border-amber-700/50 flex items-center gap-2">
                    {statNames[stat] || stat}: {val > 0 ? `+${val}` : val}
                    <button type="button" onClick={() => handleRemoveModifier(stat)} className="text-red-400 hover:text-red-300">✕</button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic">No active modifiers. Stats will not change.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-bold transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting || !form.name} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold disabled:opacity-50 transition-colors">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}