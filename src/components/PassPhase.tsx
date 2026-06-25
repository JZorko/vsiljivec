import SmartphoneIcon from './icons/SmartphoneIcon';

interface PassPhaseProps {
  playerName: string;
  onConfirm: () => void;
}

export default function PassPhase({ playerName, onConfirm }: PassPhaseProps) {
  return (
    <div className="text-center space-y-8 animation-slide-up bg-white dark:bg-slate-800 p-10 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg">
      <SmartphoneIcon />
      <div>
        <p className="text-slate-500 dark:text-slate-400 uppercase text-xs tracking-widest mb-2">Podaj telefon:</p>
        <h2 className="text-5xl font-black text-slate-900 dark:text-slate-100">{playerName}</h2>
      </div>
      <button
        onClick={onConfirm}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-bold text-xl shadow-xl transition-all active:scale-95"
      >
        Sem {playerName}
      </button>
    </div>
  );
}
