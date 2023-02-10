type PSPMakePaymentPayload = {
  orderId: string;
  amount: number;
};

type PSPMakePaymentFailure = {
  _type: 'failure';
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
  makePayment: async (payload) => {
    return { _type: 'success', transactionId: 'transaction-id-123' };
  },
});
