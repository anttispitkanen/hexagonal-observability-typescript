import * as E from 'fp-ts/lib/Either';
import express from 'express';
import { createPayService, OrderReceivePayload } from './service';
import { createInventoryConnector } from './connectors/inventoryConnector';
import { createOrderConnector } from './connectors/orderConnector';
import { createPSPConnector } from './connectors/PSPConnector';

const app = express();

app.post('/api/payment', async (req, res) => {
  /**
   * Here we need to parse the request body to make sure the incoming dat is valid,
   * and reject the request if that's not the case.
   */
  const orderReceivePayload = OrderReceivePayload.decode(req.body);
  if (E.isLeft(orderReceivePayload)) {
    res.status(400).send('Invalid request');
    return;
  }

  /**
   * Instantiate the service and the connectors, and inject them into the service.
   */
  const payService = createPayService(
    createInventoryConnector(),
    createPSPConnector(),
    createOrderConnector(),
  );

  const response = await payService.receiveOrder(orderReceivePayload.right);

  if (response._type === 'failure') {
    /**
     * The response was a failure, so now there are two separate concerns:
     *
     *  1. What to reply to the client (customer)
     *  2. What to log and report to the business
     *
     * Let's handle the first concern first.
     */
    switch (response._failureType) {
      case 'OutOfStockFailure':
        // It seems sensible to tell the customer that the product is out of stock.
        res.status(400).json({ msg: 'Product out of stock' });
        break;
      case 'PSPMakePaymentFailure':
        // Also a payment failure is a failure that the customer can do something with.
        res.status(400).json({ msg: 'Payment failed' });
        break;
      default:
        // For all other failures, we don't want to tell the customer anything about
        // the details, as the failures are internal to the system.
        res.status(500).json({ msg: 'Something went wrong' });
        break;
    }

    /**
     * Then for the second concern, we want to log and report the failure to the
     * monitoring system with as much granularity as possible, and with appropriate
     * levels of urgency.
     */

    switch (response._failureType) {
      /**
       * If we had an expected error such as a product not being available, we can
       * log it as a warning, as it should not be a cause for concern.
       */
      case 'OutOfStockFailure':
        console.warn({ msg: 'Product out of stock', response });
        break;
      case 'PSPMakePaymentFailure':
        console.error({ msg: 'Failed to make payment', response });
        break;
      case 'GetInventoryForProductFailure':
        console.error({ msg: 'Failed to get inventory', response });
        break;
      case 'CreateOrderFailure':
        console.error({ msg: 'Failed to create order', response });
        break;
      default:
        return assertUnreachable(response);
    }
    return;
  } else {
    // The response was success, so return the order ID and the product.
    res
      .status(200)
      .json({ orderId: response.orderId, product: response.product });

    // Also report the success.
    console.log({ msg: 'Handled order successfully', response });
    return;
  }
});

app.listen(3000, () => {
  console.log('Listening on port 3000!');
});
