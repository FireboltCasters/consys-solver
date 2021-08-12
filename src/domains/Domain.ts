
export type PreferenceFunction<T> = (value: T) => number;

export abstract class Domain<T> {

  static readonly maxPreference = 10;

  readonly kind: string = "Domain";

  protected valuePreference: (value: T) => number;

  protected constructor(valuePreference: PreferenceFunction<T> = () => 1) {
    this.valuePreference = valuePreference;
  }

  getPreferenceValue(element: T): number {
    return Math.max(0, Math.min(this.valuePreference(element), Domain.maxPreference));
  }

  abstract getValues(): T[]
}
