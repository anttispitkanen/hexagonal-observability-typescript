import { DatabaseConnectionError } from './common';

type ProductNotFoundFailure = {
  _type: 'failure';
  _failureType: 'ProductNotFoundFailure';
  productId: string;
};

export type GetInventoryForProductFailure = {
  _type: 'failure';
  _failureType: 'GetInventoryForProductFailure';
  productId: string;
  failure: ProductNotFoundFailure | DatabaseConnectionError;
};

type GetInventoryForProductSuccess = {
  _type: 'success';
  productId: string;
  inventoryAmount: number;
};

type GetInventoryForProductResponse =
  | GetInventoryForProductFailure
  | GetInventoryForProductSuccess;

export type InventoryConnector = {
  /**
   * Get the inventory level for a product. Failure modes include the product not
   * being found, and database not being available at all.
   */
  getInventoryForProduct: (
    productId: string,
  ) => Promise<GetInventoryForProductResponse>;
};

export const createInventoryConnector = (): InventoryConnector => ({
  getInventoryForProduct: async (productId) => {
    // Here we would read the inventory level, probably from a database or a cache.
    return { _type: 'success', productId, inventoryAmount: 10 };
  },
});
