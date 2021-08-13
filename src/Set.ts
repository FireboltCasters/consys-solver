import Domain, {PreferenceFunction} from './Domain';

/**
 * Represents a set of values, where each element is contained once at max.
 */
export default class Set<T> extends Domain<T> {
  private readonly values: T[];

  /**
   * Creates a new set of values.
   *
   * @param values values of the set
   * @param preference preference function
   */
  constructor(values: T[], preference?: PreferenceFunction<T>) {
    super(preference);
    this.values = values.filter((value: T, index: number) => {
      return values.indexOf(value) === index;
    });
  }

  /**
   * Returns all values of this set.
   */
  override getValues(): T[] {
    return this.values;
  }
}
