import { useRef, useState } from 'react';
import type { AssignedPlayer } from '../lib/game';

const HOLD_DURATION_MS = 600;
const CIRCLE_RADIUS = 36;
const CIRCUMFERENCE = Math.round(2 * Math.PI * CIRCLE_RADIUS);

interface RevealPhaseProps {
  player: AssignedPlayer;
  themeLabel: string;
  showDefinitions: boolean;
  onContinue: () => void;
}

export default function RevealPhase({ player, themeLabel, showDefinitions, onContinue }: RevealPhaseProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = () => {
    setIsHolding(true);
    holdTimerRef.current = setTimeout(() => {
      setIsRevealed(true);
      setIsHolding(false);
    }, HOLD_DURATION_MS);
  };

  const cancelHold = () => {
    setIsHolding(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  return (
    <div className="text-center space-y-6 animation-scale-in">
      <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl border-2 border-indigo-500 shadow-2xl">
        {themeLabel && (
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 mb-4">
            Tema: {themeLabel}
          </p>
        )}
        {isRevealed ? (
          <>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Tvoja beseda je:</p>
            <h2 className="text-4xl font-black uppercase tracking-wider animation-scale-in">
              {player.role === 'IMPOSTOR' ? (
                <span className="text-red-500">VSILJIVEC</span>
              ) : (
                <span className="text-slate-900 dark:text-slate-100">{player.word}</span>
              )}
            </h2>
            {showDefinitions && player.definition && player.role !== 'IMPOSTOR' && (
              <p className="mt-3 text-sm italic text-slate-500 dark:text-slate-400">
                {player.definition}
              </p>
            )}
          </>
        ) : (
          <div
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onPointerCancel={cancelHold}
            className="select-none cursor-pointer py-6"
            style={{ touchAction: 'none' }}
          >
            <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-4">
              <svg
                className="w-10 h-10 text-slate-400 dark:text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40" cy="40" r={CIRCLE_RADIUS}
                  fill="none" stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth="3"
                />
                <circle
                  cx="40" cy="40" r={CIRCLE_RADIUS}
                  fill="none" stroke="currentColor"
                  className={`text-indigo-500 ${isHolding ? 'hold-progress-circle' : ''}`}
                  strokeWidth="3"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold">Drži za razkritje</p>
          </div>
        )}
      </div>
      {isRevealed && (
        <button
          onClick={onContinue}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-bold text-xl shadow-lg transition-all active:scale-95"
        >
          Skrij in nadaljuj
        </button>
      )}
    </div>
  );
}
