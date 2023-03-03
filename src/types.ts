import * as t from 'io-ts';

/**
 * Our business logic level representation of a customer.
 */
export const Customer = t.type({
  name: t.string,
  email: t.string,
  address: t.string,
});

export type Customer = t.TypeOf<typeof Customer>;

/**
 * Our business logic level representation of a product.
 */
export const Product = t.type({
  productId: t.string,
  name: t.string,
  price: t.number,
});

export type Product = t.TypeOf<typeof Product>;
