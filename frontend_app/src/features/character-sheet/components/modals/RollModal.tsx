import { formatMod } from '../../../../utils/math';
import type { RollResult } from '../../../../types/character';

interface Props { result: RollResult | null; onClose: () => void; }

export default function RollModal({ result, onClose }: Props) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border-2 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative max-w-sm w-full transform transition-all scale-100">
        <button onClick={onClose} className="absolute top-4 right-5 text-slate-400 hover:text-white text-xl">✕</button>
        <h3 className="text-center font-black text-amber-500 tracking-widest uppercase text-sm mb-6">{result.action}</h3>
        
        <div className="space-y-6">
          {result.hit_roll && (
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-700/50 text-center">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Hit</p>
              <div className="text-4xl font-black mb-1">
                <span className={result.hit_roll?.is_critical ? "text-amber-400" : result.hit_roll?.is_critical_fail ? "text-red-500" : "text-slate-200"}>{result.hit_roll?.d20_face}</span>
                <span className="text-xl text-slate-600 mx-2">{formatMod(result.hit_roll?.bonus)}</span>
                <span className="text-3xl text-blue-400">= {result.hit_roll?.total}</span>
              </div>
              {result.hit_roll?.is_critical && <span className="text-xs font-bold text-amber-400 animate-pulse">CRITICAL HIT!</span>}
              {result.hit_roll?.is_critical_fail && <span className="text-xs font-bold text-red-500">CRITICAL MISS!</span>}
            </div>
          )}
          {result.damage && (
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-red-900/30 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay"></div>
              <p className="text-xs text-red-400 uppercase font-bold mb-1">Damage ({result.damage.type})</p>
              <div className="text-5xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">{result.damage.total}</div>
            </div>
          )}
          {result.effect && (
            <div className="bg-indigo-950/50 rounded-2xl p-4 border border-indigo-900/30 text-center">  
              <p className="text-sm text-indigo-300 font-bold">{result.effect}</p>
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">Great!</button>
      </div>
    </div>
  );
}