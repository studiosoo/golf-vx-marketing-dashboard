import type { AxiosInstance, AxiosResponse, AxiosError } from "axios";

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

interface RetryState {
  attempt: number;
  lastError: Error | null;
}

/**
 * Check if error is retryable (rate limit or temporary failure)
 */
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }

  const status = error.response.status;
  
  // Retry on rate limits (429), server errors (5xx), and specific client errors
  if (status === 429 || status >= 500) {
    return true;
  }
  
  // Check for Meta-specific rate limit headers
  const rateLimitReached = error.response.headers?.['x-business-use-case-usage'];
  if (rateLimitReached) {
    try {
      const usage = JSON.parse(rateLimitReached);
      // Check if any resource is throttled (>= 100% usage)
      for (const resource of Object.values(usage)) {
        if (typeof resource === 'object' && resource !== null) {
          const usageData = resource as { call_count?: number; total_cputime?: number; total_time?: number };
          if (usageData.call_count && usageData.call_count >= 100) {
            return true;
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  
  return false;
}

/**
 * Calculate delay for next retry attempt using exponential backoff
 */
function calculateDelay(
  attempt: number,
  options: Required<RetryOptions>
): number {
  const delay = Math.min(
    options.initialDelay * Math.pow(options.backoffMultiplier, attempt),
    options.maxDelay
  );
  
  // Add jitter (±25%) to prevent thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for Meta Ads API calls with exponential backoff
 */
export async function retryMetaAdsRequest<T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  options: RetryOptions = {}
): Promise<AxiosResponse<T>> {
  const config: Required<RetryOptions> = {
    maxRetries: options.maxRetries ?? 3,
    initialDelay: options.initialDelay ?? 1000, // 1 second
    maxDelay: options.maxDelay ?? 30000, // 30 seconds
    backoffMultiplier: options.backoffMultiplier ?? 2,
  };

  const state: RetryState = {
    attempt: 0,
    lastError: null,
  };

  while (state.attempt <= config.maxRetries) {
    try {
      const response = await requestFn();
      
      // Log successful retry if this wasn't the first attempt
      if (state.attempt > 0) {
        console.log(`[MetaAds] Request succeeded after ${state.attempt} retries`);
      }
      
      return response;
    } catch (error) {
      state.lastError = error as Error;
      const axiosError = error as AxiosError;
      
      // Check if we should retry
      if (state.attempt >= config.maxRetries || !isRetryableError(axiosError)) {
        console.error(
          `[MetaAds] Request failed after ${state.attempt} attempts:`,
          axiosError.response?.status,
          axiosError.response?.data || axiosError.message
        );
        throw error;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(state.attempt, config);
      console.warn(
        `[MetaAds] Request failed (attempt ${state.attempt + 1}/${config.maxRetries + 1}), ` +
        `retrying in ${delay}ms. Error: ${axiosError.response?.status || axiosError.message}`
      );
      
      await sleep(delay);
      state.attempt++;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw state.lastError || new Error("Max retries exceeded");
}

/**
 * Create a retry-wrapped axios client for Meta Ads
 */
export function createRetryableMetaAdsClient(client: AxiosInstance) {
  return {
    async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
      return retryMetaAdsRequest(() => client.get<T>(url, config));
    },
    async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
      return retryMetaAdsRequest(() => client.post<T>(url, data, config));
    },
    async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
      return retryMetaAdsRequest(() => client.put<T>(url, data, config));
    },
    async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
      return retryMetaAdsRequest(() => client.delete<T>(url, config));
    },
  };
}
