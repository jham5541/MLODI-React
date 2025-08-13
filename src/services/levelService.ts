// Centralized level system for user-wide MLODI points and perks
// Levels are computed from the user's total points across the app

export type LevelName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface LevelDefinition {
  level: number;
  name: LevelName;
  minPoints: number;
  maxPoints: number; // use Infinity for top tier
  benefits: string[];
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, name: 'Bronze',   minPoints: 0,     maxPoints: 1000,    benefits: ['Access to 10 exclusive songs', 'Basic profile badges'] },
  { level: 2, name: 'Silver',   minPoints: 1000,  maxPoints: 2500,    benefits: ['Access to 25 exclusive songs', '5 music videos', 'Silver profile badge'] },
  { level: 3, name: 'Gold',     minPoints: 2500,  maxPoints: 5000,    benefits: ['Access to 50 exclusive songs', '15 music videos', '10% merch discount', 'Gold profile badge'] },
  { level: 4, name: 'Platinum', minPoints: 5000,  maxPoints: 10000,   benefits: ['Access to all exclusive content', 'Unlimited videos', '20% merch discount', 'Platinum badge', 'Early access to new releases'] },
  { level: 5, name: 'Diamond',  minPoints: 10000, maxPoints: Infinity, benefits: ['VIP access to all content', 'Free merch items monthly', 'Meet & greet opportunities', 'Diamond badge', 'Exclusive artist interactions'] },
];

export function getLevelForPoints(totalPoints: number): LevelDefinition {
  return (
    LEVELS.find(l => totalPoints >= l.minPoints && totalPoints < l.maxPoints) || LEVELS[0]
  );
}

export function getNextLevel(current: LevelDefinition | null): LevelDefinition | null {
  if (!current) return LEVELS[0];
  const idx = LEVELS.findIndex(l => l.level === current.level);
  return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getProgressWithinLevel(totalPoints: number) {
  const current = getLevelForPoints(totalPoints);
  const next = getNextLevel(current);
  const progress = next
    ? ((totalPoints - current.minPoints) / (next.minPoints - current.minPoints)) * 100
    : 100;
  const pointsToNext = next ? Math.max(next.minPoints - totalPoints, 0) : 0;
  return {
    current,
    next,
    progress: Math.min(Math.max(progress, 0), 100),
    pointsToNext,
  };
}

export function isUnlocked(requiredLevel: number, userLevel: number): boolean {
  return userLevel >= requiredLevel;
}
