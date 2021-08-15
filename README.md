<h1><a href="https://www.npmjs.com/package/consys-solver"><img src="https://user-images.githubusercontent.com/37511270/127232757-a7fcfdbf-44d1-429a-8531-41a3d0d9e40d.png" width="50" heigth="50" /></a><a href="https://www.npmjs.com/package/consys-solver">consys-solver</a> - find feasible model assignments</h1>

<p align="left">
  <a href="https://badge.fury.io/js/consys-solver.svg"><img src="https://badge.fury.io/js/consys-solver.svg" alt="npm package" /></a>
  <a href="https://img.shields.io/github/license/FireboltCasters/consys-solver"><img src="https://img.shields.io/github/license/FireboltCasters/consys-solver" alt="MIT" /></a>
  <a href="https://img.shields.io/github/last-commit/FireboltCasters/consys-solver?logo=git"><img src="https://img.shields.io/github/last-commit/FireboltCasters/consys-solver?logo=git" alt="last commit" /></a>
  <a href="https://www.npmjs.com/package/consys-solver"><img src="https://img.shields.io/npm/dm/consys-solver.svg" alt="downloads week" /></a>
  <a href="https://www.npmjs.com/package/consys-solver"><img src="https://img.shields.io/npm/dt/consys-solver.svg" alt="downloads total" /></a>
  <a href="https://github.com/FireboltCasters/consys-solver"><img src="https://shields.io/github/languages/code-size/FireboltCasters/consys-solver" alt="size" /></a>
  <a href="https://david-dm.org/FireboltCasters/consys-solver"><img src="https://david-dm.org/FireboltCasters/consys-solver/status.svg" alt="dependencies" /></a>
  <a href="https://github.com/google/gts" alt="Google TypeScript Style"><img src="https://img.shields.io/badge/code%20style-google-blueviolet.svg"/></a>
  <a href="https://shields.io/" alt="Google TypeScript Style"><img src="https://img.shields.io/badge/uses-TypeScript-blue.svg"/></a>
  <a href="https://github.com/marketplace/actions/lint-action"><img src="https://img.shields.io/badge/uses-Lint%20Action-blue.svg"/></a>
</p>

<p align="left">
  <a href="https://github.com/FireboltCasters/consys-solver/actions/workflows/npmPublish.yml"><img src="https://github.com/FireboltCasters/consys-solver/actions/workflows/npmPublish.yml/badge.svg" alt="Npm publish" /></a>
  <a href="https://github.com/FireboltCasters/consys-solver/actions/workflows/linter.yml"><img src="https://github.com/FireboltCasters/consys-solver/actions/workflows/linter.yml/badge.svg" alt="Build status" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys-solver"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys-solver&metric=alert_status" alt="Quality Gate" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys-solver"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys-solver&metric=bugs" alt="Bugs" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys-solver"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys-solver&metric=coverage" alt="Coverage" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys-solver"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys-solver&metric=code_smells" alt="Code Smells" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys-solver"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys-solver&metric=duplicated_lines_density" alt="Duplicated Lines (%)" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys-solver"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys-solver&metric=sqale_rating" alt="Maintainability Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys-solver"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys-solver&metric=reliability_rating" alt="Reliability Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys-solver"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys-solver&metric=security_rating" alt="Security Rating" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys-solver"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys-solver&metric=sqale_index" alt="Technical Debt" /></a>
  <a href="https://sonarcloud.io/dashboard?id=FireboltCasters_consys-solver"><img src="https://sonarcloud.io/api/project_badges/measure?project=FireboltCasters_consys-solver&metric=vulnerabilities" alt="Vulnerabilities" /></a>
</p>

**consys-solver** is a tool to find feasable model assignments for [consys](https://www.npmjs.com/package/consys) constraint systems.

- **Easy to integrate:** This solver acts as a decorator, it just requires an instance of an existing constraint system to work.
- **Preferred values:** Assign weights to domain values to increase the likelyhood of a solution with those values.
- **Configurable:** In order to optimize the search process, the solver can be configured to get the best results.

## Installation

**consys-solver** is distributed via [npm](https://www.npmjs.com/package/consys-solver), it can be installed using the following command:

```console
npm install consys-solver
```

## Quick start

Once installed, a solver instance can be instantiated for an existing constraint system. Here is an example:

```typescript
import {ConstraintSystem} from 'consys';
import {Solver, Set, Range} from 'consys-solver';

type Person = {name: string; age: number};

// Create a simple constraint system for a Person model
const personConstraints = new ConstraintSystem<Person, {}>();
personConstraints.addFunction('LENGTH', (str: string) => {
  return str.length;
});
personConstraints.addConstraints([
  {constraint: 'ALWAYS: LENGTH($name) < 6'},
  {constraint: 'ALWAYS: $age > 21 && $age < 42'},
]);

// Now, we can create a solver instance
const solver = new Solver(personConstraints);

let names = ['Mike', 'Peter', 'Lara', 'Isabelle'];
let personDomains = {
  // A set with higher preference for long names
  name: new Set(names, (name: string) => {
    return name.length;
  }),
  // Number range with preference for higher age
  age: new Range(0, 100, 1, (age: number) => {
    return age / 10;
  }),
};

// Finally, search for one solution
let solution = solver.find(1, personDomains, {});
console.log('Solution: ', solution);
```

Output:

```console
>> Solution:  [ { name: 'Peter', age: 41 } ]
```

## Contributors

The FireboltCasters

<a href="https://github.com/FireboltCasters/consys-solver"><img src="https://contrib.rocks/image?repo=FireboltCasters/consys-solver" alt="Contributors" /></a>
