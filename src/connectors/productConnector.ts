import { Product } from '../types';
import { IntegrationError } from './common';

export type GetProductFailure = {
  _type: 'failure';
  _failureType: 'GetProductFailure';
  productId: string;
  failure: IntegrationError;
};

type GetProductSuccess = {
  _type: 'success';
  product: Product;
};

type GetProductResponse = GetProductFailure | GetProductSuccess;

export type ProductConnector = {
  /**
   * Fetch the product from some data source. Failure modes include the product
   * not being found, or an integration error such as database connection failure
   * or network failure.
   */
  getProduct: (productId: string) => Promise<GetProductResponse>;
};

export const createProductConnector = (): ProductConnector => ({
  getProduct: async (productId: string) => {
    // Here we would fetch the product from the database or wherever it is stored.
    return {
      _type: 'success',
      product: { productId, name: 'Some product', price: 100 },
    };
  },
});
