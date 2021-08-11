import {ConstraintSystem} from 'consys';
import Solver from '../Solver';
import Range from '../domains/Range';
import Set from '../domains/Set';
import Constant from '../domains/Constant';

type Model = {
  name: string;
  age: number;
  maxAge: number;
  absoluteMaxAge: number;
  details: {
    phone: number;
  };
};

const system = new ConstraintSystem<Model, {}>();

system.addFunction('STARTS_WITH', (string: string, prefix: string) =>
  string.startsWith(prefix)
);

system.addConstraint({
  constraint: 'ALWAYS: $age % 42 == 4 && $age != 0',
});

system.addConstraint({
  constraint: 'ALWAYS: $age < $maxAge',
});

system.addConstraint({
  constraint: 'ALWAYS: ($maxAge + $absoluteMaxAge) % 8 == 0',
});

system.addConstraint({
  constraint: 'ALWAYS: $age + $maxAge == $absoluteMaxAge',
});

system.addConstraint({
  constraint: "ALWAYS: STARTS_WITH($name, 'N')",
});

const solver = new Solver<Model, {}>(system, 10000);

let modelHint = {
  name: new Set(['Pete', 'Nils', 'Steffen', 'Johann'], (name: string) => {
    if (name.toLowerCase().startsWith('s')) {
      return 1;
    }
    return 0;
  }),
  age: new Range(0, 100, 0.5, (value: number) => {
    return value;
  }),
  maxAge: new Range(0, 100, 0.5, (value: number) => {
    return -value;
  }),
  absoluteMaxAge: new Range(0, 100, 0.5, (value: number) => {
    return -value;
  }),
  details: {
    phone: new Constant(40343),
  },
};

test('SolverTest', () => {
  let one = solver.find(modelHint, {}, 0.2);
  console.log('Found model: ', one);

  expect(() => {
    throw Error();
  }).toThrowError();
});
