/**
 * Helper function to assert that a value is never. Useful for making sure switch
 * statements are exhaustive.
 */
export const assertUnreachable = (_x: never): never => {
  throw new Error("Didn't expect to get here");
};
