import { toast } from 'sonner'

export type ErrorContext =
  | 'localStorage'
  | 'state-management'
  | 'import-export'
  | 'validation'
  | 'ui-interaction'
  | 'unknown'

export interface ErrorDetails {
  context: ErrorContext
  error: unknown
  userMessage?: string
  action?: string
}

/**
 * Central error handler for the application
 * Logs error to console and optionally shows user notification
 */
export function handleError(details: ErrorDetails): void {
  const { context, error, userMessage, action } = details

  // Extract error message
  const errorMessage = error instanceof Error ? error.message : String(error)

  // Log to console (in production, send to error tracking service)
  console.error(`[${context}]${action ? ` ${action}` : ''}:`, errorMessage, error)

  // Optional: Send to analytics/error tracking
  // Example: analytics.track('error', { context, action, message: errorMessage })

  // Show user notification if userMessage provided
  if (userMessage) {
    toast.error(userMessage, {
      description: errorMessage.length > 100
        ? errorMessage.substring(0, 100) + '...'
        : errorMessage,
      duration: 5000,
    })
  }
}

/**
 * Safe wrapper for localStorage operations
 */
export const safeLocalStorage = {
  getItem(key: string, defaultValue: string | null = null): string | null {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      handleError({
        context: 'localStorage',
        error,
        action: 'getItem',
        userMessage: undefined, // Don't show toast for read failures
      })
      return defaultValue
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      handleError({
        context: 'localStorage',
        error,
        action: 'setItem',
        userMessage: 'Failed to save data to browser storage',
      })
      return false
    }
  },

  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      handleError({
        context: 'localStorage',
        error,
        action: 'removeItem',
        userMessage: 'Failed to clear browser storage',
      })
      return false
    }
  },

  clear(): boolean {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      handleError({
        context: 'localStorage',
        error,
        action: 'clear',
        userMessage: 'Failed to clear browser storage',
      })
      return false
    }
  },
}

/**
 * Safe JSON parse with error handling
 */
export function safeJSONParse<T>(
  jsonString: string,
  defaultValue: T,
  context: ErrorContext = 'unknown'
): T {
  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    handleError({
      context,
      error,
      action: 'JSON.parse',
      userMessage: undefined, // Silent failure - return default
    })
    return defaultValue
  }
}

/**
 * Safe JSON stringify with error handling
 */
export function safeJSONStringify(
  value: any,
  context: ErrorContext = 'unknown'
): string | null {
  try {
    return JSON.stringify(value)
  } catch (error) {
    handleError({
      context,
      error,
      action: 'JSON.stringify',
      userMessage: 'Failed to convert data to JSON format',
    })
    return null
  }
}
