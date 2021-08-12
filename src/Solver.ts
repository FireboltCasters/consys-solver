import { ConstraintSystem } from "consys";
import { ModelDomain } from "./domains/ModelDomain";
import { Domain } from "./domains/Domain";

type FlatModelDomain = { [key: string]: Domain<any> };
type ModelDomains = { [key: string]: { index: number, values: any[], preference: (element: any) => number } };

export interface SolverConfig {
  maxIterations?: number;
  lookAheadModels?: number;
  randomnessFactor?: number;
  preferenceFactor?: number;
}

export default class Solver<M, S> {

  private readonly system: ConstraintSystem<M, S>;
  private readonly config = {
    maxIterations: 10000,
    lookAheadModels: -1,
    randomnessFactor: 0.1,
    preferenceFactor: 0.2
  };

  constructor(system: ConstraintSystem<M, S>, config?: SolverConfig) {
    this.system = system;
    if (!!config) {
      this.initConfig(config);
    }
  }

  private initConfig(config: SolverConfig) {
    if (config.maxIterations !== undefined) {
      this.config.maxIterations = Math.max(0, config.maxIterations);
    }
    if (config.lookAheadModels !== undefined) {
      this.config.lookAheadModels = Math.max(0, config.lookAheadModels);
    }
    if (config.randomnessFactor !== undefined) {
      this.config.randomnessFactor = Math.max(0, Math.min(config.randomnessFactor, 1));
    }
    if (config.preferenceFactor !== undefined) {
      this.config.preferenceFactor = Math.max(0, Math.min(config.preferenceFactor, 1));
    }
  }

  private static flattenModelDomain(modelDomain: ModelDomain, parent?: string, res: FlatModelDomain = {}): FlatModelDomain {
    for (let key in modelDomain) {
      let propertyName = parent ? parent + "." + key : key;
      if (modelDomain[key]["kind"] !== "Domain") {
        Solver.flattenModelDomain(modelDomain[key] as ModelDomain, propertyName, res);
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
        values: flattened[key].getValues(),
        preference: (element: any) => {
          return flattened[key].getPreferenceValue(element);
        }
      };
    });
    return res;
  }

  private static insertValue(object: any, key: string, value: any) {
    let keys = key.split(".");
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
    return 1.0 / (1.0 + this.system.getNumInconsistentConstraints(model, state));
  }

  private isModelConsistent(model: M, state: S): boolean {
    return this.system.getNumInconsistentConstraints(model, state) === 0;
  }

  private static shuffle<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Randomly chooses a key based on their counts as weights.
   *
   * @param keyCounts key counts
   * @private
   */
  chooseKey(keyCounts: { [key: string]: number }): string {
    const laplaceAlpha = 0.1;
    let keys = Object.keys(keyCounts);
    Solver.shuffle(keys);
    let totalCount = Object.values(keyCounts)
      .reduce((a, b) => a + b) + laplaceAlpha * keys.length;
    let target = (Math.random() * (totalCount - 1)) + 1;
    for (let key of keys) {
      let count = keyCounts[key] + laplaceAlpha;
      if (target <= count) {
        return key;
      }
      target -= count;
    }
    return Solver.chooseRandom(keys);
  }

  private getNextValuesForKey(domains: ModelDomains, key: string): any[] {
    let currentIndex = domains[key].index;
    let currentValues = domains[key].values;
    let start = Math.max(
      0, currentIndex - Math.floor(this.config.lookAheadModels / 2)
    );
    let end = Math.min(
      currentValues.length, currentIndex + Math.floor(this.config.lookAheadModels / 2)
    );
    return currentValues.slice(start, end);
  }

  private static modelsEqual(model0: any, model1: any): boolean {
    for (let key of Object.keys(model0)) {
      if (typeof model0[key] == 'object') {
        if (!Solver.modelsEqual(model0[key], model1[key])) {
          return false;
        }
      } else if (model0[key] !== model1[key]) {
        return false;
      }
    }
    return true;
  }

  private isModelInSolutions(solutions: M[], model: M): boolean {
    for (let solution of solutions) {
      if (Solver.modelsEqual(solution, model)) {
        return true;
      }
    }
    return false;
  }

  private getNextModels(solutions: M[], domains: ModelDomains, key: string, nextValues: any[]): { preference: number, model: M }[] {
    let res: { preference: number, model: M }[] = [];
    for (let nextValue of nextValues) {
      let model = this.getCurrentModel(domains);
      Solver.insertValue(model, key, nextValue);
      if (!this.isModelInSolutions(solutions, model)) {
        res.push({
          preference: domains[key].preference(nextValue),
          model: model
        });
      }
    }
    return res;
  }

  private getNextBestModel(solutions: M[], domains: ModelDomains, currentModel: M, state: S): M | null {
    let statisticsReport = this.system.evaluateStatistics(currentModel, state);
    let keyInfluences = statisticsReport.inconsistent.model;
    let nextKey = this.chooseKey(keyInfluences);
    let nextValuesForKey = this.getNextValuesForKey(domains, nextKey);
    let nextModels = this.getNextModels(solutions, domains, nextKey, nextValuesForKey);
    let bestModel = this.minConflicts(nextModels, state);
    if (!bestModel) {
      return null;
    }
    domains[nextKey].index = nextModels.indexOf(bestModel);
    return bestModel.model;
  }

  /**
   * Chooses a random element from array.
   *
   * @param values array
   * @private
   */
  private static chooseRandom<T>(values: T[]): T {
    return values[Math.floor(Math.random() * values.length)];
  }

  private minConflicts(models: { preference: number, model: M }[], state: S): { preference: number, model: M } | null {

    // To avoid local maximums and plateaus, choose completely random sometimes
    if (Math.random() < this.config.randomnessFactor) {
      return Solver.chooseRandom(models);
    }

    let bestModel: { preference: number, model: M } | null = null;
    let bestScore: number = 0;
    for (let instance of models) {
      let score = this.getLogScore(instance.model, state);
      score += (instance.preference / Domain.maxPreference) * this.config.preferenceFactor;
      if (score > bestScore) {
        bestScore = score;
        bestModel = instance;
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

  find(maxSolutions: number, modelDomain: ModelDomain, state: S, config?: SolverConfig): M[] {
    if (!!config) {
      this.initConfig(config);
    }
    let domains = Solver.getModelDomains(modelDomain);
    if (this.config.lookAheadModels < 0) {
      this.config.lookAheadModels = Solver.getMaxLookAhead(domains);
    }
    let max = Math.max(1, maxSolutions);
    console.log("consys-solver: Starting search with config: ", this.config);
    let res: M[] = [];
    let currentModel: M | null = this.getCurrentModel(domains);
    let iterations = 0;
    for (let i = 0; i < this.config.maxIterations && res.length < max; i++) {
      if (!!currentModel) {
        if (this.isModelConsistent(currentModel, state)) {
          res.push(currentModel);
        }
        currentModel = this.getNextBestModel(res, domains, currentModel, state);
      }
      iterations++;
    }
    console.log(
      "consys-solver: Found ", res.length,
      " solution(s) after ", iterations, " iterations"
    );
    return res;
  }
}
