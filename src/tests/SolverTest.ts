import { ConstraintSystem } from "consys";
import Solver from "../Solver";
import Range from "../Range";
import Set from "../Set";
import Constant from "../Constant";

type Model = {
  name: string;
  nested: {
    number: number;
  }
  age: number;
  maxAge: number;
  absoluteMaxAge: number;
  details: {
    phone: number;
  };
};

const system = new ConstraintSystem<Model, {}>();

system.addFunction(
  'STARTS_WITH',
  (string: string, prefix: string) => string.startsWith(prefix)
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
  constraint: 'ALWAYS: $age % $maxAge > $nested.number && $nested.number > 0',
});

system.addConstraint({
  constraint: "ALWAYS: STARTS_WITH($name, 'N')",
});

const solver = new Solver<Model, {}>(
  system, {
    lookAheadModels: 400
  }
);

let modelHint = {
  name: new Set(
    ['Pete', 'Nils', 'Steffen', 'Johann'],
    (name: string) => {
      if (name.toLowerCase().startsWith('s')) {
        return 1;
      }
      return 0;
  }),
  nested: {
    number: new Range(
      0, 100, 0.5,
      (value: number) => -value
    ),
  },
  age: new Range(
    0, 100, 0.5,
    (value: number) => -value
  ),
  maxAge: new Range(
    0, 100, 0.5,
    (value: number) => value
  ),
  absoluteMaxAge: new Range(
    0, 100, 0.5,
    (value: number) => -value
    ),
  details: {
    phone: new Constant(40343),
  },
};

const benchmark = (config: {
  maxIterations: number;
  randomnessFactor: number;
  preferenceFactor: number;
  maxSolutions: number;
  n: number;
}) => {

  let counts: {
    [key: number]: {
      iterations: number[],
      numSolutions: number[]
    }
  } = {};

  for (let i = 1; i <= config.maxSolutions; i++) {
    counts[i] = {
      iterations: [],
      numSolutions: []
    };
  }

  for (let i = 1; i <= config.maxSolutions; i++) {
    for (let j = 0; j < config.n; j++) {
      let res = solver.solve(
        i,
        modelHint,
        {},
        {
          maxIterations: config.maxIterations,
          randomnessFactor: config.randomnessFactor,
          preferenceFactor: config.preferenceFactor,
        }
      );
      counts[i].iterations.push(res.iterations);
      counts[i].numSolutions.push(res.solutions.length);
    }
  }

  const getMean = (values: number[]) => {
    return values.reduce((a, b) => a + b) / values.length;
  };

  const getSquaredDiffSum = (values: number[], mean: number) => {
    let res: number[] = [];
    for (let value of values) {
      res.push((value - mean) * (value - mean));
    }
    return res.reduce((a, b) => a + b);
  };

  let result: any[] = [];
  for (let i = 1; i <= config.maxSolutions; i++) {
    let iterations = counts[i].iterations;
    let solutions = counts[i].numSolutions;
    let itMean = getMean(iterations);
    let itSD = Math.sqrt(
      getSquaredDiffSum(iterations, itMean) / iterations.length
    );
    let soMean = getMean(solutions);
    let soSD = Math.sqrt(
      getSquaredDiffSum(solutions, soMean) / solutions.length
    );

    let row: {[key: string]: any} = {};
    row["Target Num Solutions"] = i;
    row["Num Iterations Mean"] = itMean.toFixed(2);
    row["Num Iterations Sigma"] = itSD.toFixed(2);
    row["Num Solutions Mean"] = soMean.toFixed(2);
    row["Num Solutions Sigma"] = soSD.toFixed(2);
    result.push(row);
  }

  return {
    config: config,
    result: result
  };
};

test('SolverTest', () => {

  let result = benchmark({
    maxIterations: 10000,
    randomnessFactor: 0.3,
    preferenceFactor: 0.1,
    maxSolutions: 10,
    n: 5
  });

  console.table(result.config);
  console.table(result.result);

  let solutions = solver.find(1, modelHint, {}, {
    maxIterations: 10000,
    randomnessFactor: 0.3,
    preferenceFactor: 0.1
  });

  console.log("Found " + solutions.length + " solutions: ", solutions);

  expect(() => {
    throw Error();
  }).toThrowError();
});
