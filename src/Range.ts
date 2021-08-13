import Domain, {PreferenceFunction} from './Domain';

/**
 * Represents a range of numbers, with a start value, end value, and step size
 * between the values.
 */
export default class Range extends Domain<number> {
  private readonly start: number;
  private readonly end: number;
  private readonly step: number;

  /**
   * Creates a new range domain.
   *
   * @param start start value
   * @param end end value
   * @param step interval between values
   * @param preference preference function
   */
  constructor(
    start: number,
    end: number,
    step: number,
    preference?: PreferenceFunction<number>
  ) {
    super(preference);
    this.start = Math.min(start, end);
    this.end = Math.max(start, end);
    this.step = Math.abs(step);
  }

  /**
   * Returns all values of this range.
   */
  override getValues(): number[] {
    let res: number[] = [];
    for (let value = this.start; value <= this.end; value += this.step) {
      res.push(value);
    }
    return res;
  }
}
