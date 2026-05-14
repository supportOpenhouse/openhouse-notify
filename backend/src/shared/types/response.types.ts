export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code?: string;
  message: string;
  details?: unknown;
}
