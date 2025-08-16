// PlayerClassifieds Constants for Draco Sports Manager
// Baseball positions and experience levels used throughout the system

import { IBaseballPosition, IExperienceLevel } from './playerClassifiedInterfaces.js';

// ============================================================================
// BASEBALL POSITIONS
// ============================================================================

export const BASEBALL_POSITIONS: IBaseballPosition[] = [
  // Pitching positions
  {
    id: 'pitcher',
    name: 'Pitcher',
    category: 'pitching',
    abbreviation: 'P',
  },
  {
    id: 'starting-pitcher',
    name: 'Starting Pitcher',
    category: 'pitching',
    abbreviation: 'SP',
  },
  {
    id: 'relief-pitcher',
    name: 'Relief Pitcher',
    category: 'pitching',
    abbreviation: 'RP',
  },
  {
    id: 'closer',
    name: 'Closer',
    category: 'pitching',
    abbreviation: 'CL',
  },

  // Catching positions
  {
    id: 'catcher',
    name: 'Catcher',
    category: 'catching',
    abbreviation: 'C',
  },

  // Infield positions
  {
    id: 'first-base',
    name: 'First Base',
    category: 'infield',
    abbreviation: '1B',
  },
  {
    id: 'second-base',
    name: 'Second Base',
    category: 'infield',
    abbreviation: '2B',
  },
  {
    id: 'third-base',
    name: 'Third Base',
    category: 'infield',
    abbreviation: '3B',
  },
  {
    id: 'shortstop',
    name: 'Shortstop',
    category: 'infield',
    abbreviation: 'SS',
  },

  // Outfield positions
  {
    id: 'left-field',
    name: 'Left Field',
    category: 'outfield',
    abbreviation: 'LF',
  },
  {
    id: 'center-field',
    name: 'Center Field',
    category: 'outfield',
    abbreviation: 'CF',
  },
  {
    id: 'right-field',
    name: 'Right Field',
    category: 'outfield',
    abbreviation: 'RF',
  },

  // Utility positions
  {
    id: 'designated-hitter',
    name: 'Designated Hitter',
    category: 'utility',
    abbreviation: 'DH',
  },
  {
    id: 'utility',
    name: 'Utility Player',
    category: 'utility',
    abbreviation: 'UT',
  },
  {
    id: 'pinch-hitter',
    name: 'Pinch Hitter',
    category: 'utility',
    abbreviation: 'PH',
  },
  {
    id: 'pinch-runner',
    name: 'Pinch Runner',
    category: 'utility',
    abbreviation: 'PR',
  },
];

// ============================================================================
// EXPERIENCE LEVELS
// ============================================================================

export const EXPERIENCE_LEVELS: IExperienceLevel[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    description:
      'New to baseball or returning after a long break. Basic skills and understanding of the game.',
    yearsRequired: 0,
    skillLevel: 'beginner',
  },
  {
    id: 'beginner-plus',
    name: 'Beginner+',
    description: 'Some experience, understands basic rules and has fundamental skills.',
    yearsRequired: 1,
    skillLevel: 'beginner',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description:
      'Solid fundamental skills, understands game strategy, can play multiple positions.',
    yearsRequired: 2,
    skillLevel: 'intermediate',
  },
  {
    id: 'intermediate-plus',
    name: 'Intermediate+',
    description: 'Good skills, understands advanced concepts, reliable player.',
    yearsRequired: 3,
    skillLevel: 'intermediate',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'High skill level, understands complex strategies, can mentor others.',
    yearsRequired: 5,
    skillLevel: 'advanced',
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Elite level skills, extensive experience, can play at competitive levels.',
    yearsRequired: 8,
    skillLevel: 'expert',
  },
];

// ============================================================================
// POSITION CATEGORIES
// ============================================================================

export const POSITION_CATEGORIES = {
  PITCHING: 'pitching',
  CATCHING: 'catching',
  INFIELD: 'infield',
  OUTFIELD: 'outfield',
  UTILITY: 'utility',
} as const;

// ============================================================================
// SKILL LEVEL CATEGORIES
// ============================================================================

export const SKILL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get positions by category
 */
export function getPositionsByCategory(category: string): IBaseballPosition[] {
  return BASEBALL_POSITIONS.filter((pos) => pos.category === category);
}

/**
 * Get experience level by ID
 */
export function getExperienceLevelById(id: string): IExperienceLevel | undefined {
  return EXPERIENCE_LEVELS.find((level) => level.id === id);
}

/**
 * Get position by ID
 */
export function getPositionById(id: string): IBaseballPosition | undefined {
  return BASEBALL_POSITIONS.find((pos) => pos.id === id);
}

/**
 * Get positions by abbreviation
 */
export function getPositionByAbbreviation(abbr: string): IBaseballPosition | undefined {
  return BASEBALL_POSITIONS.find((pos) => pos.abbreviation === abbr);
}

/**
 * Validate if a position ID is valid
 */
export function isValidPositionId(positionId: string): boolean {
  return BASEBALL_POSITIONS.some((pos) => pos.id === positionId);
}

/**
 * Validate if an experience level ID is valid
 */
export function isValidExperienceLevelId(levelId: string): boolean {
  return EXPERIENCE_LEVELS.some((level) => level.id === levelId);
}

/**
 * Get all position abbreviations
 */
export function getAllPositionAbbreviations(): string[] {
  return BASEBALL_POSITIONS.map((pos) => pos.abbreviation);
}

/**
 * Get all position names
 */
export function getAllPositionNames(): string[] {
  return BASEBALL_POSITIONS.map((pos) => pos.name);
}
