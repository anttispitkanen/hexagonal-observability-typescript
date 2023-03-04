/**
 * We had a connection error when trying to call an API or database over the wire.
 */
type ConnectionError = {
  _type: 'failure';
  _failureType: 'ConnectionError';
  errorCode: string; // e.g. ECONNREFUSED
  error: Error;
};

/**
 * We manged to call a database, but got an error response, from
 * e.g. a constraint violation.
 */
type DatabaseInternalError = {
  _type: 'failure';
  _failureType: 'DatabaseError';
  errorMessage: string;
  error: Error;
};

export type DatabaseConnectionError = DatabaseInternalError | ConnectionError;

/**
 * We managed to call an HTTP API, but got an HTTP error response.
 */
type HttpResponseError = {
  _type: 'failure';
  _failureType: 'HttpResponseError';
  statusCode: number;
  errorMessage: string;
};

export type HttpApiError = HttpResponseError | ConnectionError;
