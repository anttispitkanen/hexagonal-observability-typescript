/**
 * We manged to call a database, but got an error response.
 */
type DatabaseError = {
  _type: 'failure';
  _failureType: 'DatabaseError';
  errorMessage: string;
  error: Error;
};

/**
 * We managed to call an API, but got an error response.
 */
type HttpResponseError = {
  _type: 'failure';
  _failureType: 'HttpResponseError';
  statusCode: number;
  errorMessage: string;
};

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
 * A generic error about integrating to an external system, like a database or
 * an HTTP API.
 */
export type IntegrationError = {
  _type: 'failure';
  _failureType: 'IntegrationError';
  failure: DatabaseError | HttpResponseError | ConnectionError;
};
