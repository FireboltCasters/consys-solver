import { Domain } from "./Domain";


export default class Constant<T> extends Domain<T> {

  private readonly value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }


  override getValues(): T[] {
    return [this.value];
  }
}
