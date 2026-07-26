import Dexie, { Table } from 'dexie';

// Database interfaces
export interface OfflineCourse {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  lessons: OfflineLesson[];
  quizzes: OfflineQuiz[];
  lastSynced: Date;
  isDownloaded: boolean;
}

export interface OfflineLesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  pdfUrl?: string;
  order: number;
  duration?: number;
  lastSynced: Date;
}

export interface OfflineQuiz {
  id: string;
  courseId: string;
  lessonId?: string;
  title: string;
  questions: QuizQuestion[];
  timeLimit?: number;
  lastSynced: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface StudentProgress {
  id: string;
  userId: string;
  courseId: string;
  lessonId?: string;
  completed: boolean;
  progress: number;
  timeSpent: number;
  lastAccessed: Date;
  synced: boolean;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  answers: Record<string, number>;
  score: number;
  completedAt: Date;
  synced: boolean;
}

export interface ForumPost {
  id: string;
  userId: string;
  courseId?: string;
  title: string;
  content: string;
  replies: ForumReply[];
  createdAt: Date;
  synced: boolean;
}

export interface ForumReply {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  synced: boolean;
}

export interface AITutorCache {
  id: string;
  query: string;
  response: string;
  courseId?: string;
  lessonId?: string;
  createdAt: Date;
}

export interface PendingSync {
  id: string;
  type: 'progress' | 'quiz' | 'forum' | 'ai-query';
  data: any;
  createdAt: Date;
  retryCount: number;
}

// Dexie database class
export class EduBridgeDB extends Dexie {
  courses!: Table<OfflineCourse>;
  lessons!: Table<OfflineLesson>;
  quizzes!: Table<OfflineQuiz>;
  studentProgress!: Table<StudentProgress>;
  quizAttempts!: Table<QuizAttempt>;
  forumPosts!: Table<ForumPost>;
  forumReplies!: Table<ForumReply>;
  aiTutorCache!: Table<AITutorCache>;
  pendingSync!: Table<PendingSync>;

  constructor() {
    super('EduBridgeOffline');
    
    // Version 1 - Initial schema
    this.version(1).stores({
      courses: 'id, title, isDownloaded, lastSynced',
      lessons: 'id, courseId, title, order, lastSynced',
      quizzes: 'id, courseId, lessonId, title, lastSynced',
      studentProgress: 'id, userId, courseId, lessonId, completed, synced',
      quizAttempts: 'id, userId, quizId, completedAt, synced',
      forumPosts: 'id, userId, courseId, createdAt, synced',
      forumReplies: 'id, postId, userId, createdAt, synced',
      aiTutorCache: 'id, query, courseId, lessonId, createdAt',
      pendingSync: 'id, type, createdAt, retryCount'
    });

    // Version 2 - Add compound indexes for better performance
    this.version(2).stores({
      courses: 'id, title, isDownloaded, lastSynced',
      lessons: 'id, courseId, title, order, lastSynced',
      quizzes: 'id, courseId, lessonId, title, lastSynced',
      studentProgress: 'id, userId, courseId, lessonId, completed, synced, [userId+courseId], [userId+lessonId]',
      quizAttempts: 'id, userId, quizId, completedAt, synced, [userId+quizId]',
      forumPosts: 'id, userId, courseId, createdAt, synced',
      forumReplies: 'id, postId, userId, createdAt, synced',
      aiTutorCache: 'id, query, courseId, lessonId, createdAt',
      pendingSync: 'id, type, createdAt, retryCount'
    });

    // Version 3 - Add AI tutor cache compound index
    this.version(3).stores({
      courses: 'id, title, isDownloaded, lastSynced',
      lessons: 'id, courseId, title, order, lastSynced',
      quizzes: 'id, courseId, lessonId, title, lastSynced',
      studentProgress: 'id, userId, courseId, lessonId, completed, synced, [userId+courseId], [userId+lessonId]',
      quizAttempts: 'id, userId, quizId, completedAt, synced, [userId+quizId]',
      forumPosts: 'id, userId, courseId, createdAt, synced',
      forumReplies: 'id, postId, userId, createdAt, synced',
      aiTutorCache: 'id, query, courseId, lessonId, createdAt, [query+courseId+lessonId]',
      pendingSync: 'id, type, createdAt, retryCount'
    });
  }
}

// Initialize database with error handling
let dbInstance: EduBridgeDB | null = null;
let initializationPromise: Promise<EduBridgeDB> | null = null;

async function initializeDatabase(): Promise<EduBridgeDB> {
  if (typeof window === 'undefined') {
    // Return a mock database for SSR
    return new EduBridgeDB();
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    if (!dbInstance) {
      try {
        dbInstance = new EduBridgeDB();
        
        // Wait for the database to be ready before setting up event handlers
        await dbInstance.open();
        
        // Handle database upgrade events
        dbInstance.on('versionchange', () => {
          console.log('Database version changed, reloading...');
          if (dbInstance) {
            dbInstance.close();
            dbInstance = null;
          }
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        });

        // Note: Dexie doesn't have a global 'error' event
        // Schema errors will be handled in individual operations
        
      } catch (error) {
        console.error('Failed to initialize offline database:', error);
        // Create a fallback instance
        try {
          dbInstance = new EduBridgeDB();
          await dbInstance.open();
        } catch (fallbackError) {
          console.error('Failed to create fallback database:', fallbackError);
          // Return a minimal mock for complete failure
          dbInstance = new EduBridgeDB();
        }
      }
    }
    
    return dbInstance;
  })();

  return initializationPromise;
}

// Create a proxy that initializes the database on first access
export const db = new Proxy({} as EduBridgeDB, {
  get(target, prop) {
    if (typeof window === 'undefined') {
      // For SSR, return a mock that doesn't do anything
      return () => Promise.resolve();
    }
    
    // Initialize database if not already done
    if (!dbInstance) {
      initializeDatabase().catch(error => {
        console.error('Database initialization failed:', error);
      });
      
      // Return a temporary database instance
      const tempDb = new EduBridgeDB();
      return tempDb[prop as keyof EduBridgeDB];
    }
    
    return dbInstance[prop as keyof EduBridgeDB];
  }
});

// Utility function to ensure database is initialized
export async function ensureDatabaseReady(): Promise<EduBridgeDB> {
  return await initializeDatabase();
}

// Utility function to clear old database if schema is incompatible
export async function clearOldDatabase(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      // Close current connection
      if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
      }
      
      // Reset initialization promise
      initializationPromise = null;
      
      // Delete the database
      await Dexie.delete('EduBridgeOffline');
      
      // Reinitialize
      await initializeDatabase();
      
      console.log('Database cleared and reinitialized');
    } catch (error) {
      console.error('Failed to clear old database:', error);
    }
  }
}

// Utility function to handle schema upgrade errors
export async function handleSchemaError(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      console.warn('Schema error detected, attempting to fix...');
      
      // Close current connection
      if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
      }
      
      // Try to open with the latest schema
      const testDb = new EduBridgeDB();
      await testDb.open();
      
      // If successful, update the global instance
      dbInstance = testDb;
      
      console.log('Schema error resolved');
    } catch (error) {
      console.error('Failed to resolve schema error, clearing database:', error);
      await clearOldDatabase();
    }
  }
}