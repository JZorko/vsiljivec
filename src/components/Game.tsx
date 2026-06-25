import { useEffect, useRef, useState } from 'react';
import { WORD_THEMES, ALL_THEMES_ID, getAvailableWordPairs } from '../data/themes';
import type { Theme, Difficulty } from '../data/themes';
import {
  shuffleArray,
  clampCount,
  parseCountInput,
  preventInvalidNumberInput,
  calculateMaxImpostorCount,
  calculateMaxConfusedCount,
  FOCUSABLE_SELECTOR,
  INITIAL_PLAYERS,
} from '../lib/game';
import type { Player, AssignedPlayer, GamePhase } from '../lib/game';
import UsersIcon from './icons/UsersIcon';
import SettingsIcon from './icons/SettingsIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SmartphoneIcon from './icons/SmartphoneIcon';
import HelpCircleIcon from './icons/HelpCircleIcon';

export default function Game() {
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [draggedPlayerIndex, setDraggedPlayerIndex] = useState<number | null>(null);
  const [dropTargetPlayerIndex, setDropTargetPlayerIndex] = useState<number | null>(null);
  const [impostorCount, setImpostorCount] = useState(1);
  const [confusedCount, setConfusedCount] = useState(1);
  const [selectedThemeId, setSelectedThemeId] = useState(ALL_THEMES_ID);
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [gameData, setGameData] = useState<AssignedPlayer[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentThemeLabel, setCurrentThemeLabel] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const helpDialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const nextPlayerIdRef = useRef(INITIAL_PLAYERS.length + 1);
  const activePointerIdRef = useRef<number | null>(null);
  const draggedPlayerIndexRef = useRef<number | null>(null);
  const usePointerDragFallbackRef = useRef(false);

  const getHelpDialogFocusableElements = () =>
    helpDialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) || [];

  useEffect(() => {
    if (!isHelpOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setIsHelpOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !helpDialogRef.current) return;

      const focusableElements = getHelpDialogFocusableElements();
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (!firstFocusable || !lastFocusable) return;

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    const focusableElements = getHelpDialogFocusableElements();
    focusableElements?.[0]?.focus();

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isHelpOpen]);

  useEffect(() => {
    const nextConfusedCount = Math.min(confusedCount, calculateMaxConfusedCount(players.length, impostorCount));
    const nextImpostorCount = Math.min(impostorCount, calculateMaxImpostorCount(players.length, nextConfusedCount));

    if (confusedCount > nextConfusedCount) {
      setConfusedCount(nextConfusedCount);
    }

    if (impostorCount > nextImpostorCount) {
      setImpostorCount(nextImpostorCount);
    }
  }, [players.length]);

  const totalSpecialRoles = impostorCount + confusedCount;
  const maxImpostorOptions = calculateMaxImpostorCount(players.length, confusedCount);
  const maxConfusedOptions = calculateMaxConfusedCount(players.length, impostorCount);
  const selectedTheme: Theme | null = WORD_THEMES.find((theme) => theme.id === selectedThemeId) || null;
  const hasAvailablePairs = getAvailableWordPairs(selectedTheme, difficulty).length > 0;
  const isSetupValid = players.length >= 3 && totalSpecialRoles < players.length && hasAvailablePairs;

  const handleImpostorCountChange = (nextImpostorCount: number) => {
    const safeImpostorCount = clampCount(nextImpostorCount, 0, maxImpostorOptions);
    setImpostorCount(safeImpostorCount);
    const nextMaxConfusedCount = calculateMaxConfusedCount(players.length, safeImpostorCount);
    setConfusedCount((currentConfusedCount) => Math.min(currentConfusedCount, nextMaxConfusedCount));
  };

  const handleConfusedCountChange = (nextConfusedCount: number) => {
    const safeConfusedCount = clampCount(nextConfusedCount, 0, maxConfusedOptions);
    setConfusedCount(safeConfusedCount);
    const nextMaxImpostorCount = calculateMaxImpostorCount(players.length, safeConfusedCount);
    setImpostorCount((currentImpostorCount) => Math.min(currentImpostorCount, nextMaxImpostorCount));
  };

  const handleImpostorInputChange = (value: string) => {
    const parsedValue = parseCountInput(value);
    if (parsedValue === null) return;
    handleImpostorCountChange(parsedValue);
  };

  const handleConfusedInputChange = (value: string) => {
    const parsedValue = parseCountInput(value);
    if (parsedValue === null) return;
    handleConfusedCountChange(parsedValue);
  };

  const addPlayer = () => {
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;
    const nextPlayerId = nextPlayerIdRef.current;
    nextPlayerIdRef.current += 1;
    setPlayers((currentPlayers) => [...currentPlayers, { id: nextPlayerId, name: trimmedName }]);
    setNewPlayerName('');
  };

  const removePlayer = (playerIndex: number) => {
    setPlayers((currentPlayers) => currentPlayers.filter((_, index) => index !== playerIndex));
  };

  const movePlayer = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex === null || toIndex === null) return;
    setPlayers((currentPlayers) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= currentPlayers.length ||
        toIndex >= currentPlayers.length
      ) {
        return currentPlayers;
      }

      const nextPlayers = [...currentPlayers];
      const [movedPlayer] = nextPlayers.splice(fromIndex, 1);
      nextPlayers.splice(toIndex, 0, movedPlayer);
      return nextPlayers;
    });
  };

  const handlePlayerKeyDown = (event: React.KeyboardEvent, playerIndex: number) => {
    if ((event.key === 'ArrowLeft' || event.key === 'ArrowUp') && playerIndex > 0) {
      event.preventDefault();
      movePlayer(playerIndex, playerIndex - 1);
    }

    if ((event.key === 'ArrowRight' || event.key === 'ArrowDown') && playerIndex < players.length - 1) {
      event.preventDefault();
      movePlayer(playerIndex, playerIndex + 1);
    }
  };

  const resetDragState = () => {
    activePointerIdRef.current = null;
    draggedPlayerIndexRef.current = null;
    usePointerDragFallbackRef.current = false;
    setDraggedPlayerIndex(null);
    setDropTargetPlayerIndex(null);
  };

  const getPlayerIndexFromPoint = (clientX: number, clientY: number): number | null => {
    const targetElement = document.elementFromPoint(clientX, clientY)?.closest('[data-player-index]') as HTMLElement | null;
    if (!targetElement) return null;
    const playerIndex = parseInt(targetElement.dataset.playerIndex!, 10);
    return Number.isNaN(playerIndex) ? null : playerIndex;
  };

  const handlePlayerPointerDown = (event: React.PointerEvent, playerIndex: number) => {
    if (event.pointerType === 'mouse') return;
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
    activePointerIdRef.current = event.pointerId;
    draggedPlayerIndexRef.current = playerIndex;
    usePointerDragFallbackRef.current = true;
    setDraggedPlayerIndex(playerIndex);
    setDropTargetPlayerIndex(playerIndex);
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const handlePlayerPointerMove = (event: React.PointerEvent) => {
    if (activePointerIdRef.current !== event.pointerId || draggedPlayerIndexRef.current === null) return;
    const playerIndex = getPlayerIndexFromPoint(event.clientX, event.clientY);
    if (playerIndex !== dropTargetPlayerIndex) {
      setDropTargetPlayerIndex(playerIndex);
    }
  };

  const handlePlayerPointerUp = (event: React.PointerEvent) => {
    if (activePointerIdRef.current !== event.pointerId || draggedPlayerIndexRef.current === null) return;
    const fromIndex = draggedPlayerIndexRef.current;
    const playerIndex = getPlayerIndexFromPoint(event.clientX, event.clientY);
    const toIndex = playerIndex === null ? dropTargetPlayerIndex : playerIndex;
    if (toIndex !== null) {
      movePlayer(fromIndex, toIndex);
    }
    const el = event.currentTarget as HTMLElement;
    if (el.hasPointerCapture?.(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    resetDragState();
  };

  const handlePlayerPointerCancel = (event: React.PointerEvent) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    const el = event.currentTarget as HTMLElement;
    if (el.hasPointerCapture?.(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    resetDragState();
  };

  const startGame = () => {
    if (!isSetupValid) return;
    const availablePairs = getAvailableWordPairs(selectedTheme, difficulty);
    const pair = availablePairs[Math.floor(Math.random() * availablePairs.length)];
    const swap = Math.random() > 0.5;
    const mainWord = swap ? pair.similar : pair.main;
    const similarWord = swap ? pair.main : pair.similar;

    const roles: { type: 'IMPOSTOR' | 'CONFUSED' | 'MAJORITY'; word: string | null }[] = [];
    for (let i = 0; i < impostorCount; i++) roles.push({ type: 'IMPOSTOR', word: null });
    for (let i = 0; i < confusedCount; i++) roles.push({ type: 'CONFUSED', word: similarWord });
    for (let i = 0; i < players.length - totalSpecialRoles; i++) roles.push({ type: 'MAJORITY', word: mainWord });

    const shuffledRoles = shuffleArray(roles);
    const assigned: AssignedPlayer[] = players.map((player, i) => ({
      name: player.name,
      role: shuffledRoles[i].type,
      word: shuffledRoles[i].word,
    }));

    setGameData(assigned);
    setCurrentPlayerIndex(0);
    setCurrentThemeLabel(selectedTheme ? selectedTheme.label : '');
    setPhase('PASS');
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col items-center p-4">
      <header className="pt-8 pb-4 text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-tighter">
          Vsiljivec
        </h1>
      </header>

      <main className="flex-1 max-w-md w-full flex flex-col justify-center">
        {phase === 'SETUP' && (
          <div className="space-y-6 animation-fade-in">
            <button
              aria-label="Odpri pomoč in pravila igre"
              onClick={() => {
                previousFocusRef.current = document.activeElement as HTMLElement;
                setIsHelpOpen(true);
              }}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 py-3 rounded-2xl font-semibold text-slate-700 shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <HelpCircleIcon />
              Kako se igra?
            </button>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <UsersIcon /> Igralci
              </h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addPlayer();
                  }}
                  className="min-w-0 flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2"
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
              <p id="player-order-help" className="mb-3 text-sm text-slate-500">
                Povleci igralce, premakni jih s prstom ali uporabi puščice na tipkovnici, da spremeniš vrstni red
                sedenja.
              </p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                {players.map((player, playerIndex) => (
                  <span
                    key={player.id}
                    data-player-index={playerIndex}
                    draggable={true}
                    onDragStart={(event) => {
                      if (usePointerDragFallbackRef.current) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.setData('text/plain', String(playerIndex));
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggedPlayerIndex(playerIndex);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      if (dropTargetPlayerIndex !== playerIndex) {
                        setDropTargetPlayerIndex(playerIndex);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const fromIndex = parseInt(event.dataTransfer.getData('text/plain'), 10);
                      if (!isNaN(fromIndex)) {
                        movePlayer(fromIndex, playerIndex);
                      }
                      resetDragState();
                    }}
                    onDragEnd={resetDragState}
                    onPointerDown={(event) => handlePlayerPointerDown(event, playerIndex)}
                    onPointerMove={handlePlayerPointerMove}
                    onPointerUp={handlePlayerPointerUp}
                    onPointerCancel={handlePlayerPointerCancel}
                    onKeyDown={(event) => handlePlayerKeyDown(event, playerIndex)}
                    tabIndex={0}
                    role="button"
                    className={`bg-slate-100 px-3 py-1 rounded-full flex items-center gap-2 text-sm border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${dropTargetPlayerIndex === playerIndex ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'} ${draggedPlayerIndex === playerIndex ? 'opacity-60' : ''}`}
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
                      onClick={() => removePlayer(playerIndex)}
                      className="text-red-600 hover:text-red-700 focus-visible:text-red-700 font-bold"
                      aria-label={`Odstrani igralca ${player.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
              <button
                type="button"
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                aria-expanded={isConfigOpen}
                aria-controls="game-configuration-panel"
                className="w-full flex items-center justify-between gap-4 text-left"
              >
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <SettingsIcon /> Konfiguracija igre
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Vsiljivci: {impostorCount} • Zmedeni: {confusedCount} • Tema:{' '}
                    {selectedTheme ? selectedTheme.label : 'Vse teme'} • Besede:{' '}
                    {difficulty === 'HARD' ? 'Težje' : 'Običajne'}
                  </p>
                </div>
                <span className="text-slate-500">
                  <ChevronDownIcon isOpen={isConfigOpen} />
                </span>
              </button>

              {isConfigOpen && (
                <div id="game-configuration-panel" className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">Tema</span>
                    <select
                      value={selectedThemeId}
                      onChange={(event) => setSelectedThemeId(event.target.value)}
                      className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base font-medium text-slate-900"
                      aria-label="Izberi temo"
                    >
                      <option value={ALL_THEMES_ID}>Vse teme (naključno)</option>
                      {WORD_THEMES.map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-sm text-slate-500 leading-6">
                      Izberi temo, če želiš ožji nabor besed in nekoliko lažjo igro za vsiljivce.
                    </p>
                  </label>

                  <fieldset className="block sm:col-span-2">
                    <legend className="text-sm font-semibold text-slate-700">Težavnost besed</legend>
                    <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="difficulty"
                          value="NORMAL"
                          checked={difficulty === 'NORMAL'}
                          onChange={() => setDifficulty('NORMAL')}
                          className="sr-only"
                        />
                        <span
                          className={`block rounded-xl px-4 py-3 text-center text-sm font-bold transition-colors ${difficulty === 'NORMAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Običajne
                        </span>
                      </label>
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="difficulty"
                          value="HARD"
                          checked={difficulty === 'HARD'}
                          onChange={() => setDifficulty('HARD')}
                          className="sr-only"
                        />
                        <span
                          className={`block rounded-xl px-4 py-3 text-center text-sm font-bold transition-colors ${difficulty === 'HARD' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Težje
                        </span>
                      </label>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 leading-6">
                      Vklopi težje pare besed, če želiš manj očitne namige in zahtevnejšo razpravo.
                    </p>
                  </fieldset>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Število vsiljivcev</span>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleImpostorCountChange(impostorCount - 1)}
                        disabled={impostorCount <= 0}
                        className="h-12 w-12 rounded-xl border border-slate-300 bg-white text-xl font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Zmanjšaj število vsiljivcev"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        max={maxImpostorOptions}
                        value={impostorCount}
                        onChange={(event) => handleImpostorInputChange(event.target.value)}
                        onKeyDown={preventInvalidNumberInput}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-center text-lg font-semibold"
                        aria-label="Število vsiljivcev"
                      />
                      <button
                        type="button"
                        onClick={() => handleImpostorCountChange(impostorCount + 1)}
                        disabled={impostorCount >= maxImpostorOptions}
                        className="h-12 w-12 rounded-xl border border-slate-300 bg-white text-xl font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Povečaj število vsiljivcev"
                      >
                        +
                      </button>
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Število zmedenih</span>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfusedCountChange(confusedCount - 1)}
                        disabled={confusedCount <= 0}
                        className="h-12 w-12 rounded-xl border border-slate-300 bg-white text-xl font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Zmanjšaj število zmedenih"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        max={maxConfusedOptions}
                        value={confusedCount}
                        onChange={(event) => handleConfusedInputChange(event.target.value)}
                        onKeyDown={preventInvalidNumberInput}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-center text-lg font-semibold"
                        aria-label="Število zmedenih"
                      />
                      <button
                        type="button"
                        onClick={() => handleConfusedCountChange(confusedCount + 1)}
                        disabled={confusedCount >= maxConfusedOptions}
                        className="h-12 w-12 rounded-xl border border-slate-300 bg-white text-xl font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Povečaj število zmedenih"
                      >
                        +
                      </button>
                    </div>
                  </label>

                  <p className="sm:col-span-2 text-sm text-slate-500 leading-6">
                    Nastavitve se samodejno prilagodijo številu igralcev, da v igri vedno ostane vsaj en običajen
                    igralec.
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={startGame}
              disabled={!isSetupValid}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 py-4 rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95 uppercase"
            >
              Začni Igro
            </button>
          </div>
        )}

        {phase === 'PASS' && (
          <div className="text-center space-y-8 animation-slide-up bg-white p-10 rounded-3xl border border-slate-200 shadow-lg">
            <SmartphoneIcon />
            <div>
              <p className="text-slate-500 uppercase text-xs tracking-widest mb-2">Podaj telefon:</p>
              <h2 className="text-5xl font-black">{gameData[currentPlayerIndex].name}</h2>
            </div>
            <button
              onClick={() => setPhase('REVEAL')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-bold text-xl shadow-xl transition-all active:scale-95"
            >
              Sem {gameData[currentPlayerIndex].name}
            </button>
          </div>
        )}

        {phase === 'REVEAL' && (
          <div className="text-center space-y-6 animation-scale-in">
            <div className="bg-white p-10 rounded-3xl border-2 border-indigo-500 shadow-2xl">
              {currentThemeLabel && (
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600 mb-4">
                  Tema: {currentThemeLabel}
                </p>
              )}
              <p className="text-slate-500 mb-4">Tvoja beseda je:</p>
              <h2 className="text-4xl font-black uppercase tracking-wider">
                {gameData[currentPlayerIndex].role === 'IMPOSTOR' ? (
                  <span className="text-red-500">VSILJIVEC</span>
                ) : (
                  gameData[currentPlayerIndex].word
                )}
              </h2>
            </div>
            <button
              onClick={() => {
                if (currentPlayerIndex + 1 < gameData.length) {
                  setCurrentPlayerIndex(currentPlayerIndex + 1);
                  setPhase('PASS');
                } else {
                  setPhase('END');
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-bold text-xl shadow-lg transition-all active:scale-95"
            >
              Skrij in nadaljuj
            </button>
          </div>
        )}

        {phase === 'END' && (
          <div className="text-center space-y-6 animation-fade-in">
            <div className="bg-emerald-50 border border-emerald-300 p-8 rounded-3xl">
              <h2 className="text-3xl font-bold text-emerald-600 mb-2">Pripravljeni!</h2>
              <p className="text-slate-600">Vsak naj pove eno asociacijo, nato glasujte o vsiljivcu.</p>
            </div>
            <button
              onClick={() => setPhase('SETUP')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-xl shadow-lg transition-all active:scale-95"
            >
              Nova Igra
            </button>
          </div>
        )}
      </main>

      {isHelpOpen && (
        <div
          onClick={() => setIsHelpOpen(false)}
          className="fixed inset-0 z-10 bg-slate-900/30 backdrop-blur-sm p-4 flex items-center justify-center"
        >
          <div
            ref={helpDialogRef}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-dialog-title"
            aria-describedby="help-dialog-description"
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-5 animation-scale-in"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="help-dialog-title" className="text-2xl font-black text-slate-900">
                  Kako igrati
                </h2>
                <p id="help-dialog-description" className="text-slate-500 text-sm mt-1">
                  Hitra družabna igra socialne dedukcije.
                </p>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
                aria-label="Zapri pomoč"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <h3 className="font-bold text-indigo-600">Kaj je Vsiljivec?</h3>
              <p className="text-slate-600 text-sm leading-6">
                Večina igralcev dobi isto skrivno besedo, nekateri pa dobijo podobno besedo ali pa nobene. Cilj skupine
                je odkriti vsiljivca, cilj vsiljivca pa je, da ostane neodkrit.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-indigo-600">Vloge</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <span className="font-semibold text-slate-900">Večina:</span> prejme glavno besedo.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Zmeden:</span> prejme podobno, a drugačno besedo.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Vsiljivec:</span> ne prejme nobene besede in mora
                  improvizirati.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-indigo-600">Pravila</h3>
              <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
                <li>Dodajte vse igralce, po želji izberite temo in začnite igro.</li>
                <li>Vsak igralec po vrsti vzame telefon, razkrije svojo besedo in ga poda naprej.</li>
                <li>Ko vsi vidijo svojo vlogo, vsak pove eno asociacijo na svojo besedo.</li>
                <li>Skupaj glasujte, kdo je po vašem mnenju vsiljivec.</li>
                <li>Po glasovanju začnite novo rundo.</li>
              </ol>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-2xl font-bold transition-colors shadow-lg"
            >
              Zapri pomoč
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
