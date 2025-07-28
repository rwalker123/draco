/**
 * Animation Utilities
 * Common animation styles for the role icon system
 */

export const roleIconAnimations = {
  // Hover animations
  hover: {
    scale: 'scale(1.1)',
    scaleSmall: 'scale(1.05)',
    lift: 'translateY(-2px)',
    liftSmall: 'translateY(-1px)',
  },

  // Transitions
  transitions: {
    smooth: 'all 0.2s ease-in-out',
    fast: 'all 0.15s ease-out',
    slow: 'all 0.3s ease-in-out',
  },

  // Shadows
  shadows: {
    hover: '0 4px 12px rgba(0,0,0,0.1)',
    light: '0 2px 4px rgba(0,0,0,0.1)',
    medium: '0 2px 8px rgba(0,0,0,0.15)',
  },

  // Focus styles for accessibility
  focus: {
    outline: '2px solid',
    outlineOffset: '2px',
  },
} as const;

/**
 * Get animation styles for role icons
 * @param variant - The animation variant
 * @returns Animation styles object
 */
export function getRoleIconAnimationStyles(
  variant: 'hover' | 'focus' | 'transition' = 'transition',
) {
  switch (variant) {
    case 'hover':
      return {
        transition: roleIconAnimations.transitions.smooth,
        '&:hover': {
          transform: roleIconAnimations.hover.scale,
          boxShadow: roleIconAnimations.shadows.medium,
        },
      };
    case 'focus':
      return {
        transition: roleIconAnimations.transitions.fast,
        '&:focus': {
          outline: roleIconAnimations.focus.outline,
          outlineOffset: roleIconAnimations.focus.outlineOffset,
        },
      };
    case 'transition':
    default:
      return {
        transition: roleIconAnimations.transitions.smooth,
      };
  }
}
