/**
 * Random number generator. Default math random function is sufficient.
 */
export default class RandomUtils {
  /**
   * Returns a random number between 0 and 1.
   */
  static unsignedFloat(): number {
    return Math.random();
  }
}
