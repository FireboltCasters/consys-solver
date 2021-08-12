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
  constraint: 'ALWAYS: $age % 5 == 0 && $age != 0',
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

const solver = new Solver<Model, {}>(system);

let modelHint = {
  name: new Set(['Pete', 'Nils', 'Steffen', 'Johann'], (name: string) => {
    if (name.toLowerCase().startsWith('s')) {
      return 1;
    }
    return 0;
  }),
  age: new Range(0, 100, 0.5, (value: number) => {
    if (value === 10) return 10;
    return 1;
  }),
  maxAge: new Range(0, 100, 0.5, (value: number) => {
    if (value === 11) return 10;
    return 1;
  }),
  absoluteMaxAge: new Range(0, 100, 0.5, (value: number) => {
    return -value;
  }),
  details: {
    phone: new Constant(40343),
  },
};

test('SolverTest', () => {
  let one = solver.find(
    10,
    modelHint,
    {},
    {
      maxIterations: 10000,
      randomnessFactor: 0.2,
      preferenceFactor: 0.5,
    }
  );
  console.log('Found models: ', one);

  // let keys = {
  //   a: 0,
  //   b: 1,
  //   c: 0,
  //   d: 2
  // }
  //
  // let res: { [key: string]: number } = {};
  //
  // for (let i = 0; i < 1000; i++) {
  //   let key = solver.chooseKey(keys);
  //   if (!res[key]) {
  //     res[key] = 0;
  //   }
  //   res[key]++;
  // }
  //
  // console.log("res: ", res);

  expect(() => {
    throw Error();
  }).toThrowError();
});
