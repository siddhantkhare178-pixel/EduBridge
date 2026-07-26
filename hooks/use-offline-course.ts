import { useState, useEffect, useCallback } from 'react';
import { offlineManager } from '@/lib/offline-manager';
import { OfflineCourse, OfflineLesson } from '@/lib/offline-db';

export function useOfflineCourse(courseId: string) {
  const [course, setCourse] = useState<OfflineCourse | null>(null);
  const [lessons, setLessons] = useState<OfflineLesson[]>([]);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadCachedCourse = useCallback(async () => {
    try {
      const cachedCourse = await offlineManager.getCachedCourse(courseId);
      const cachedLessons = await offlineManager.getCachedLessons(courseId);
      
      if (cachedCourse) {
        setCourse(cachedCourse);
        setIsDownloaded(cachedCourse.isDownloaded);
      }
      
      if (cachedLessons.length > 0) {
        setLessons(cachedLessons);
      }
    } catch (error) {
      console.error('Failed to load cached course:', error);
    }
  }, [courseId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cachedCourse = await offlineManager.getCachedCourse(courseId);
        const cachedLessons = await offlineManager.getCachedLessons(courseId);
        
        if (cachedCourse) {
          setCourse(cachedCourse);
          setIsDownloaded(cachedCourse.isDownloaded);
        }
        
        if (cachedLessons.length > 0) {
          setLessons(cachedLessons);
        }
      } catch (error) {
        console.error('Failed to load cached course:', error);
      }
    };
    
    loadData();
  }, [courseId]);

  const downloadCourse = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => Math.min(prev + 20, 80));
      }, 300);

      await offlineManager.downloadCourse(courseId);
      
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      // Reload cached data
      await loadCachedCourse();
      
      setTimeout(() => {
        setDownloadProgress(0);
        setIsDownloading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to download course:', error);
      setIsDownloading(false);
      setDownloadProgress(0);
      // Re-throw the error so the UI can handle it
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    course,
    lessons,
    isDownloaded,
    downloadProgress,
    isDownloading,
    downloadCourse,
    reloadCourse: loadCachedCourse
  };
}