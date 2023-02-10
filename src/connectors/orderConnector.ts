type CreateOrderPayload = {
  productId: string;
  price: number;
  customer: {
    name: string;
    email: string;
    address: string;
  };
};

type CreateOrderFailure = {
  _type: 'failure';
};

type CreateOrderSuccess = {
  _type: 'success';
  orderId: string;
};

type CreateOrderResponse = CreateOrderFailure | CreateOrderSuccess;

type RecordPaymentFailure = {
  _type: 'failure';
};

type RecordPaymentSuccess = {
  _type: 'success';
};

type RecordPaymentResponse = RecordPaymentFailure | RecordPaymentSuccess;

export type OrderConnector = {
  /**
   * Crete the order into our system. Probably by persisting it into a database.
   * Failure modes can include some database constraint violation, or a network error,
   * to name a few.
   */
  createOrder: (payload: CreateOrderPayload) => Promise<CreateOrderResponse>;

  /**
   * Record the payment to our system. Probably by persisting it into a database.
   * Failure modes can include some database constraint violation, or a network error,
   * to name a few.
   */
  recordPaymentForOrder: (
    orderId: string,
    transactionId: string,
    amount: number,
  ) => Promise<RecordPaymentResponse>;
};

export const createOrderConnector = (): OrderConnector => ({
  createOrder: async (payload: CreateOrderPayload) => {
    // Here we would create the order, probably in the database, and return whatever
    // the business logic requires us to return.
    return { _type: 'success', orderId: '123' };
  },

  recordPaymentForOrder: async (orderId, transactionId, amount) => {
    // Here we would record the payment, probably in the database, and return whatever
    // the business logic requires us to return.
    return { _type: 'success' };
  },
});
