// Shared Character Validation Utilities for Player Classifieds
// Following DRY principles to avoid duplication across dialog components

// Validation constants for player classified forms
export const PLAYER_CLASSIFIED_VALIDATION = {
  // Contact Creator Dialog (Teams reaching out to players)
  CONTACT: {
    SENDER_NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 100,
    },
    SENDER_EMAIL: {
      MAX_LENGTH: 254,
    },
    MESSAGE: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 2000,
    },
  },

  // Players Wanted Dialog (Teams posting ads)
  PLAYERS_WANTED: {
    TEAM_EVENT_NAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 100,
    },
    DESCRIPTION: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 2000, // Updated from 1000 to match contact message limit
    },
  },
} as const;

/**
 * Helper function to determine character counter color based on usage percentage
 * @param currentLength - Current character count
 * @param maxLength - Maximum allowed characters
 * @returns CSS color string for the character counter
 */
export const getCharacterCountColor = (currentLength: number, maxLength: number): string => {
  const percentage = (currentLength / maxLength) * 100;

  if (percentage >= 95) {
    return '#d32f2f'; // Red - at or near limit
  } else if (percentage >= 80) {
    return '#ed6c02'; // Orange - warning zone
  } else {
    return 'text.secondary'; // Default/green - safe zone
  }
};
