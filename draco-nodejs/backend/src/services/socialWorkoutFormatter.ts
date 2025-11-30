export interface WorkoutPostPayload {
  workoutId: bigint;
  workoutDesc?: string | null;
  workoutDate?: Date | null;
  workoutUrl?: string | null;
  accountName?: string | null;
}

const formatWorkoutDateTime = (value?: Date | null): string | null => {
  if (!value) {
    return null;
  }

  return value.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const truncateText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength <= 1) {
    return value.slice(0, maxLength);
  }

  return `${value.slice(0, maxLength - 1)}…`;
};

export const composeWorkoutAnnouncementMessage = (
  payload: WorkoutPostPayload,
  options?: { characterLimit?: number },
): string | null => {
  const characterLimit = options?.characterLimit ?? Number.POSITIVE_INFINITY;

  const headingParts = [payload.accountName?.trim(), payload.workoutDesc?.trim()]
    .filter(Boolean)
    .join(' • ');
  const heading = headingParts || payload.workoutDesc?.trim() || 'Workout';
  const when = formatWorkoutDateTime(payload.workoutDate);
  const link = payload.workoutUrl?.trim();

  const linkSegment = link ? `Details: ${link}` : '';
  const baseSegments = [heading, when ? `When: ${when}` : ''].filter(Boolean);
  const segments = [...baseSegments, linkSegment].filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  let message = segments.join(' | ');

  if (message.length <= characterLimit) {
    return message;
  }

  if (linkSegment) {
    const reserved = linkSegment.length + (baseSegments.length > 0 ? 3 : 0);
    const available = characterLimit - reserved;

    let truncatedBase = baseSegments.join(' | ');
    if (available > 0 && truncatedBase.length > available) {
      truncatedBase = truncateText(truncatedBase, available);
    } else if (available <= 0) {
      truncatedBase = '';
    }

    message = [truncatedBase || undefined, linkSegment].filter(Boolean).join(' | ');

    if (message.length <= characterLimit) {
      return message;
    }
  }

  return truncateText(message, characterLimit);
};

