import { describe, it, expect, beforeEach } from 'vitest';
import {
  shuffleArray,
  clampCount,
  parseCountInput,
  calculateMaxImpostorCount,
  calculateMaxConfusedCount,
  loadPlayers,
  savePlayers,
  INITIAL_PLAYERS,
} from './game';
import type { Player } from './game';

describe('shuffleArray', () => {
  it('returns an array with the same elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
    expect(result.sort()).toEqual(input.sort());
  });

  it('does not mutate the original array', () => {
    const input = [1, 2, 3];
    const copy = [...input];
    shuffleArray(input);
    expect(input).toEqual(copy);
  });

  it('returns an empty array for empty input', () => {
    expect(shuffleArray([])).toEqual([]);
  });
});

describe('clampCount', () => {
  it('returns value when within range', () => {
    expect(clampCount(3, 0, 5)).toBe(3);
  });

  it('clamps to min', () => {
    expect(clampCount(-1, 0, 5)).toBe(0);
  });

  it('clamps to max', () => {
    expect(clampCount(10, 0, 5)).toBe(5);
  });
});

describe('parseCountInput', () => {
  it('parses valid digit strings', () => {
    expect(parseCountInput('0')).toBe(0);
    expect(parseCountInput('5')).toBe(5);
    expect(parseCountInput('42')).toBe(42);
  });

  it('returns null for non-digit strings', () => {
    expect(parseCountInput('')).toBeNull();
    expect(parseCountInput('abc')).toBeNull();
    expect(parseCountInput('-1')).toBeNull();
    expect(parseCountInput('1.5')).toBeNull();
    expect(parseCountInput('3e2')).toBeNull();
  });
});

describe('calculateMaxImpostorCount', () => {
  it('leaves at least 1 normal player', () => {
    expect(calculateMaxImpostorCount(5, 0)).toBe(4);
    expect(calculateMaxImpostorCount(5, 2)).toBe(2);
  });

  it('returns 0 when no room', () => {
    expect(calculateMaxImpostorCount(1, 0)).toBe(0);
    expect(calculateMaxImpostorCount(2, 0)).toBe(0);
    expect(calculateMaxImpostorCount(3, 3)).toBe(0);
  });
});

describe('calculateMaxConfusedCount', () => {
  it('leaves at least 1 normal player', () => {
    expect(calculateMaxConfusedCount(5, 1)).toBe(3);
  });

  it('returns 0 when no room', () => {
    expect(calculateMaxConfusedCount(1, 0)).toBe(0);
    expect(calculateMaxConfusedCount(2, 0)).toBe(0);
  });
});

describe('loadPlayers / savePlayers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(loadPlayers()).toBeNull();
  });

  it('round-trips a valid player list', () => {
    const players: Player[] = [
      { id: 1, name: 'Ana' },
      { id: 2, name: 'Bojan' },
    ];
    savePlayers(players);
    expect(loadPlayers()).toEqual(players);
  });

  it('returns null for an empty array', () => {
    savePlayers([]);
    expect(loadPlayers()).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    localStorage.setItem('vsiljivec-players', '{broken');
    expect(loadPlayers()).toBeNull();
  });

  it('returns null when stored data has wrong shape', () => {
    localStorage.setItem('vsiljivec-players', JSON.stringify([{ wrong: 'shape' }]));
    expect(loadPlayers()).toBeNull();
  });

  it('returns null when stored data is not an array', () => {
    localStorage.setItem('vsiljivec-players', JSON.stringify('not-an-array'));
    expect(loadPlayers()).toBeNull();
  });

  it('returns null when a player is missing the name field', () => {
    localStorage.setItem('vsiljivec-players', JSON.stringify([{ id: 1 }]));
    expect(loadPlayers()).toBeNull();
  });

  it('returns null when a player is missing the id field', () => {
    localStorage.setItem('vsiljivec-players', JSON.stringify([{ name: 'Ana' }]));
    expect(loadPlayers()).toBeNull();
  });

  it('preserves player order', () => {
    const players: Player[] = [
      { id: 3, name: 'Cene' },
      { id: 1, name: 'Ana' },
      { id: 2, name: 'Bojan' },
    ];
    savePlayers(players);
    const loaded = loadPlayers();
    expect(loaded).toEqual(players);
    expect(loaded![0].name).toBe('Cene');
  });
});

describe('INITIAL_PLAYERS', () => {
  it('has at least 3 players for a valid game', () => {
    expect(INITIAL_PLAYERS.length).toBeGreaterThanOrEqual(3);
  });

  it('has unique ids', () => {
    const ids = INITIAL_PLAYERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
