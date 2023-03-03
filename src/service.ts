import * as t from 'io-ts';
import {
  GetInventoryForProductFailure,
  InventoryConnector,
} from './connectors/inventoryConnector';
import {
  CreateOrderFailure,
  OrderConnector,
} from './connectors/orderConnector';
import { PSPConnector, PSPMakePaymentFailure } from './connectors/PSPConnector';
import { Customer, Product } from './types';

/**
 * The io-ts type for the payload needed for creating and paying for an order.
 */
export const OrderReceivePayload = t.type({
  product: Product,
  customer: Customer,
});
type OrderReceivePayload = t.TypeOf<typeof OrderReceivePayload>;

type OutOfStockFailure = {
  _type: 'failure';
  _failureType: 'OutOfStockFailure';
  productId: string;
};

type HandleOrderFailure =
  | GetInventoryForProductFailure
  | OutOfStockFailure
  | CreateOrderFailure
  | PSPMakePaymentFailure;

type HandleOrderSuccess = {
  _type: 'success';
  orderId: string;
  transactionId: string;
  product: Product;
  customer: Customer;
};

type HandleOrderResponse = HandleOrderFailure | HandleOrderSuccess;

export type PayService = {
  /**
   * This method is called with the payload needed for creating and paying for an
   * order. Note that this is agnostic of the transport layer, so it can be called
   * from an HTTP endpoint handler, a message queue handler, a CLI command, or any
   * other way. But since this is the internal part of the hexagon, the input is
   * assumed to be parsed by the invoking view layer, and schematically valid at
   * this point.
   */
  receiveOrder: (payload: OrderReceivePayload) => Promise<HandleOrderResponse>;
};

export const createPayService = (
  inventoryConnector: InventoryConnector,
  pspConnector: PSPConnector,
  orderConnector: OrderConnector,
): PayService => ({
  receiveOrder: async ({ product, customer }) => {
    /**
     * First check if the product is available in the inventory.
     */
    const inventoryResponse = await inventoryConnector.getInventoryForProduct(
      product.productId,
    );

    /**
     * If the inventory fetching failed, we return a failure response.
     */
    if (inventoryResponse._type === 'failure') {
      return inventoryResponse;
    }

    /**
     * If the product is not available, we return a failure response. Note that
     * this is a business logic level failure: from the connector's point of view,
     * fetching the inventory level succeeded, and it's up to the service to do
     * whatever with that information.
     */
    if (inventoryResponse.inventoryAmount < 1) {
      return {
        _type: 'failure',
        _failureType: 'OutOfStockFailure',
        productId: product.productId,
      };
    }

    /**
     * Then we try to make the payment to the PSP.
     */
    const pspResponse = await pspConnector.makePayment(product.price);

    if (pspResponse._type === 'failure') {
      return pspResponse;
    }

    /**
     * Then we create the order into our system with the successful payment's reference.
     */
    const orderResponse = await orderConnector.createOrder({
      productId: product.productId,
      price: product.price,
      paymentTransactionId: pspResponse.transactionId,
      customer: customer,
    });

    /**
     * If the order creation failed, we return a failure response.
     */
    if (orderResponse._type === 'failure') {
      return orderResponse;
    }

    /**
     * Return the success response at the end if we get this far.
     */
    return {
      _type: 'success',
      orderId: orderResponse.orderId,
      transactionId: pspResponse.transactionId,
      product: product,
      customer: customer,
    };
  },
});
