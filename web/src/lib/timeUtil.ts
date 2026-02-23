/**
 * Get the current timestamp in seconds.
 * @returns current timestamp in seconds
 */
export function getNow() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Get a future timestamp.
 * @param offset the amount of seconds in the future.
 * @returns a future timestamp based on `offset`.
 */
export function getFuture(offset: number) {
    if (offset <= 0) {
        throw new Error("offset must be positive")
    }
  return getNow() + Math.floor(offset);
}
