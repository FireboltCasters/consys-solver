import Range from '../Range';
import Set from '../Set';
import Constant from '../Constant';

test('DomainTest', () => {
  expect(new Constant(42).getValues()).toStrictEqual([42]);

  expect(new Set(['a', 'b', 'a', 'c']).getValues()).toStrictEqual([
    'a',
    'b',
    'c',
  ]);

  expect(new Range(0, 10, 2).getValues()).toStrictEqual([0, 2, 4, 6, 8, 10]);
});
