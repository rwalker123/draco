'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  EmailAttachment,
  AttachmentConfig,
  DEFAULT_ATTACHMENT_CONFIG,
} from '../../../../types/emails/attachments';
import { validateFilesSecure } from '../../../../utils/fileValidation';

export interface UseFileUploadOptions {
  config?: AttachmentConfig;
  maxConcurrentUploads?: number;
  onAttachmentsChange?: (attachments: EmailAttachment[]) => void;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface UseFileUploadReturn {
  attachments: EmailAttachment[];
  isUploading: boolean;
  uploadProgress: number;
  errors: string[];
  addFiles: (files: File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  retryUpload: (id: string) => Promise<void>;
  clearAll: () => void;
  cancelUpload: (id: string) => void;
  setAttachments: (attachments: EmailAttachment[]) => void;
}

// Helper function to validate files
const validateFiles = async (
  files: File[],
  existingAttachments: EmailAttachment[],
  config: AttachmentConfig,
): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  // Check file count
  const totalFiles = existingAttachments.length + files.length;
  if (config.maxFiles && totalFiles > config.maxFiles) {
    errors.push(`Too many files. Maximum ${config.maxFiles} files allowed.`);
  }

  // Check individual file sizes and types
  files.forEach((file) => {
    if (config.maxFileSize && file.size > config.maxFileSize) {
      errors.push(
        `${file.name} is too large. Maximum size: ${config.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    if (config.allowedTypes && config.allowedTypes.length > 0) {
      const isAllowed = config.allowedTypes.some((type) => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.includes(type.replace('*', ''));
      });

      if (!isAllowed) {
        errors.push(`${file.name} has an unsupported file type.`);
      }
    }
  });

  // Add security validation
  const { securityRisks } = await validateFilesSecure(files, config.allowedTypes || []);

  return {
    isValid: errors.length === 0 && securityRisks.length === 0,
    errors: [...errors, ...securityRisks],
  };
};

// Simulate file upload with progress
const simulateFileUpload = async (
  file: File,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
): Promise<{ url: string; previewUrl?: string }> => {
  return new Promise((resolve, reject) => {
    let progress = 0;
    const interval = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(interval);
        reject(new Error('Upload cancelled'));
        return;
      }

      progress += Math.random() * 20;
      if (progress > 100) progress = 100;

      onProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        resolve({
          url: URL.createObjectURL(file),
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        });
      }
    }, 200);
  });
};

export function useFileUpload({
  config = DEFAULT_ATTACHMENT_CONFIG,
  maxConcurrentUploads = 3,
  onAttachmentsChange,
  onUploadStart,
  onUploadComplete,
  onError,
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [attachments, setAttachmentsState] = useState<EmailAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  // Keep track of upload promises and cancellation
  const uploadPromisesRef = useRef<Map<string, Promise<void>>>(new Map());
  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map());
  const fileInputRef = useRef<Map<string, File>>(new Map());

  // Store callback ref to avoid infinite loops
  const onAttachmentsChangeRef = useRef(onAttachmentsChange);

  // Update ref when callback changes
  useEffect(() => {
    onAttachmentsChangeRef.current = onAttachmentsChange;
  }, [onAttachmentsChange]);

  const setAttachments = useCallback((newAttachments: EmailAttachment[]) => {
    setAttachmentsState(newAttachments);
  }, []);

  // Update individual attachment
  const updateAttachment = useCallback((id: string, updates: Partial<EmailAttachment>) => {
    setAttachmentsState((prev) =>
      prev.map((att) => (att.id === id ? { ...att, ...updates } : att)),
    );
  }, []);

  // Effect to notify parent of attachment changes
  useEffect(() => {
    onAttachmentsChangeRef.current?.(attachments);
  }, [attachments]);

  // Calculate overall upload progress
  const calculateProgress = useCallback((currentAttachments: EmailAttachment[]) => {
    const uploadingAttachments = currentAttachments.filter((att) => att.status === 'uploading');
    if (uploadingAttachments.length === 0) return 0;

    const totalProgress = uploadingAttachments.reduce(
      (sum, att) => sum + (att.uploadProgress || 0),
      0,
    );
    return Math.round(totalProgress / uploadingAttachments.length);
  }, []);

  // Upload single file with progress tracking
  const uploadSingleFile = useCallback(
    async (file: File, attachment: EmailAttachment): Promise<void> => {
      const controller = new AbortController();
      uploadControllersRef.current.set(attachment.id, controller);
      fileInputRef.current.set(attachment.id, file);

      try {
        updateAttachment(attachment.id, { status: 'uploading', uploadProgress: 0 });

        // Simulate upload with progress tracking
        const result = await simulateFileUpload(
          file,
          (progress) => {
            if (!controller.signal.aborted) {
              updateAttachment(attachment.id, { uploadProgress: progress });

              // Update overall progress
              setAttachmentsState((current) => {
                setUploadProgress(calculateProgress(current));
                return current;
              });
            }
          },
          controller.signal,
        );

        if (!controller.signal.aborted) {
          updateAttachment(attachment.id, {
            status: 'uploaded',
            uploadProgress: 100,
            url: result.url,
            previewUrl: result.previewUrl,
            error: undefined,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          updateAttachment(attachment.id, {
            status: 'error',
            error: errorMessage,
            uploadProgress: undefined,
          });

          setErrors((prev) => [...prev, `Failed to upload ${file.name}: ${errorMessage}`]);
          onError?.(error instanceof Error ? error : new Error(errorMessage));
        }
      } finally {
        uploadControllersRef.current.delete(attachment.id);
        uploadPromisesRef.current.delete(attachment.id);
        fileInputRef.current.delete(attachment.id);
      }
    },
    [updateAttachment, calculateProgress, onError],
  );

  // Add multiple files with validation
  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Clear previous errors
      setErrors([]);

      // Validate files
      const validation = await validateFiles(files, attachments, config);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      // Create attachment objects
      const newAttachments: EmailAttachment[] = files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        lastModified: file.lastModified,
      }));

      // Add to state immediately
      const updatedAttachments = [...attachments, ...newAttachments];
      setAttachments(updatedAttachments);

      setIsUploading(true);
      onUploadStart?.();

      // Upload files with concurrency control
      const uploadQueue = [...files];
      const activeUploads: Promise<void>[] = [];

      for (let i = 0; i < Math.min(maxConcurrentUploads, files.length); i++) {
        const file = uploadQueue.shift();
        const attachment = newAttachments[i];

        if (file && attachment) {
          const uploadPromise = uploadSingleFile(file, attachment);
          uploadPromisesRef.current.set(attachment.id, uploadPromise);
          activeUploads.push(uploadPromise);
        }
      }

      // Process remaining files as uploads complete
      const processNext = async () => {
        if (uploadQueue.length > 0) {
          const file = uploadQueue.shift();
          const attachmentIndex = files.length - uploadQueue.length - 1;
          const attachment = newAttachments[attachmentIndex];

          if (file && attachment) {
            const uploadPromise = uploadSingleFile(file, attachment);
            uploadPromisesRef.current.set(attachment.id, uploadPromise);
            await uploadPromise;
            await processNext();
          }
        }
      };

      // Wait for initial uploads and process remaining
      await Promise.allSettled([
        ...activeUploads,
        ...Array(uploadQueue.length)
          .fill(null)
          .map(() => processNext()),
      ]);

      setIsUploading(false);
      setUploadProgress(0);
      onUploadComplete?.();
    },
    [
      attachments,
      config,
      maxConcurrentUploads,
      setAttachments,
      uploadSingleFile,
      onUploadStart,
      onUploadComplete,
    ],
  );

  // Remove attachment
  const removeAttachment = useCallback(
    (id: string) => {
      // Cancel upload if in progress
      const controller = uploadControllersRef.current.get(id);
      if (controller) {
        controller.abort();
      }

      const updated = attachments.filter((att) => att.id !== id);
      setAttachments(updated);
    },
    [attachments, setAttachments],
  );

  // Retry failed upload
  const retryUpload = useCallback(
    async (id: string) => {
      const attachment = attachments.find((att) => att.id === id);
      const file = fileInputRef.current.get(id);

      if (!attachment || !file || attachment.status !== 'error') {
        return;
      }

      // Clear the error and retry
      updateAttachment(id, { status: 'pending', error: undefined });

      setIsUploading(true);
      await uploadSingleFile(file, attachment);
      setIsUploading(false);
    },
    [attachments, updateAttachment, uploadSingleFile],
  );

  // Cancel upload
  const cancelUpload = useCallback(
    (id: string) => {
      const controller = uploadControllersRef.current.get(id);
      if (controller) {
        controller.abort();
        updateAttachment(id, { status: 'error', error: 'Upload cancelled' });
      }
    },
    [updateAttachment],
  );

  // Clear all attachments
  const clearAll = useCallback(() => {
    // Cancel all active uploads
    uploadControllersRef.current.forEach((controller) => controller.abort());
    uploadControllersRef.current.clear();
    uploadPromisesRef.current.clear();
    fileInputRef.current.clear();

    setAttachments([]);
    setErrors([]);
    setIsUploading(false);
    setUploadProgress(0);
  }, [setAttachments]);

  return {
    attachments,
    isUploading,
    uploadProgress,
    errors,
    addFiles,
    removeAttachment,
    retryUpload,
    clearAll,
    cancelUpload,
    setAttachments,
  };
}
