import { useRef, useState } from 'react';
import { WORD_THEMES, ALL_THEMES_ID, getAvailableWordPairs } from '../data/themes';
import type { Theme, Difficulty } from '../data/themes';
import { preventInvalidNumberInput, parseCountInput } from '../lib/game';
import type { Player } from '../lib/game';
import UsersIcon from './icons/UsersIcon';
import SettingsIcon from './icons/SettingsIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import HelpCircleIcon from './icons/HelpCircleIcon';

interface SetupPhaseProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  nextPlayerIdRef: React.MutableRefObject<number>;
  impostorCount: number;
  confusedCount: number;
  maxImpostorOptions: number;
  maxConfusedOptions: number;
  onImpostorCountChange: (count: number) => void;
  onConfusedCountChange: (count: number) => void;
  selectedThemeId: string;
  onThemeChange: (id: string) => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  showDefinitions: boolean;
  onShowDefinitionsChange: (v: boolean) => void;
  isSetupValid: boolean;
  onStartGame: () => void;
  onOpenHelp: () => void;
}

export default function SetupPhase({
  players,
  setPlayers,
  nextPlayerIdRef,
  impostorCount,
  confusedCount,
  maxImpostorOptions,
  maxConfusedOptions,
  onImpostorCountChange,
  onConfusedCountChange,
  selectedThemeId,
  onThemeChange,
  difficulty,
  onDifficultyChange,
  showDefinitions,
  onShowDefinitionsChange,
  isSetupValid,
  onStartGame,
  onOpenHelp,
}: SetupPhaseProps) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [draggedPlayerIndex, setDraggedPlayerIndex] = useState<number | null>(null);
  const [dropTargetPlayerIndex, setDropTargetPlayerIndex] = useState<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const draggedPlayerIndexRef = useRef<number | null>(null);
  const usePointerDragFallbackRef = useRef(false);

  const selectedTheme: Theme | null = WORD_THEMES.find((t) => t.id === selectedThemeId) || null;
  const hasAvailablePairs = getAvailableWordPairs(selectedTheme, difficulty).length > 0;

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;
    const id = nextPlayerIdRef.current;
    nextPlayerIdRef.current += 1;
    setPlayers((prev) => [...prev, { id, name: trimmedName }]);
    setNewPlayerName('');
  };

  const clearPlayers = () => {
    setPlayers([]);
    nextPlayerIdRef.current = 1;
  };

  const removePlayer = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const movePlayer = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setPlayers((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const resetDragState = () => {
    activePointerIdRef.current = null;
    draggedPlayerIndexRef.current = null;
    usePointerDragFallbackRef.current = false;
    setDraggedPlayerIndex(null);
    setDropTargetPlayerIndex(null);
  };

  const getPlayerIndexFromPoint = (clientX: number, clientY: number): number | null => {
    const el = document.elementFromPoint(clientX, clientY)?.closest('[data-player-index]') as HTMLElement | null;
    if (!el) return null;
    const idx = parseInt(el.dataset.playerIndex!, 10);
    return Number.isNaN(idx) ? null : idx;
  };

  const handlePlayerKeyDown = (event: React.KeyboardEvent, index: number) => {
    if ((event.key === 'ArrowLeft' || event.key === 'ArrowUp') && index > 0) {
      event.preventDefault();
      movePlayer(index, index - 1);
    }
    if ((event.key === 'ArrowRight' || event.key === 'ArrowDown') && index < players.length - 1) {
      event.preventDefault();
      movePlayer(index, index + 1);
    }
  };

  const handlePointerDown = (event: React.PointerEvent, index: number) => {
    if (event.pointerType === 'mouse') return;
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
    activePointerIdRef.current = event.pointerId;
    draggedPlayerIndexRef.current = index;
    usePointerDragFallbackRef.current = true;
    setDraggedPlayerIndex(index);
    setDropTargetPlayerIndex(index);
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (activePointerIdRef.current !== event.pointerId || draggedPlayerIndexRef.current === null) return;
    const idx = getPlayerIndexFromPoint(event.clientX, event.clientY);
    if (idx !== dropTargetPlayerIndex) setDropTargetPlayerIndex(idx);
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (activePointerIdRef.current !== event.pointerId || draggedPlayerIndexRef.current === null) return;
    const fromIndex = draggedPlayerIndexRef.current;
    const idx = getPlayerIndexFromPoint(event.clientX, event.clientY);
    const toIndex = idx === null ? dropTargetPlayerIndex : idx;
    if (toIndex !== null) movePlayer(fromIndex, toIndex);
    const el = event.currentTarget as HTMLElement;
    if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId);
    resetDragState();
  };

  const handlePointerCancel = (event: React.PointerEvent) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    const el = event.currentTarget as HTMLElement;
    if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId);
    resetDragState();
  };

  const handleImpostorInput = (value: string) => {
    const parsed = parseCountInput(value);
    if (parsed !== null) onImpostorCountChange(parsed);
  };

  const handleConfusedInput = (value: string) => {
    const parsed = parseCountInput(value);
    if (parsed !== null) onConfusedCountChange(parsed);
  };

  return (
    <div className="space-y-6 animation-fade-in">
      <button
        aria-label="Odpri pomoč in pravila igre"
        onClick={onOpenHelp}
        className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 py-3 rounded-2xl font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors flex items-center justify-center gap-2"
      >
        <HelpCircleIcon />
        Kako se igra?
      </button>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <UsersIcon /> Igralci
          </h2>
          {players.length > 0 && (
            <button
              onClick={clearPlayers}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label="Počisti vse igralce"
            >
              Počisti
            </button>
          )}
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addPlayer(); }}
            className="min-w-0 flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="Ime..."
            aria-label="Ime igralca"
          />
          <button
            onClick={addPlayer}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl font-bold shadow-md transition-all active:scale-95"
          >
            Dodaj
          </button>
        </div>
        <p id="player-order-help" className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Povleci igralce, premakni jih s prstom ali uporabi puščice na tipkovnici, da spremeniš vrstni red sedenja.
        </p>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
          {players.map((player, index) => (
            <span
              key={player.id}
              data-player-index={index}
              draggable={true}
              onDragStart={(event) => {
                if (usePointerDragFallbackRef.current) { event.preventDefault(); return; }
                event.dataTransfer.setData('text/plain', String(index));
                event.dataTransfer.effectAllowed = 'move';
                setDraggedPlayerIndex(index);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                if (dropTargetPlayerIndex !== index) setDropTargetPlayerIndex(index);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const fromIndex = parseInt(event.dataTransfer.getData('text/plain'), 10);
                if (!isNaN(fromIndex)) movePlayer(fromIndex, index);
                resetDragState();
              }}
              onDragEnd={resetDragState}
              onPointerDown={(event) => handlePointerDown(event, index)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onKeyDown={(event) => handlePlayerKeyDown(event, index)}
              tabIndex={0}
              role="button"
              className={`bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 text-slate-900 dark:text-slate-100 ${dropTargetPlayerIndex === index ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-slate-300 dark:border-slate-600'} ${draggedPlayerIndex === index ? 'opacity-60' : ''}`}
              aria-label={`Igralec ${player.name}. Povleci za spremembo vrstnega reda ali uporabi puščice na tipkovnici.`}
              aria-describedby="player-order-help"
              style={{ touchAction: 'none' }}
            >
              <span className="cursor-grab active:cursor-grabbing">
                <span aria-hidden="true">☰ </span>
                {player.name}
                <span className="sr-only"> Povleci za spremembo vrstnega reda.</span>
              </span>
              <button
                onClick={() => removePlayer(index)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold"
                aria-label={`Odstrani igralca ${player.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xl">
        <button
          type="button"
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          aria-expanded={isConfigOpen}
          aria-controls="game-configuration-panel"
          className="w-full flex items-center justify-between gap-4 text-left"
        >
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <SettingsIcon /> Konfiguracija igre
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Vsiljivci: {impostorCount} • Zmedeni: {confusedCount} • Tema:{' '}
              {selectedTheme ? selectedTheme.label : 'Vse teme'} • Besede:{' '}
              {difficulty === 'EASY' ? 'Lahke' : difficulty === 'HARD' ? 'Težje' : 'Običajne'}
            </p>
          </div>
          <span className="text-slate-500 dark:text-slate-400">
            <ChevronDownIcon isOpen={isConfigOpen} />
          </span>
        </button>

        {isConfigOpen && (
          <div id="game-configuration-panel" className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tema</span>
              <select
                value={selectedThemeId}
                onChange={(e) => onThemeChange(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 text-base font-medium text-slate-900 dark:text-slate-100"
                aria-label="Izberi temo"
              >
                <option value={ALL_THEMES_ID}>Vse teme (naključno)</option>
                {WORD_THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>{theme.label}</option>
                ))}
              </select>
              {!hasAvailablePairs && (
                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                  Za izbrano temo in težavnost ni na voljo besednih parov.
                </p>
              )}
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-6">
                Izberi temo, če želiš ožji nabor besed in nekoliko lažjo igro za vsiljivce.
              </p>
            </label>

            <fieldset className="block sm:col-span-2">
              <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">Težavnost besed</legend>
              <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 dark:bg-slate-700 p-1">
                <label className="cursor-pointer">
                  <input type="radio" name="difficulty" value="EASY" checked={difficulty === 'EASY'} onChange={() => onDifficultyChange('EASY')} className="sr-only" />
                  <span className={`block rounded-xl px-4 py-3 text-center text-sm font-bold transition-colors ${difficulty === 'EASY' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                    Lahke
                  </span>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="difficulty" value="NORMAL" checked={difficulty === 'NORMAL'} onChange={() => onDifficultyChange('NORMAL')} className="sr-only" />
                  <span className={`block rounded-xl px-4 py-3 text-center text-sm font-bold transition-colors ${difficulty === 'NORMAL' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                    Običajne
                  </span>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="difficulty" value="HARD" checked={difficulty === 'HARD'} onChange={() => onDifficultyChange('HARD')} className="sr-only" />
                  <span className={`block rounded-xl px-4 py-3 text-center text-sm font-bold transition-colors ${difficulty === 'HARD' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                    Težje
                  </span>
                </label>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-6">
                Lahke besede so primerne za mlajše igralce. Težje pare besed ponujajo manj očitne namige.
              </p>
            </fieldset>

            <div className="flex items-center justify-between gap-4 sm:col-span-2">
              <div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Prikaži razlage besed</span>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-6">
                  Ob besedi prikaži kratek opis, da vsi vedo, o čem je govora.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showDefinitions}
                onClick={() => onShowDefinitionsChange(!showDefinitions)}
                className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full transition-colors ${showDefinitions ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${showDefinitions ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Število vsiljivcev</span>
              <div className="mt-2 flex items-center gap-2">
                <button type="button" onClick={() => onImpostorCountChange(impostorCount - 1)} disabled={impostorCount <= 0}
                  className="h-12 w-12 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Zmanjšaj število vsiljivcev">−</button>
                <input type="number" inputMode="numeric" min="0" step="1" max={maxImpostorOptions} value={impostorCount}
                  onChange={(e) => handleImpostorInput(e.target.value)} onKeyDown={preventInvalidNumberInput}
                  className="h-12 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 text-center text-lg font-semibold text-slate-900 dark:text-slate-100"
                  aria-label="Število vsiljivcev" />
                <button type="button" onClick={() => onImpostorCountChange(impostorCount + 1)} disabled={impostorCount >= maxImpostorOptions}
                  className="h-12 w-12 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Povečaj število vsiljivcev">+</button>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Število zmedenih</span>
              <div className="mt-2 flex items-center gap-2">
                <button type="button" onClick={() => onConfusedCountChange(confusedCount - 1)} disabled={confusedCount <= 0}
                  className="h-12 w-12 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Zmanjšaj število zmedenih">−</button>
                <input type="number" inputMode="numeric" min="0" step="1" max={maxConfusedOptions} value={confusedCount}
                  onChange={(e) => handleConfusedInput(e.target.value)} onKeyDown={preventInvalidNumberInput}
                  className="h-12 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 text-center text-lg font-semibold text-slate-900 dark:text-slate-100"
                  aria-label="Število zmedenih" />
                <button type="button" onClick={() => onConfusedCountChange(confusedCount + 1)} disabled={confusedCount >= maxConfusedOptions}
                  className="h-12 w-12 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Povečaj število zmedenih">+</button>
              </div>
            </label>

            <p className="sm:col-span-2 text-sm text-slate-500 dark:text-slate-400 leading-6">
              Nastavitve se samodejno prilagodijo številu igralcev, da v igri vedno ostane vsaj en običajen igralec.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onStartGame}
        disabled={!isSetupValid}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 py-4 rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95 uppercase"
      >
        Začni Igro
      </button>
    </div>
  );
}
