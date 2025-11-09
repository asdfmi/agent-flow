import { ValidationError } from '#domain/errors.js';

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch((error) => handleHttpError(res, error));
  };
}

export function handleHttpError(res, error) {
  if (error instanceof ValidationError) {
    res.status(400).json({ error: 'validation_failed', message: error.message });
    return;
  }
  console.error('API error', error);
  res.status(500).json({ error: 'internal_error', message: 'Unexpected server error' });
}
