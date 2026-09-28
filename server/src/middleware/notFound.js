import { ApiError } from '../utils/errors.js'
export const notFound = (_req, _res, next) => next(new ApiError(404, 'The requested API route was not found.'))
