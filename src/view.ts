import * as E from 'fp-ts/lib/Either';
import { RequestHandler } from 'express';
import { createPayService, OrderReceivePayload } from './service';
import { createInventoryConnector } from './connectors/inventoryConnector';
import { createOrderConnector } from './connectors/orderConnector';
import { createPSPConnector } from './connectors/PSPConnector';
import { assertUnreachable } from './utils';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

/**
 * This is an HTTP/Express specific view implementation for the payment logic.
 */
export const paymentHandler: RequestHandler = async (req, res) => {
  /**
   * Here we need to parse the request body to make sure the incoming dat is valid,
   * and reject the request if that's not the case.
   */
  const orderReceivePayload = OrderReceivePayload.decode(req.body);
  if (E.isLeft(orderReceivePayload)) {
    res.status(400).send('Invalid request');
    logger.info('Invalid request input', orderReceivePayload.left);
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
     *
     * This is a horrible nested switch case that you could definitely write in
     * a nicer way, but for the sake of example everything is here now.
     *
     * Note that each switch statement ends with the default branch returning
     * assertUnreachable, which makes the compiler error unless all the different
     * outcomes are handled explicitly.
     */

    switch (response._failureType) {
      case 'GetInventoryForProductFailure':
        switch (response.failure._failureType) {
          /**
           * If the product was not found, maybe someone is just sending something
           * silly into our API, so we can log it as a warning...
           */
          case 'ProductNotFoundFailure':
            logger.warn(
              `Product not found for ID ${response.failure.productId}`,
              response,
            );
            break;
          /**
           * ...but if we failed to read the inventory at all, something is wrong
           * in our system.
           */
          case 'ConnectionError':
          case 'DatabaseError':
            logger.error(
              `Failed to get inventory due to ${response.failure._failureType}`,
              response,
            );
            break;
          default:
            return assertUnreachable(response.failure);
        }
        break;

      case 'OutOfStockFailure':
        /**
         * If we had an expected error such as a product not being available, we can
         * log it as a warning or even info, as it should not be a cause for concern.
         */
        logger.warn(
          `Product out of stock for ID ${response.productId}`,
          response,
        );
        break;

      case 'PSPMakePaymentFailure':
        switch (response.failure._failureType) {
          /**
           * If the payment failed due to insufficient funds or fraud suspicion, that's
           * not a cause for concern...
           */
          case 'InsufficientFundsFailure':
          case 'FraudSuspectedFailure':
            logger.warn(
              `Payment rejected by PSP due to ${response.failure._failureType}`,
              response,
            );
            break;
          /**
           * ...but if we failed to reach the PSP, that's a cause for concern, as we may
           * have e.g. network issues or expired API keys.
           */
          case 'ConnectionError':
          case 'HttpResponseError':
            logger.error(
              `Payment failed due to ${response.failure._failureType}`,
              response,
            );
            break;
          default:
            return assertUnreachable(response.failure);
        }
        break;

      case 'CreateOrderFailure':
        /**
         * Failing to create order indicates a problem in our system, so log an
         * error when that happens.
         */
        logger.error(
          `Failed to create order for transaction ID ${response.paymentTransactionId}`,
          response,
        );
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
    logger.info('Handled order successfully', response);
    return;
  }
};
