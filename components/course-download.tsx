'use client';

import { useState } from 'react';
import { useOfflineCourse } from '@/hooks/use-offline-course';
import { useOffline } from '@/hooks/use-offline';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Check, AlertCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CourseDownloadProps {
  courseId: string;
  courseName: string;
}

export function CourseDownload({ courseId, courseName }: CourseDownloadProps) {
  const { isOnline } = useOffline();
  const { 
    isDownloaded, 
    downloadProgress, 
    isDownloading, 
    downloadCourse,
    reloadCourse 
  } = useOfflineCourse(courseId);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDownload = async () => {
    if (!isOnline) {
      toast.error('You need to be online to download courses');
      return;
    }

    try {
      await downloadCourse();
      
      // Verify what was actually downloaded
      const { offlineManager } = await import('@/lib/offline-manager');
      const verification = await offlineManager.verifyCourseDownload(courseId);
      
      if (verification.isDownloaded) {
        toast.success(
          `${courseName} downloaded! ${verification.lessonsCount} lessons, ${verification.quizzesCount} quizzes cached for offline access.`
        );
      } else {
        toast.warning('Download completed but verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    try {
      // Clear specific course from offline storage
      const { offlineManager } = await import('@/lib/offline-manager');
      await offlineManager.clearCourse(courseId);
      await reloadCourse();
      toast.success('Course removed from offline storage');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to remove course from offline storage');
    }
  };

  if (isDownloading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Downloading... {downloadProgress}%</span>
        </div>
        <Progress value={downloadProgress} className="w-full" />
      </div>
    );
  }

  if (isDownloaded) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <Check className="h-3 w-3 mr-1" />
          Available Offline
        </Badge>
        
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Offline Content</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove {courseName} from your offline storage. You&apos;ll need to download it again to access it offline.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleDownload}
      disabled={!isOnline}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {!isOnline ? (
        <>
          <AlertCircle className="h-4 w-4" />
          Offline
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download for Offline
        </>
      )}
    </Button>
  );
}