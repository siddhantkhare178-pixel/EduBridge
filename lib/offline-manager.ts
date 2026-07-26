import { db, OfflineCourse, OfflineLesson, StudentProgress, QuizAttempt, ForumPost, AITutorCache } from './offline-db';

export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = true; // Default to online for SSR
  private syncInProgress: boolean = false;

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  constructor() {
    // Only set up event listeners on the client side
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      
      // Listen for online/offline events
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncPendingData();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  // Course Content Management
  async downloadCourse(courseId: string): Promise<void> {
    try {
      // Fetch course data from existing API
      const courseResponse = await fetch(`/api/courses/${courseId}`);
      if (!courseResponse.ok) {
        throw new Error(`Failed to fetch course: ${courseResponse.status}`);
      }
      const courseData = await courseResponse.json();

      // Fetch full lesson data with content
      const lessonsResponse = await fetch(`/api/lessons?courseId=${courseId}`);
      let lessonsData = [];
      if (lessonsResponse.ok) {
        lessonsData = await lessonsResponse.json();
      } else {
        // Fallback to basic lesson data from course
        lessonsData = courseData.lessons || [];
      }
      
      // Try to fetch real quizzes related to this course
      let quizzesData = [];
      try {
        const publicQuizzesResponse = await fetch('/api/quiz/public');
        if (publicQuizzesResponse.ok) {
          const allQuizzes = await publicQuizzesResponse.json();
          // Filter quizzes related to this course or use first few as examples
          quizzesData = allQuizzes.slice(0, 2).map((quiz: any) => ({
            id: quiz.id,
            courseId,
            title: quiz.title,
            questions: quiz.questions.map((q: any, index: number) => ({
              id: q.id || index.toString(),
              question: q.question,
              options: q.options || [],
              correctAnswer: q.correctAnswer || 0,
              explanation: q.explanation
            })),
            timeLimit: quiz.timeLimit || 10
          }));
        }
      } catch (quizError) {
        console.warn('Failed to fetch quizzes:', quizError);
      }

      // If no real quizzes, create a simple demo
      if (quizzesData.length === 0) {
        quizzesData = [{
          id: `quiz-${courseId}`,
          courseId,
          title: `${courseData.title} Quiz`,
          questions: [
            {
              id: '1',
              question: 'What is the main topic of this course?',
              options: [courseData.title, 'Other topic', 'Random topic', 'Unknown'],
              correctAnswer: 0,
              explanation: `This course is about ${courseData.title}`
            }
          ],
          timeLimit: 5
        }];
      }

      // Store course with real data
      await db.courses.put({
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail,
        lessons: lessonsData,
        quizzes: quizzesData,
        lastSynced: new Date(),
        isDownloaded: true
      });

      // Store lessons individually with full content
      for (const lesson of lessonsData) {
        await db.lessons.put({
          id: lesson.id,
          courseId,
          title: lesson.title,
          content: lesson.content || lesson.textContent || '',
          videoUrl: lesson.videoUrl || null,
          pdfUrl: lesson.pdfUrl || null,
          order: lesson.order,
          lastSynced: new Date()
        });
      }

      // Store quizzes individually
      for (const quiz of quizzesData) {
        await db.quizzes.put({
          ...quiz,
          lastSynced: new Date()
        });
      }

      // Cache media files (videos, PDFs)
      await this.cacheMediaFiles(lessonsData);

      console.log(`Successfully downloaded course: ${courseData.title} with ${lessonsData.length} lessons and ${quizzesData.length} quizzes`);

    } catch (error) {
      console.error('Failed to download course:', error);
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCachedCourse(courseId: string): Promise<OfflineCourse | undefined> {
    return await db.courses.get(courseId);
  }

  async getCachedLessons(courseId: string): Promise<OfflineLesson[]> {
    return await db.lessons.where('courseId').equals(courseId).toArray();
  }

  async verifyCourseDownload(courseId: string): Promise<{
    isDownloaded: boolean;
    courseData: OfflineCourse | null;
    lessonsCount: number;
    quizzesCount: number;
    hasContent: boolean;
  }> {
    try {
      const course = await db.courses.get(courseId);
      const lessons = await db.lessons.where('courseId').equals(courseId).toArray();
      const quizzes = await db.quizzes.where('courseId').equals(courseId).toArray();
      
      const hasContent = lessons.some(lesson => 
        lesson.content || lesson.videoUrl
      );

      return {
        isDownloaded: !!course?.isDownloaded,
        courseData: course || null,
        lessonsCount: lessons.length,
        quizzesCount: quizzes.length,
        hasContent
      };
    } catch (error) {
      console.error('Failed to verify course download:', error);
      return {
        isDownloaded: false,
        courseData: null,
        lessonsCount: 0,
        quizzesCount: 0,
        hasContent: false
      };
    }
  }

  // Student Progress Management
  async updateProgress(progressData: Omit<StudentProgress, 'id' | 'synced'>): Promise<void> {
    const progress: StudentProgress = {
      ...progressData,
      id: `${progressData.userId}-${progressData.courseId}-${progressData.lessonId || 'course'}`,
      synced: this.isOnline
    };

    await db.studentProgress.put(progress);

    if (this.isOnline) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progressData)
        });
        
        // Mark as synced
        await db.studentProgress.update(progress.id, { synced: true });
      } catch (error) {
        // Queue for later sync
        await this.queueForSync('progress', progressData);
      }
    } else {
      // Queue for later sync
      await this.queueForSync('progress', progressData);
    }
  }

  async getProgress(userId: string, courseId: string): Promise<StudentProgress[]> {
    try {
      // Try to use compound index (available in schema version 2+)
      return await db.studentProgress
        .where(['userId', 'courseId'])
        .equals([userId, courseId])
        .toArray();
    } catch (error) {
      // Fallback for older schema versions - filter manually
      console.warn('Compound index not available, using fallback method:', error);
      return await db.studentProgress
        .where('userId')
        .equals(userId)
        .filter(progress => progress.courseId === courseId)
        .toArray();
    }
  }

  // Quiz Management
  async submitQuiz(quizData: Omit<QuizAttempt, 'id' | 'synced'>): Promise<void> {
    const attempt: QuizAttempt = {
      ...quizData,
      id: `${quizData.userId}-${quizData.quizId}-${Date.now()}`,
      synced: this.isOnline
    };

    await db.quizAttempts.put(attempt);

    if (this.isOnline) {
      try {
        await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quizData)
        });
        
        await db.quizAttempts.update(attempt.id, { synced: true });
      } catch (error) {
        await this.queueForSync('quiz', quizData);
      }
    } else {
      await this.queueForSync('quiz', quizData);
      
      // Register background sync
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        // Background sync is not available in all browsers
        try {
          await (registration as any).sync.register('quiz-submission');
        } catch (error) {
          console.warn('Background sync not supported:', error);
        }
      }
    }
  }

  async getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    try {
      // Try to use compound index (available in schema version 2+)
      return await db.quizAttempts
        .where(['userId', 'quizId'])
        .equals([userId, quizId])
        .toArray();
    } catch (error) {
      // Fallback for older schema versions - filter manually
      console.warn('Compound index not available, using fallback method:', error);
      return await db.quizAttempts
        .where('userId')
        .equals(userId)
        .filter(attempt => attempt.quizId === quizId)
        .toArray();
    }
  }

  // Forum Management
  async createForumPost(postData: Omit<ForumPost, 'id' | 'synced' | 'replies'>): Promise<void> {
    // Check if post already exists to avoid duplicates
    const existingPost = await db.forumPosts
      .where('title')
      .equals(postData.title)
      .and(post => post.userId === postData.userId && post.courseId === postData.courseId)
      .first();
    
    if (existingPost) {
      // Post already exists, don't create duplicate
      return;
    }

    const post: ForumPost = {
      ...postData,
      id: `temp-${Date.now()}`,
      replies: [],
      synced: this.isOnline
    };

    await db.forumPosts.put(post);

    if (this.isOnline) {
      try {
        const response = await fetch('/api/forum/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData)
        });
        
        const serverPost = await response.json();
        await db.forumPosts.update(post.id, { 
          id: serverPost.id, 
          synced: true 
        });
      } catch (error) {
        await this.queueForSync('forum', postData);
      }
    } else {
      await this.queueForSync('forum', postData);
      
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        // Background sync is not available in all browsers
        try {
          await (registration as any).sync.register('forum-post');
        } catch (error) {
          console.warn('Background sync not supported:', error);
        }
      }
    }
  }

  async getCachedForumPosts(courseId?: string): Promise<ForumPost[]> {
    if (courseId) {
      return await db.forumPosts.where('courseId').equals(courseId).toArray();
    }
    return await db.forumPosts.toArray();
  }

  async clearCachedForumPosts(courseId?: string): Promise<void> {
    if (courseId) {
      await db.forumPosts.where('courseId').equals(courseId).delete();
    } else {
      await db.forumPosts.clear();
    }
  }

  // AI Tutor Cache Management
  async getCachedAIResponse(query: string, courseId?: string, lessonId?: string): Promise<string | null> {
    try {
      // Ensure database is ready
      const { ensureDatabaseReady } = await import('./offline-db');
      await ensureDatabaseReady();
      
      // Try to use compound index (available in schema version 3+)
      const cached = await db.aiTutorCache
        .where(['query', 'courseId', 'lessonId'])
        .equals([query, courseId || '', lessonId || ''])
        .first();
      
      return cached?.response || null;
    } catch (error) {
      // Check if it's a schema error
      if (error instanceof Error && (error.message.includes('SchemaError') || error.message.includes('not indexed'))) {
        console.warn('Schema error detected, attempting to handle gracefully:', error.message);
        
        // Try to handle schema error
        try {
          const { handleSchemaError } = await import('./offline-db');
          await handleSchemaError();
          
          // Retry with compound index after schema fix
          const cached = await db.aiTutorCache
            .where(['query', 'courseId', 'lessonId'])
            .equals([query, courseId || '', lessonId || ''])
            .first();
          
          return cached?.response || null;
        } catch (retryError) {
          console.warn('Schema fix failed, using fallback method');
        }
      }
      
      // Fallback for older schema versions or when compound index fails - filter manually
      try {
        const cached = await db.aiTutorCache
          .where('query')
          .equals(query)
          .filter(cache => 
            cache.courseId === (courseId || '') && 
            cache.lessonId === (lessonId || '')
          )
          .first();
        
        return cached?.response || null;
      } catch (fallbackError) {
        console.error('All AI cache retrieval methods failed:', fallbackError);
        return null;
      }
    }
  }

  async cacheAIResponse(query: string, response: string, courseId?: string, lessonId?: string): Promise<void> {
    try {
      // Ensure database is ready
      const { ensureDatabaseReady } = await import('./offline-db');
      await ensureDatabaseReady();
      
      await db.aiTutorCache.put({
        id: `${query}-${courseId || ''}-${lessonId || ''}-${Date.now()}`,
        query,
        response,
        courseId,
        lessonId,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Failed to cache AI response:', error);
      // Don't throw error, just log it
    }
  }

  async queryAITutor(query: string, courseId?: string, lessonId?: string): Promise<string> {
    // Check cache first
    const cached = await this.getCachedAIResponse(query, courseId, lessonId);
    if (cached) {
      return cached;
    }

    if (this.isOnline) {
      try {
        const response = await fetch('/api/ai-tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, courseId, lessonId })
        });
        
        const data = await response.json();
        
        // Cache the response
        await this.cacheAIResponse(query, data.response, courseId, lessonId);
        
        return data.response;
      } catch (error) {
        return "I'm currently offline. Please try again when you have an internet connection.";
      }
    } else {
      return "I'm currently offline. Please try again when you have an internet connection, or check if I have a cached response for a similar question.";
    }
  }

  // Sync Management
  private async queueForSync(type: 'progress' | 'quiz' | 'forum' | 'ai-query', data: any): Promise<void> {
    await db.pendingSync.add({
      id: `${type}-${Date.now()}`,
      type,
      data,
      createdAt: new Date(),
      retryCount: 0
    });
  }

  async syncPendingData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    
    try {
      const pendingItems = await db.pendingSync.toArray();
      
      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          await db.pendingSync.delete(item.id);
        } catch (error) {
          // Increment retry count
          await db.pendingSync.update(item.id, { 
            retryCount: item.retryCount + 1 
          });
          
          // Remove after 5 failed attempts
          if (item.retryCount >= 5) {
            await db.pendingSync.delete(item.id);
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: any): Promise<void> {
    switch (item.type) {
      case 'progress':
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        break;
      
      case 'quiz':
        await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        break;
      
      case 'forum':
        await fetch('/api/forum/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        break;
    }
  }

  // Media Caching
  private async cacheMediaFiles(lessons: OfflineLesson[]): Promise<void> {
    try {
      const cache = await caches.open('media-content');
      
      for (const lesson of lessons) {
        try {
          // Only cache if URLs are valid HTTP(S) URLs
          if (lesson.videoUrl && (lesson.videoUrl.startsWith('http://') || lesson.videoUrl.startsWith('https://'))) {
            await cache.add(lesson.videoUrl);
          }
          // Note: pdfUrl doesn't exist in our lesson type, but keeping for future use
          if ('pdfUrl' in lesson && lesson.pdfUrl && (lesson.pdfUrl.startsWith('http://') || lesson.pdfUrl.startsWith('https://'))) {
            await cache.add(lesson.pdfUrl);
          }
        } catch (error) {
          console.warn(`Failed to cache media for lesson ${lesson.id}:`, error);
          // Continue with other lessons even if one fails
        }
      }
    } catch (error) {
      console.warn('Failed to open media cache:', error);
      // Don't throw error, just log warning
    }
  }

  // Database Management
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Test if compound indexes work
      await db.studentProgress
        .where(['userId', 'courseId'])
        .equals(['test', 'test'])
        .limit(1)
        .toArray();
      return true;
    } catch (error) {
      console.warn('Database schema is outdated, compound indexes not available');
      return false;
    }
  }

  async upgradeDatabaseIfNeeded(): Promise<void> {
    const isHealthy = await this.checkDatabaseHealth();
    if (!isHealthy) {
      console.log('Upgrading database schema...');
      try {
        // Import the clear function
        const { clearOldDatabase } = await import('./offline-db');
        await clearOldDatabase();
        console.log('Database upgraded successfully');
      } catch (error) {
        console.error('Failed to upgrade database:', error);
      }
    }
  }

  // Utility methods
  isOffline(): boolean {
    return !this.isOnline;
  }

  async clearCache(): Promise<void> {
    try {
      // Clear IndexedDB
      await db.delete();
      
      // Clear service worker caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  async clearCourse(courseId: string): Promise<void> {
    try {
      // Remove specific course data
      await db.courses.delete(courseId);
      await db.lessons.where('courseId').equals(courseId).delete();
      await db.quizzes.where('courseId').equals(courseId).delete();
      await db.studentProgress.where('courseId').equals(courseId).delete();
    } catch (error) {
      console.error('Failed to clear course:', error);
      throw error;
    }
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }
}

// Initialize the offline manager
let offlineManagerInstance: OfflineManager | null = null;

export const offlineManager = (() => {
  if (typeof window !== 'undefined' && !offlineManagerInstance) {
    offlineManagerInstance = OfflineManager.getInstance();
  }
  return offlineManagerInstance || OfflineManager.getInstance();
})();