/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `limit` milliseconds.
 *
 * @param func - The function to throttle
 * @param limit - The number of milliseconds to throttle invocations to
 * @returns A throttled version of the original function
 *
 * @example
 * const throttledLog = throttle(() => {
 *   console.log('Scrolled!');
 * }, 500);
 *
 * window.addEventListener('scroll', throttledLog);
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;

  return function (this: unknown, ...args: Parameters<T>): void {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;

      const throttler = () => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        } else {
          lastFunc = setTimeout(throttler, limit - (Date.now() - lastRan));
        }
      };

      lastFunc = setTimeout(throttler, limit);
    }
  };
}
