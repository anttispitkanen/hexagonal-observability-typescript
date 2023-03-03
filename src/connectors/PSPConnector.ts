import { IntegrationError } from './common';

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

/**
 * The payment can fail for various reasons, like the customer not having enough
 * available funds to spend, or the PSP rejecting the payment for fraud, both
 * after successfully communicating with the PSP. It can also fail due to an
 * integration error preventing the communication at all.
 */
export type PSPMakePaymentFailure = {
  _type: 'failure';
  _failureType: 'PSPMakePaymentFailure';
  failure: InsufficientFundsFailure | FraudSuspectedFailure | IntegrationError;
};

type PSPMakePaymentSuccess = {
  _type: 'success';
  transactionId: string;
};

type PSPMakePaymentResponse = PSPMakePaymentFailure | PSPMakePaymentSuccess;

export type PSPConnector = {
  /**
   * Make the payment request to the PSP, probably over and HTTP API. Failure
   * modes can include the PSP rejecting the payment for various reasons, like
   * the customer not having enough balance or fraud suspicion, or integration
   * level errors like the PSP being down, or our app not being able to reach the
   * network.
   */
  makePayment: (amount: number) => Promise<PSPMakePaymentResponse>;
};

export const createPSPConnector = (): PSPConnector => ({
  makePayment: async (_amount) => {
    return { _type: 'success', transactionId: 'transaction-id-123' };
  },
});
