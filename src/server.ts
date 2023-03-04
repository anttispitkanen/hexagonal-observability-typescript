import express from 'express';
import { paymentHandler } from './view';

const app = express();

app.use(express.json());

app.post('/api/payment', paymentHandler);

app.listen(3000, () => {
  console.log('Listening on port 3000!');
});
