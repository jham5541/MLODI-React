import { useEffect, useState } from 'react';
import { getLevelForPoints, getProgressWithinLevel, LevelDefinition } from '../services/levelService';

export interface UseUserLevelResult {
  loading: boolean;
  error: string | null;
  totalPoints: number;
  level: number;
  levelDef: LevelDefinition;
  progressPercent: number;
  pointsToNext: number;
}

export function useUserLevel(): UseUserLevelResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { fanEngagementService } = await import('../services/fanEngagementService');
        const total = await fanEngagementService.getTotalUserPoints();
        if (!mounted) return;
        setTotalPoints(total || 0);
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load user points');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const levelDef = getLevelForPoints(totalPoints);
  const progress = getProgressWithinLevel(totalPoints);

  return {
    loading,
    error,
    totalPoints,
    level: levelDef.level,
    levelDef,
    progressPercent: progress.progress,
    pointsToNext: progress.pointsToNext,
  };
}
