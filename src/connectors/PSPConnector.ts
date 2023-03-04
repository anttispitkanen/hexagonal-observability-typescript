import { HttpApiError } from './common';

type InsufficientFundsFailure = {
  _type: 'failure';
  _failureType: 'InsufficientFundsFailure';
  errorMessage: string;
};

type FraudSuspectedFailure = {
  _type: 'failure';
  _failureType: 'FraudSuspectedFailure';
  errorMessage: string;
};

export type PSPMakePaymentFailure = {
  _type: 'failure';
  _failureType: 'PSPMakePaymentFailure';
  failure: InsufficientFundsFailure | FraudSuspectedFailure | HttpApiError;
};

type PSPMakePaymentSuccess = {
  _type: 'success';
  transactionId: string;
};

type PSPMakePaymentResponse = PSPMakePaymentFailure | PSPMakePaymentSuccess;

export type PSPConnector = {
  /**
   * Make the payment request to the PSP, probably over and HTTP API.
   *
   * The payment can fail for various reasons, like the customer not having enough
   * available funds to spend, or the PSP rejecting the payment for fraud, both
   * after successfully communicating with the PSP (let's assume the responses would
   * be in the HTTP 2XX-3XX series in that case as well). It can also fail due to an
   * HTTP API error preventing the communication at all.
   */
  makePayment: (amount: number) => Promise<PSPMakePaymentResponse>;
};

export const createPSPConnector = (): PSPConnector => ({
  makePayment: async (_amount) => {
    return { _type: 'success', transactionId: 'transaction-id-123' };
  },
});
