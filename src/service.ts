import * as t from 'io-ts';
import {
  GetInventoryForProductFailure,
  InventoryConnector,
} from './connectors/inventoryConnector';
import {
  CreateOrderFailure,
  OrderConnector,
  RecordPaymentFailure,
} from './connectors/orderConnector';
import {
  GetProductFailure,
  ProductConnector,
} from './connectors/productConnector';
import { PSPConnector, PSPMakePaymentFailure } from './connectors/PSPConnector';
import { Product } from './types';

/**
 * The io-ts type for the payload needed for creating and paying for an order.
 */
export const OrderReceivePayload = t.type({
  productId: t.string,
  customer: t.type({
    name: t.string,
    email: t.string,
    address: t.string,
  }),
});
type OrderReceivePayload = t.TypeOf<typeof OrderReceivePayload>;

type OutOfStockFailure = {
  _type: 'failure';
  _failureType: 'OutOfStockFailure';
  productId: string;
};

type HandleOrderFailure =
  | GetProductFailure
  | GetInventoryForProductFailure
  | OutOfStockFailure
  | CreateOrderFailure
  | PSPMakePaymentFailure
  | RecordPaymentFailure;

type HandleOrderSuccess = {
  _type: 'success';
  orderId: string;
  transactionId: string;
  product: Product;
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
  productConnector: ProductConnector,
  inventoryConnector: InventoryConnector,
  orderConnector: OrderConnector,
  pspConnector: PSPConnector,
): PayService => ({
  receiveOrder: async (payload) => {
    /**
     * First we check that the product exists and is available.
     */
    const productResponse = await productConnector.getProduct(
      payload.productId,
    );

    /**
     * If the product fetching failed, we return the failure response.
     */
    if (productResponse._type === 'failure') {
      return productResponse;
    }

    /**
     * Then we check that the product is available in the inventory.
     */
    const inventoryResponse = await inventoryConnector.getInventoryForProduct(
      productResponse.product.productId,
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
        productId: productResponse.product.productId,
      };
    }

    /**
     * Then we create the order into our system.
     */
    const orderResponse = await orderConnector.createOrder({
      productId: productResponse.product.productId,
      price: productResponse.product.price,
      customer: payload.customer,
    });

    /**
     * If the order creation failed, we return a failure response.
     */
    if (orderResponse._type === 'failure') {
      return orderResponse;
    }

    /**
     * Then we try to make the payment to the PSP.
     */
    const pspResponse = await pspConnector.makePayment({
      orderId: orderResponse.orderId,
      amount: productResponse.product.price,
    });

    if (pspResponse._type === 'failure') {
      return pspResponse;
    }

    /**
     * Then we record the successful payment to our system. Note that here we
     * could also use the different failure types to determine if we should e.g.
     * retry recording the payment response, or cancelling the payment to the PSP.
     */
    const recordPaymentResponse = await orderConnector.recordPaymentForOrder(
      orderResponse.orderId,
      pspResponse.transactionId,
      productResponse.product.price,
    );

    if (recordPaymentResponse._type === 'failure') {
      return recordPaymentResponse;
    }

    /**
     * Return the success response at the end if we get this far.
     */
    return {
      _type: 'success',
      orderId: orderResponse.orderId,
      transactionId: pspResponse.transactionId,
      product: productResponse.product,
    };
  },
});
