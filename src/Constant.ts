import Domain from './Domain';

/**
 * Represents a domain with a constant value that cannot be changed.
 */
export default class Constant<T> extends Domain<T> {
  private readonly value: T;

  /**
   * Creates a new constant value.
   *
   * @param value value
   */
  constructor(value: T) {
    super();
    this.value = value;
  }

  /**
   * Returns the constant value.
   */
  override getValues(): T[] {
    return [this.value];
  }
}
