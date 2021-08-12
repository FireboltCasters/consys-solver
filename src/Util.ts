export default class Util {
  static clone<T>(object: T): T {
    return JSON.parse(JSON.stringify(object));
  }
}
