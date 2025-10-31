/**
 * Retry Strategy with Exponential Backoff
 * Handles automatic retries for failed operations with intelligent backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: any) => void;
}

export class RetryStrategy {
  private defaultOptions: Required<RetryOptions> = {
    maxRetries: 5,
    baseDelay: 1000, // 1 second
    maxDelay: 60000, // 1 minute
    backoffFactor: 2,
    onRetry: () => {},
  };

  /**
   * Execute a function with exponential backoff retry
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: any;

    for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < opts.maxRetries - 1) {
          const delay = Math.min(
            opts.baseDelay * Math.pow(opts.backoffFactor, attempt),
            opts.maxDelay
          );
          
          console.log(
            `[RetryStrategy] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
            error
          );
          
          opts.onRetry(attempt + 1, error);
          
          await this.sleep(delay);
        }
      }
    }

    console.error(`[RetryStrategy] All ${opts.maxRetries} attempts failed`);
    throw lastError;
  }

  /**
   * Execute with jittered exponential backoff (recommended for distributed systems)
   */
  async retryWithJitter<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: any;

    for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < opts.maxRetries - 1) {
          // Calculate base delay with exponential backoff
          const exponentialDelay = opts.baseDelay * Math.pow(opts.backoffFactor, attempt);
          
          // Add jitter (random factor between 0 and 1)
          const jitter = Math.random();
          const delay = Math.min(
            exponentialDelay * jitter,
            opts.maxDelay
          );
          
          console.log(
            `[RetryStrategy] Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`,
            error
          );
          
          opts.onRetry(attempt + 1, error);
          
          await this.sleep(delay);
        }
      }
    }

    console.error(`[RetryStrategy] All ${opts.maxRetries} attempts failed`);
    throw lastError;
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error: any): boolean {
    // Network errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return true;
    }

    // Timeout errors
    if (error.message?.includes('timeout')) {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.status) {
      const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
      return retryableStatusCodes.includes(error.status);
    }

    return false;
  }

  /**
   * Execute with smart retry (only retry on retryable errors)
   */
  async smartRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: any;

    for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry if error is not retryable
        if (!this.isRetryableError(error)) {
          console.log('[RetryStrategy] Non-retryable error, failing immediately');
          throw error;
        }
        
        if (attempt < opts.maxRetries - 1) {
          const delay = Math.min(
            opts.baseDelay * Math.pow(opts.backoffFactor, attempt),
            opts.maxDelay
          );
          
          opts.onRetry(attempt + 1, error);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const retryStrategy = new RetryStrategy();
