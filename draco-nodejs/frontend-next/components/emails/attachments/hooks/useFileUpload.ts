'use client';

import { useState, useRef, useEffect } from 'react';
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

const validateFiles = async (
  files: File[],
  existingAttachments: EmailAttachment[],
  config: AttachmentConfig,
): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  const totalFiles = existingAttachments.length + files.length;
  if (config.maxFiles && totalFiles > config.maxFiles) {
    errors.push(`Too many files. Maximum ${config.maxFiles} files allowed.`);
  }

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

  const { securityRisks } = await validateFilesSecure(files, config.allowedTypes || []);

  return {
    isValid: errors.length === 0 && securityRisks.length === 0,
    errors: [...errors, ...securityRisks],
  };
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

  const uploadPromisesRef = useRef<Map<string, Promise<void>>>(new Map());
  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map());
  const fileInputRef = useRef<Map<string, File>>(new Map());

  const objectUrlsRef = useRef<Set<string>>(new Set());

  const onAttachmentsChangeRef = useRef(onAttachmentsChange);

  useEffect(() => {
    onAttachmentsChangeRef.current = onAttachmentsChange;
  }, [onAttachmentsChange]);

  const setAttachments = (newAttachments: EmailAttachment[]) => {
    setAttachmentsState(newAttachments);
  };

  const updateAttachment = (id: string, updates: Partial<EmailAttachment>) => {
    setAttachmentsState((prev) =>
      prev.map((att) => (att.id === id ? { ...att, ...updates } : att)),
    );
  };

  const cleanupAttachmentUrls = (attachment: EmailAttachment) => {
    if (attachment.url && objectUrlsRef.current.has(attachment.url)) {
      URL.revokeObjectURL(attachment.url);
      objectUrlsRef.current.delete(attachment.url);
    }
    if (attachment.previewUrl && objectUrlsRef.current.has(attachment.previewUrl)) {
      URL.revokeObjectURL(attachment.previewUrl);
      objectUrlsRef.current.delete(attachment.previewUrl);
    }
  };

  useEffect(() => {
    onAttachmentsChangeRef.current?.(attachments);
  }, [attachments]);

  const uploadSingleFile = async (file: File, attachment: EmailAttachment): Promise<void> => {
    const controller = new AbortController();
    uploadControllersRef.current.set(attachment.id, controller);

    try {
      updateAttachment(attachment.id, { status: 'uploading', uploadProgress: 0, file });

      let previewUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
        if (objectUrlsRef.current) {
          objectUrlsRef.current.add(previewUrl);
        }
      }

      if (!controller.signal.aborted) {
        updateAttachment(attachment.id, { uploadProgress: 50 });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!controller.signal.aborted) {
        updateAttachment(attachment.id, {
          status: 'uploaded',
          uploadProgress: 100,
          previewUrl,
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
    }
  };

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setErrors([]);

    const validation = await validateFiles(files, attachments, config);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const newAttachments: EmailAttachment[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      lastModified: file.lastModified,
    }));

    const updatedAttachments = [...attachments, ...newAttachments];
    setAttachments(updatedAttachments);

    setIsUploading(true);
    onUploadStart?.();

    const uploadQueue = files.map((file, i) => {
      fileInputRef.current.set(newAttachments[i].id, file);
      return { file, attachment: newAttachments[i] };
    });

    const processWorker = async () => {
      while (uploadQueue.length > 0) {
        const item = uploadQueue.shift();
        if (item) {
          const uploadPromise = uploadSingleFile(item.file, item.attachment);
          uploadPromisesRef.current.set(item.attachment.id, uploadPromise);
          await uploadPromise;
        }
      }
    };

    const workerCount = Math.min(maxConcurrentUploads, files.length);
    await Promise.allSettled(Array.from({ length: workerCount }, () => processWorker()));

    setIsUploading(false);
    setUploadProgress(0);
    onUploadComplete?.();
  };

  const removeAttachment = (id: string) => {
    const controller = uploadControllersRef.current.get(id);
    if (controller) {
      controller.abort();
    }

    const attachmentToRemove = attachments.find((att) => att.id === id);
    if (attachmentToRemove) {
      cleanupAttachmentUrls(attachmentToRemove);
    }

    fileInputRef.current.delete(id);
    const updated = attachments.filter((att) => att.id !== id);
    setAttachments(updated);
  };

  const retryUpload = async (id: string) => {
    const attachment = attachments.find((att) => att.id === id);
    const file = fileInputRef.current.get(id);

    if (!attachment || !file || attachment.status !== 'error') {
      return;
    }

    updateAttachment(id, { status: 'pending', error: undefined });

    setIsUploading(true);
    await uploadSingleFile(file, attachment);
    setIsUploading(false);
  };

  const cancelUpload = (id: string) => {
    const controller = uploadControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      updateAttachment(id, { status: 'error', error: 'Upload cancelled' });
    }
  };

  const clearAll = () => {
    uploadControllersRef.current.forEach((controller) => controller.abort());
    uploadControllersRef.current.clear();
    uploadPromisesRef.current.clear();
    fileInputRef.current.clear();

    attachments.forEach((attachment) => {
      cleanupAttachmentUrls(attachment);
    });

    setAttachments([]);
    setErrors([]);
    setIsUploading(false);
    setUploadProgress(0);
  };

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    return () => {
      objectUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      objectUrls.clear();
    };
  }, []);

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
