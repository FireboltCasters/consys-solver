/**
 * Maps values of a domain to a weight between 0 and 10. Higher weights make it
 * more likely for the value to be chosen by the solver.
 */
export type PreferenceFunction<T> = (value: T) => number;

/**
 * Represents an abstract domain for the solver.
 */
export default abstract class Domain<T> {
  // maximum preference value
  static readonly maxPreference = 10;

  // internally used to determine the type
  readonly kind: string = 'Domain';

  // preference function
  protected valuePreference: (value: T) => number;

  /**
   * Creates an abstract domain with a preference function. This function
   * associates weights from 0 to 10 for each value in the domain. Higher
   * preference weights mean that the value is more likely to be chosen.
   *
   * @param valuePreference preference function
   * @protected
   */
  protected constructor(valuePreference: PreferenceFunction<T> = () => 1) {
    this.valuePreference = valuePreference;
  }

  /**
   * Returns the preference value for a particular element.
   *
   * @param element element
   */
  getPreferenceValue(element: T): number {
    return Math.max(
      0,
      Math.min(this.valuePreference(element), Domain.maxPreference)
    );
  }

  /**
   * Should return all values of the domain. The order is irrelevant.
   */
  abstract getValues(): T[];
}
