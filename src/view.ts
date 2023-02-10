import * as E from 'fp-ts/lib/Either';
import express from 'express';
import { createPayService, OrderReceivePayload } from './service';
import { createProductConnector } from './connectors/productConnector';
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
    createProductConnector(),
    createInventoryConnector(),
    createOrderConnector(),
    createPSPConnector(),
  );

  const response = await payService.receiveOrder(orderReceivePayload.right);

  if (response._type === 'failure') {
    // TODO: reporting
    res.status(400).send('Payment failed');
    return;
  }

  // TODO: reporting
  res.status(200).send('Payment successful');
});

app.listen(3000, () => {
  console.log('Listening on port 3000!');
});
