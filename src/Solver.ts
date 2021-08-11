import {ConstraintSystem} from 'consys';
import {ModelDomain} from './domains/ModelDomain';
import {Domain} from './domains/Domain';

type FlatModelDomain = {[key: string]: Domain<any>};
type ModelDomains = {[key: string]: {index: number; values: any[]}};

export default class Solver<M, S> {
  private readonly system: ConstraintSystem<M, S>;
  private readonly maxSteps: number;
  private lookAhead: number;
  private alpha: number = 0.2;

  constructor(
    system: ConstraintSystem<M, S>,
    maxSteps: number = 10000,
    lookAhead?: number
  ) {
    this.system = system;
    this.maxSteps = maxSteps;
    this.lookAhead = !!lookAhead ? lookAhead : -1;
  }

  private static flattenModelDomain(
    modelDomain: ModelDomain,
    parent?: string,
    res: FlatModelDomain = {}
  ): FlatModelDomain {
    for (let key in modelDomain) {
      let propertyName = parent ? parent + '.' + key : key;
      if (modelDomain[key]['kind'] !== 'Domain') {
        Solver.flattenModelDomain(
          modelDomain[key] as ModelDomain,
          propertyName,
          res
        );
      } else {
        res[propertyName] = modelDomain[key] as Domain<any>;
      }
    }
    return res;
  }

  private static getModelDomains(modelDomain: ModelDomain): ModelDomains {
    let flattened = Solver.flattenModelDomain(modelDomain);
    let res: ModelDomains = {};
    Object.keys(flattened).map(key => {
      res[key] = {
        index: 0,
        values: flattened[key].getPreferredValues(),
      };
    });
    return res;
  }

  private static insertValue(object: any, key: string, value: any) {
    let keys = key.split('.');
    let obj = object;
    for (let i = 0; i < keys.length - 1; i++) {
      let currentKey = keys[i];
      if (!obj[currentKey]) {
        obj[currentKey] = {};
      }
      obj = obj[currentKey];
    }
    let lastKey = keys[keys.length - 1];
    obj[lastKey] = value;
  }

  private getCurrentModel(modelDomains: ModelDomains): M {
    let res = {};
    for (let key of Object.keys(modelDomains)) {
      let domain = modelDomains[key];
      Solver.insertValue(res, key, domain.values[domain.index]);
    }
    return res as M;
  }

  /**
   * Calculates a logarithmic score between 0 (bad) and 1 (perfect) for a given model and state.
   *
   * @param model model instance
   * @param state state instance
   * @private
   */
  private getLogScore(model: M, state: S): number {
    return (
      1.0 / (1.0 + this.system.getNumInconsistentConstraints(model, state))
    );
  }

  private isModelConsistent(model: M, state: S): boolean {
    return this.system.getNumInconsistentConstraints(model, state) === 0;
  }

  /**
   * Randomly chooses a key based on their counts as weights.
   *
   * @param keyCounts key counts
   * @private
   */
  private chooseKey(keyCounts: {[key: string]: number}): string {
    let keys = Object.keys(keyCounts);

    // To avoid local maximums and plateaus, choose completely random sometimes
    if (Math.random() < this.alpha) {
      return Solver.chooseRandom(keys);
    }
    let totalCount = Object.values(keyCounts).reduce((a, b) => a + b);
    let target = Math.random() * totalCount;
    for (let key of keys) {
      let count = keyCounts[key];
      target -= count;
      if (target <= count) {
        return key;
      }
    }
    return Solver.chooseRandom(keys);
  }

  private getNextValuesForKey(domains: ModelDomains, key: string): any[] {
    let currentIndex = domains[key].index;
    let currentValues = domains[key].values;
    let start = Math.max(0, (currentIndex - this.lookAhead / 2) | 0);
    let end = Math.min(
      currentValues.length,
      (currentIndex + this.lookAhead / 2) | 0
    );
    return currentValues.slice(start, end);
  }

  private getNextModels(
    domains: ModelDomains,
    key: string,
    nextValues: any[]
  ): M[] {
    let res: M[] = [];
    for (let nextValue of nextValues) {
      let model = this.getCurrentModel(domains);
      Solver.insertValue(model, key, nextValue);
      res.push(model);
    }
    return res;
  }

  private getNextBestModel(
    domains: ModelDomains,
    currentModel: M,
    state: S
  ): M | null {
    let statisticsReport = this.system.evaluateStatistics(currentModel, state);
    let keyInfluences = statisticsReport.inconsistent.model;
    let nextKey = this.chooseKey(keyInfluences);
    let nextValuesForKey = this.getNextValuesForKey(domains, nextKey);
    let nextModels = this.getNextModels(domains, nextKey, nextValuesForKey);
    let bestModel = this.minConflicts(nextModels, state);
    if (!bestModel) {
      return null;
    }
    domains[nextKey].index = nextModels.indexOf(bestModel);
    return bestModel;
  }

  private static chooseRandom<T>(values: T[]): T {
    return values[(Math.random() * values.length) | 0];
  }

  private minConflicts(models: M[], state: S): M | null {
    // To avoid local maximums and plateaus, choose completely random sometimes
    if (Math.random() < this.alpha) {
      return Solver.chooseRandom(models);
    }

    let bestModel: M | null = null;
    let bestScore: number = 0;
    for (let model of models) {
      let score = this.getLogScore(model, state);
      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }
    return bestModel;
  }

  private static getMaxLookAhead(domains: ModelDomains): number {
    let maxLength = 0;
    for (let key of Object.keys(domains)) {
      let values = domains[key].values;
      if (values.length > maxLength) {
        maxLength = values.length;
      }
    }
    return maxLength * 2;
  }

  find(modelDomain: ModelDomain, state: S, alpha?: number): M | null {
    let domains = Solver.getModelDomains(modelDomain);
    if (this.lookAhead < 0) {
      this.lookAhead = Solver.getMaxLookAhead(domains);
    }
    if (!!alpha) {
      this.alpha = Math.max(0, Math.min(alpha, 1));
    }
    console.log(
      'consys-solver: Starting search with alpha: ',
      this.alpha,
      ', lookAhead: ',
      this.lookAhead,
      ', maxIterations: ',
      this.maxSteps
    );
    let currentModel: M | null = this.getCurrentModel(domains);
    let iterations = 0;
    for (let i = 0; i < this.maxSteps; i++) {
      if (!!currentModel) {
        if (this.isModelConsistent(currentModel, state)) {
          console.log(
            'consys-solver: Found solution in ',
            iterations,
            ' iterations'
          );
          return currentModel;
        }
        currentModel = this.getNextBestModel(domains, currentModel, state);
      }
      iterations++;
    }
    console.log(
      'consys-solver: Found no solution in ',
      iterations,
      ' iterations'
    );
    return null;
  }
}
