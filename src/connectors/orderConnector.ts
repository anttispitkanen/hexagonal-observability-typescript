import { DatabaseConnectionError } from './common';

type CreateOrderPayload = {
  productId: string;
  price: number;
  paymentTransactionId: string;
  customer: {
    name: string;
    email: string;
    address: string;
  };
};

export type CreateOrderFailure = {
  _type: 'failure';
  _failureType: 'CreateOrderFailure';
  paymentTransactionId: string;
  failure: DatabaseConnectionError;
};

type CreateOrderSuccess = {
  _type: 'success';
  orderId: string;
  price: number;
};

type CreateOrderResponse = CreateOrderFailure | CreateOrderSuccess;

export type OrderConnector = {
  /**
   * Crete the order into our system. Probably by persisting it into a database.
   * Failure modes can include some database constraint violation, or a network error,
   * to name a few.
   */
  createOrder: (payload: CreateOrderPayload) => Promise<CreateOrderResponse>;
};

export const createOrderConnector = (): OrderConnector => ({
  createOrder: async (payload: CreateOrderPayload) => {
    // Here we would create the order, probably in the database, and return whatever
    // the business logic requires us to return.
    return { _type: 'success', orderId: '123', price: payload.price };
  },
});
