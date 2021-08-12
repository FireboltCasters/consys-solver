import { Domain, PreferenceFunction } from "./Domain";


export default class Set<T> extends Domain<T> {

  private readonly values: T[];

  constructor(values: T[], preference?: PreferenceFunction<T>) {
    super(preference);
    this.values = values.filter((value: T, index: number) => {
      return values.indexOf(value) === index;
    });
  }

  override getValues(): T[] {
    return this.values;
  }
}
