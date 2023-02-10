type GetInventoryForProductFailure = {
  _type: 'failure';
};

type GetInventoryForProductSuccess = {
  _type: 'success';
  inventoryAmount: number;
};

type GetInventoryForProductResponse =
  | GetInventoryForProductFailure
  | GetInventoryForProductSuccess;

export type InventoryConnector = {
  /**
   * Get the inventory level for a product. Failure modes include the product not
   * being found, and integration errors.
   */
  getInventoryForProduct: (
    productId: string,
  ) => Promise<GetInventoryForProductResponse>;
};

export const createInventoryConnector = (): InventoryConnector => ({
  getInventoryForProduct: async (productId) => {
    // Here we would read the inventory level, probably from a database or a cache.
    return { _type: 'success', inventoryAmount: 10 };
  },
});
