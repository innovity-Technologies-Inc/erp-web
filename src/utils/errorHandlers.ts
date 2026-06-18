/**
 * Extracts and formats error messages from backend API responses.
 * Specifically handles Laravel-style validation error objects.
 */
export const getErrorMessage = (error: any, defaultMsg: string = 'An unexpected error occurred'): string => {
  const data = error.response?.data
  
  // 1. Check for Laravel-style validation errors object
  if (data?.errors && typeof data.errors === 'object') {
    return Object.values(data.errors).flat().join('\n')
  }
  
  // 2. Check for message in data
  if (data?.message) {
    return data.message
  }
  
  // 3. Fallback to axios error message or default
  return error.message || defaultMsg
}
