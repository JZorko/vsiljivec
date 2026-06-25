interface EndPhaseProps {
  onNewGame: () => void;
}

export default function EndPhase({ onNewGame }: EndPhaseProps) {
  return (
    <div className="text-center space-y-6 animation-fade-in">
      <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 p-8 rounded-3xl">
        <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">Pripravljeni!</h2>
        <p className="text-slate-600 dark:text-slate-300">Vsak naj pove eno asociacijo, nato glasujte o vsiljivcu.</p>
      </div>
      <button
        onClick={onNewGame}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-xl shadow-lg transition-all active:scale-95"
      >
        Nova Igra
      </button>
    </div>
  );
}
