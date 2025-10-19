const EMAIL_WARNING_MESSAGES: Record<string, string> = {
  'submission-received':
    'Photo submitted, but we could not send the confirmation email. Moderators will still review it.',
  'moderation-approved':
    'Photo approved, but the notification email to the submitter did not send. Please notify them manually.',
  'moderation-denied':
    'Photo denied, but the notification email to the submitter did not send. Please follow up manually.',
};

export const getPhotoEmailWarningMessage = (warning: string | null | undefined): string | null => {
  if (!warning) {
    return null;
  }

  const normalized = warning.trim().toLowerCase();
  return EMAIL_WARNING_MESSAGES[normalized] ?? null;
};
