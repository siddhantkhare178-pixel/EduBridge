import { useState, useEffect, useCallback } from 'react';
import { offlineManager } from '@/lib/offline-manager';
import { StudentProgress } from '@/lib/offline-db';

export function useOfflineProgress(userId: string, courseId: string) {
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      const progressData = await offlineManager.getProgress(userId, courseId);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, courseId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const updateProgress = async (lessonId: string, progressPercent: number, timeSpent: number) => {
    try {
      await offlineManager.updateProgress({
        userId,
        courseId,
        lessonId,
        completed: progressPercent >= 100,
        progress: progressPercent,
        timeSpent,
        lastAccessed: new Date()
      });
      
      // Reload progress
      await loadProgress();
    } catch (error) {
      console.error('Failed to update progress:', error);
      throw error;
    }
  };

  const markLessonComplete = async (lessonId: string, timeSpent: number) => {
    await updateProgress(lessonId, 100, timeSpent);
  };

  const getProgressForLesson = (lessonId: string): StudentProgress | undefined => {
    return progress.find(p => p.lessonId === lessonId);
  };

  const getCourseProgress = (): number => {
    if (progress.length === 0) return 0;
    
    const totalProgress = progress.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(totalProgress / progress.length);
  };

  return {
    progress,
    isLoading,
    updateProgress,
    markLessonComplete,
    getProgressForLesson,
    getCourseProgress,
    reloadProgress: loadProgress
  };
}