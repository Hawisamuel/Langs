/**
 * Creates a debounced function that delays invoking `func` until after
 * `wait` milliseconds have elapsed since the last time the debounced
 * function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param immediate - If `true`, trigger the function on the leading edge
 * @returns A debounced version of the original function
 *
 * @example
 * const debouncedLog = debounce((message: string) => {
 *   console.log(message);
 * }, 300);
 *
 * debouncedLog('Hello'); // Will log 'Hello' after 300ms of no calls
 * debouncedLog('World'); // Resets the timer, only 'World' will be logged
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>): void {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    const callNow = immediate && timeout === null;

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(context, args);
    }
  };
}

// --- Alternative: Using AbortController (Modern Approach) ---

/**
 * Debounces a function using AbortController.
 * Better for cleanup in React components or complex scenarios.
 */
export function debounceWithAbort<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): {
  debounced: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let controller: AbortController | null = null;

  const debounced = (...args: Parameters<T>) => {
    // Cancel the previous timer
    if (controller) {
      controller.abort();
      controller = null;
    }

    // Create a new AbortController
    controller = new AbortController();
    const signal = controller.signal;

    // Set a timer
    const timer = setTimeout(() => {
      func(...args);
    }, wait);

    // Listen for abort signal
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
    });
  };

  const cancel = () => {
    if (controller) {
      controller.abort();
      controller = null;
    }
  };

  return { debounced, cancel };
}

// --- Type-Safe Usage Example ---

// Example usage:
type User = { id: number; name: string };

const fetchUser = async (userId: number): Promise<User> => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
};

// Debounced version with proper typing
const debouncedFetchUser = debounce(
  async (id: number) => {
    const user = await fetchUser(id);
    console.log('User fetched:', user);
  },
  500
);

// Call debounced function
debouncedFetchUser(123);

// For React/UI scenarios, use the AbortController version
const { debounced: searchUsers, cancel } = debounceWithAbort(
  (query: string) => {
    console.log('Searching for:', query);
  },
  300
);

// Trigger search (will be debounced)
searchUsers('hello');
searchUsers('hello world'); // Only 'hello world' will execute
