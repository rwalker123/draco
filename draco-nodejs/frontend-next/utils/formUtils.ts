/**
 * Utility functions for form components
 */

/**
 * Returns standardized InputProps configuration for readonly TextField components
 * This eliminates duplication across multiple readonly fields in forms
 */
export const getReadOnlyInputProps = () => ({
  readOnly: true,
  sx: {
    '& .MuiInputBase-input': {
      cursor: 'default',
    },
    '&:before': {
      borderBottomColor: 'rgba(0, 0, 0, 0.42)',
    },
    '&:hover:not(.Mui-disabled):before': {
      borderBottomColor: 'rgba(0, 0, 0, 0.87)',
    },
  },
});

/**
 * Returns standardized InputProps configuration for readonly DatePicker/TimePicker components
 * This eliminates duplication across date/time picker readonly styling
 */
export const getReadOnlyDatePickerInputProps = () => ({
  readOnly: true,
  sx: {
    '& .MuiInputBase-input': {
      cursor: 'default',
    },
    '&:before': {
      borderBottomColor: 'rgba(0, 0, 0, 0.42)',
    },
    '&:hover:not(.Mui-disabled):before': {
      borderBottomColor: 'rgba(0, 0, 0, 0.87)',
    },
  },
});
