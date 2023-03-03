import { IntegrationError } from './common';

type PSPMakePaymentPayload = {
  orderId: string;
  amount: number;
};

/**
 * TODO: should a failed payment be a failure here, or on the business logic level?
 */
export type PSPMakePaymentFailure = {
  _type: 'failure';
  _failureType: 'PSPMakePaymentFailure';
  failure: IntegrationError;
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
  makePayment: (
    payload: PSPMakePaymentPayload,
  ) => Promise<PSPMakePaymentResponse>;
};

export const createPSPConnector = (): PSPConnector => ({
  makePayment: async (_payload) => {
    return { _type: 'success', transactionId: 'transaction-id-123' };
  },
});
