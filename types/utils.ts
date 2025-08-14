// types/utils.ts
/**
 * Shared utility types and functions
 */

export class ConfigurationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ConfigurationError';
  }
  toJSON() {
    return { name: this.name, message: this.message };
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public details?: unknown,         // optional payload/response body excerpt
    public cause?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
  static isApiError(e: unknown): e is ApiError {
    return e instanceof ApiError;
  }
  toJSON() {
    const { name, message, statusCode, endpoint, details } = this;
    return { name, message, statusCode, endpoint, details };
  }
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

export const isDefined = <T>(v: T | undefined | null): v is T =>
  v !== undefined && v !== null;

/** Narrowly assert a value is defined; throws with a precise message in dev. */
export function assertDefined<T>(
  v: T | null | undefined,
  msg = 'Expected value to be defined'
): asserts v is T {
  if (v === null || v === undefined) throw new ConfigurationError(msg);
}

/** Exhaustiveness helper for switch/case on discriminated unions. */
export function assertNever(x: never, msg = 'Unexpected variant'): never {
  throw new ConfigurationError(`${msg}: ${String(x)}`);
}

// Handy primitives for type-level documentation
export type Brand<T, B extends string> = T & { readonly __brand: B };
export type Id<B extends string = 'Id'> = Brand<string, B>;
export type ISODateString = string;   // document usage on fields like issuedAt/createdAt
export type NonEmptyArray<T> = [T, ...T[]];