import * as t from 'io-ts';
import { InventoryConnector } from './connectors/inventoryConnector';
import { OrderConnector } from './connectors/orderConnector';
import { ProductConnector } from './connectors/productConnector';
import { PSPConnector } from './connectors/PSPConnector';

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

// FIXME:
export type ProductDoesNotExist = {
  _type: 'productDoesNotExist';
  productId: string;
};

export type ReceiveOrderFailure = {
  _type: 'failure';
  failure: ProductDoesNotExist;
};

export type ReceiveOrderSuccess = {
  _type: 'success';
  orderId: string;
  price: number;
};

export type ReceiveOrderResponse = ReceiveOrderFailure | ReceiveOrderSuccess;

export type PayService = {
  /**
   * This method is called with the payload needed for creating and paying for an
   * order. Note that this is agnostic of the transport layer, so it can be called
   * from an HTTP endpoint handler, a message queue handler, a CLI command, or any
   * other way. But since this is the internal part of the hexagon, the input is
   * assumed to be parsed and schematically valid at this point by the invoking view
   * layer.
   */
  receiveOrder: (payload: OrderReceivePayload) => Promise<ReceiveOrderResponse>;
};

export const createPayService = (
  productConnector: ProductConnector,
  inventoryConnector: InventoryConnector,
  orderConnector: OrderConnector,
  pspConnector: PSPConnector,
): PayService => ({
  receiveOrder: async (payload) => {
    /**
     * Then we run a set of business level validations on it, like check that the bought product actually exists and is available.
     * Then we create the order into our system.
     * Then we contact a payment service provider (PSP) for handling the monetary transaction. This can be rejected for many reasons at their end, including the customer not having enough money to spend, or the PSP suspecting fraud.
     * If we get a successful response, we record that to our system.
     * At the end, we return a response to the customer, probably redirecting them to an order creation page of some sort.
     */

    /**
     * First we check that the product exists and is available.
     */
    const productResponse = await productConnector.getProduct(
      payload.productId,
    );

    /**
     * If the product fetching failed, we return a failure response.
     */
    if (productResponse._type === 'failure') {
      return {
        _type: 'failure',
        failure: { _type: 'productDoesNotExist', productId: payload.productId },
      };
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
      return {
        _type: 'failure',
      };
    }

    /**
     * If the product is not available, we return a failure response.
     */
    if (inventoryResponse.inventoryAmount < 1) {
      return {
        _type: 'failure',
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
      return {
        _type: 'failure',
      };
    }

    /**
     * Then we try to make the payment to the PSP.
     */
    const pspResponse = await pspConnector.makePayment({
      orderId: orderResponse.orderId,
      amount: productResponse.product.price,
    });

    if (pspResponse._type === 'failure') {
      return {
        _type: 'failure',
      };
    }

    /**
     * Then we record the payment to our system.
     */

    const recordPaymentResponse = await orderConnector.recordPaymentForOrder(
      orderResponse.orderId,
      pspResponse.transactionId,
      productResponse.product.price,
    );

    if (recordPaymentResponse._type === 'failure') {
      return {
        _type: 'failure',
      };
    }

    /**
     * Return the success response at the end if we get this far.
     */
    return {
      _type: 'success',
      orderId: orderResponse.orderId,
      price: productResponse.product.price,
    };
  },
});
