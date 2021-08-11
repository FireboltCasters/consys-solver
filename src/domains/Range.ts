import { Domain, PreferenceFunction } from "./Domain";


export default class Range extends Domain<number> {

  private readonly start: number;
  private readonly end: number;
  private readonly step: number;

  constructor(start: number, end: number, step: number, preferenceFunction?: PreferenceFunction<number>) {
    super(preferenceFunction);
    this.start = Math.min(start, end);
    this.end = Math.max(start, end);
    this.step = Math.abs(step);
  }

  override getValues(): number[] {
    let res: number[] = [];
    for (let value = this.start; value <= this.end; value += this.step) {
      res.push(value);
    }
    return res;
  }
}
