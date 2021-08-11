export type PreferenceFunction<T> = (value: T) => number;

export abstract class Domain<T> {
  readonly kind: string = 'Domain';

  protected valuePreference: (value: T) => number;

  protected constructor(valuePreference: PreferenceFunction<T> = () => 1) {
    this.valuePreference = valuePreference;
  }

  getPreferredValues(): T[] {
    return this.getValues().sort((a: T, b: T) => {
      return this.valuePreference(b) - this.valuePreference(a);
    });
  }

  abstract getValues(): T[];
}
