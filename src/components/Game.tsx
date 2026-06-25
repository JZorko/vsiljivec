import { useEffect, useRef, useState } from 'react';
import { WORD_THEMES, ALL_THEMES_ID, getAvailableWordPairs } from '../data/themes';
import type { Theme, Difficulty } from '../data/themes';
import {
  shuffleArray,
  clampCount,
  calculateMaxImpostorCount,
  calculateMaxConfusedCount,
  INITIAL_PLAYERS,
  loadPlayers,
  savePlayers,
  loadSettings,
  saveSettings,
  saveDarkMode,
} from '../lib/game';
import type { Player, AssignedPlayer, GamePhase } from '../lib/game';
import SetupPhase from './SetupPhase';
import PassPhase from './PassPhase';
import RevealPhase from './RevealPhase';
import EndPhase from './EndPhase';
import HelpDialog from './HelpDialog';

export default function Game() {
  const savedSettings = loadSettings();

  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [players, setPlayers] = useState<Player[]>(() => loadPlayers() ?? INITIAL_PLAYERS);
  const [impostorCount, setImpostorCount] = useState(savedSettings?.impostorCount ?? 1);
  const [confusedCount, setConfusedCount] = useState(savedSettings?.confusedCount ?? 1);
  const [selectedThemeId, setSelectedThemeId] = useState(savedSettings?.selectedThemeId ?? ALL_THEMES_ID);
  const [difficulty, setDifficulty] = useState<Difficulty>((savedSettings?.difficulty as Difficulty) ?? 'NORMAL');
  const [gameData, setGameData] = useState<AssignedPlayer[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentThemeLabel, setCurrentThemeLabel] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try { return document.documentElement.classList.contains('dark'); } catch { return false; }
  });
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const nextPlayerIdRef = useRef(
    Math.max(...(loadPlayers() ?? INITIAL_PLAYERS).map((p) => p.id)) + 1
  );

  useEffect(() => {
    savePlayers(players);
  }, [players]);

  useEffect(() => {
    saveSettings({ impostorCount, confusedCount, selectedThemeId, difficulty });
  }, [impostorCount, confusedCount, selectedThemeId, difficulty]);

  useEffect(() => {
    const nextConfusedCount = Math.min(confusedCount, calculateMaxConfusedCount(players.length, impostorCount));
    const nextImpostorCount = Math.min(impostorCount, calculateMaxImpostorCount(players.length, nextConfusedCount));
    if (confusedCount > nextConfusedCount) setConfusedCount(nextConfusedCount);
    if (impostorCount > nextImpostorCount) setImpostorCount(nextImpostorCount);
  }, [players.length]);

  useEffect(() => {
    if (isHelpOpen) return;
    previousFocusRef.current?.focus?.();
  }, [isHelpOpen]);

  const totalSpecialRoles = impostorCount + confusedCount;
  const maxImpostorOptions = calculateMaxImpostorCount(players.length, confusedCount);
  const maxConfusedOptions = calculateMaxConfusedCount(players.length, impostorCount);
  const selectedTheme: Theme | null = WORD_THEMES.find((theme) => theme.id === selectedThemeId) || null;
  const hasAvailablePairs = getAvailableWordPairs(selectedTheme, difficulty).length > 0;
  const isSetupValid = players.length >= 3 && totalSpecialRoles < players.length && hasAvailablePairs;

  const handleImpostorCountChange = (nextImpostorCount: number) => {
    const safe = clampCount(nextImpostorCount, 0, maxImpostorOptions);
    setImpostorCount(safe);
    const nextMax = calculateMaxConfusedCount(players.length, safe);
    setConfusedCount((prev) => Math.min(prev, nextMax));
  };

  const handleConfusedCountChange = (nextConfusedCount: number) => {
    const safe = clampCount(nextConfusedCount, 0, maxConfusedOptions);
    setConfusedCount(safe);
    const nextMax = calculateMaxImpostorCount(players.length, safe);
    setImpostorCount((prev) => Math.min(prev, nextMax));
  };

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    saveDarkMode(next);
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

  const handleRevealContinue = () => {
    if (currentPlayerIndex + 1 < gameData.length) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setPhase('PASS');
    } else {
      setPhase('END');
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col items-center p-4 transition-colors">
      <header className="pt-8 pb-4 text-center w-full max-w-md flex items-center justify-between">
        <div className="w-10" />
        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent uppercase tracking-tighter">
          Vsiljivec
        </h1>
        <button
          onClick={toggleDarkMode}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label={isDark ? 'Preklopi na svetli način' : 'Preklopi na temni način'}
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </header>

      <main className="flex-1 max-w-md w-full flex flex-col justify-center">
        {phase === 'SETUP' && (
          <SetupPhase
            players={players}
            setPlayers={setPlayers}
            nextPlayerIdRef={nextPlayerIdRef}
            impostorCount={impostorCount}
            confusedCount={confusedCount}
            maxImpostorOptions={maxImpostorOptions}
            maxConfusedOptions={maxConfusedOptions}
            onImpostorCountChange={handleImpostorCountChange}
            onConfusedCountChange={handleConfusedCountChange}
            selectedThemeId={selectedThemeId}
            onThemeChange={setSelectedThemeId}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            isSetupValid={isSetupValid}
            onStartGame={startGame}
            onOpenHelp={() => {
              previousFocusRef.current = document.activeElement as HTMLElement;
              setIsHelpOpen(true);
            }}
          />
        )}

        {phase === 'PASS' && (
          <PassPhase
            playerName={gameData[currentPlayerIndex].name}
            onConfirm={() => setPhase('REVEAL')}
          />
        )}

        {phase === 'REVEAL' && (
          <RevealPhase
            key={currentPlayerIndex}
            player={gameData[currentPlayerIndex]}
            themeLabel={currentThemeLabel}
            onContinue={handleRevealContinue}
          />
        )}

        {phase === 'END' && (
          <EndPhase onNewGame={() => setPhase('SETUP')} />
        )}
      </main>

      <HelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
