import { IntegrationError } from './common';

type ProductNotFound = {
  _type: 'productNotFound';
};

type GetProductFailure = {
  _type: 'failure';
  productId: string;
  failure: ProductNotFound | IntegrationError;
};

type Product = {
  productId: string;
  name: string;
  price: number;
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
