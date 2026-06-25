export function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function clampCount(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function parseCountInput(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  return Number.parseInt(value, 10);
}

export function preventInvalidNumberInput(event: React.KeyboardEvent): void {
  if (['e', 'E', '+', '-', '.', ','].includes(event.key)) {
    event.preventDefault();
  }
}

export function calculateMaxImpostorCount(playerCount: number, currentConfusedCount: number): number {
  return Math.max(0, playerCount - currentConfusedCount - 1);
}

export function calculateMaxConfusedCount(playerCount: number, currentImpostorCount: number): number {
  return Math.max(0, playerCount - currentImpostorCount - 1);
}

const PLAYERS_STORAGE_KEY = 'vsiljivec-players';
const SETTINGS_STORAGE_KEY = 'vsiljivec-settings';
const DARK_MODE_KEY = 'vsiljivec-dark-mode';

export function loadPlayers(): Player[] | null {
  try {
    const stored = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (!parsed.every((p: unknown) => typeof p === 'object' && p !== null && typeof (p as Player).id === 'number' && typeof (p as Player).name === 'string')) return null;
    return parsed as Player[];
  } catch {
    return null;
  }
}

export function savePlayers(players: Player[]): void {
  try {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
  } catch {}
}

export interface GameSettings {
  impostorCount: number;
  confusedCount: number;
  selectedThemeId: string;
  difficulty: string;
}

export function loadSettings(): GameSettings | null {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (typeof parsed.impostorCount !== 'number' || typeof parsed.confusedCount !== 'number') return null;
    if (typeof parsed.selectedThemeId !== 'string') return null;
    if (parsed.difficulty !== 'NORMAL' && parsed.difficulty !== 'HARD') return null;
    return parsed as GameSettings;
  } catch {
    return null;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export function saveDarkMode(isDark: boolean): void {
  try {
    localStorage.setItem(DARK_MODE_KEY, isDark ? 'dark' : 'light');
  } catch {}
}


export interface Player {
  id: number;
  name: string;
}

export type RoleType = 'IMPOSTOR' | 'CONFUSED' | 'MAJORITY';

export interface AssignedPlayer {
  name: string;
  role: RoleType;
  word: string | null;
}

export type GamePhase = 'SETUP' | 'PASS' | 'REVEAL' | 'END';

export const INITIAL_PLAYERS: Player[] = [
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Bojan' },
  { id: 3, name: 'Cene' },
  { id: 4, name: 'Darja' },
];
