import { DOCHUB_UNAVAILABLE_MESSAGE } from './config';

export class DochubError extends Error {
  status: number;
  code?: string;
  similar?: string[];

  constructor(status: number, message: string, code?: string, similar?: string[]) {
    super(message);
    this.name = 'DochubError';
    this.status = status;
    this.code = code;
    if (similar?.length) this.similar = similar;
  }
}

export function unavailableError(): DochubError {
  return new DochubError(503, DOCHUB_UNAVAILABLE_MESSAGE);
}
