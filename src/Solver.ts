import {ConstraintSystem} from 'consys';
import Domain from './Domain';
import RandomUtils from './ignoreCoverage/RandomUtils';

/**
 * Map of model keys to their domains, with keys flattened.
 */
type FlatModelDomain = {[key: string]: Domain<any>};

/**
 * Map of model keys to domain data.
 */
type ModelDomains = {
  [key: string]: {
    index: number;
    values: any[];
    preference: (element: any) => number;
  };
};

/**
 * Model domain object. Should have the same keys as the result model, which
 * each key having a specific domain to be searched for a solution.
 */
export interface ModelDomain {
  [key: string]: Domain<any> | ModelDomain;
}

/**
 * Solver configuration.
 *
 * @param maxIterations Maximum number of iterations until the algorithm stops.
 * The default number is 10000 iterations.
 *
 * @param retryIterations The number of iterations until the algorithm starts
 * again with random values. Useful to get the algorithm out of dead ends.
 *
 * @param lookAheadModels Determines how many models should be considered for
 * the next iteration. Set to the maximum domain size by default.
 *
 * @param randomnessFactor Value between 0.0 and 1.0, determines how often the
 * algorithm chooses a random model for the next iteration. A value of 0.0
 * means that it never chooses randomly, and a value of 1.0 means it always
 * chooses randomly. This is useful to avoid local extrema and plateaus.
 * The default value is 0.3.
 *
 * @param preferenceFactor Value between 0.0 and 1.0, determines how much the
 * domain preference value is weighted when choosing the model for the next
 * iteration. A value of 0.0 means that preferences are not considered, whereas
 * a value of 1.0 means that they heavily influence the decision. The default
 * value is 0.1.
 *
 */
export interface SolverConfig {
  maxIterations?: number;
  retryIterations?: number;
  lookAheadModels?: number;
  randomnessFactor?: number;
  preferenceFactor?: number;
}

/**
 * Solver class, used to find solutions for a specific set of constraints and
 * domains.
 */
export default class Solver<M, S> {
  // initial constraint system
  private readonly system: ConstraintSystem<M, S>;

  // default configuration
  private readonly config = {
    maxIterations: 10000,
    retryIterations: 2000,
    lookAheadModels: -1,
    randomnessFactor: 0.3,
    preferenceFactor: 0.1
  };

  /**
   * Create a new solver instance for a given constraint system and config.
   *
   * @param system constraint system
   * @param config configuration
   */
  constructor(system: ConstraintSystem<M, S>, config?: SolverConfig) {
    this.system = system;
    if (!!config) {
      this.initConfig(config);
    }
  }

  /**
   * Initializes parameters based on the given config.
   *
   * @param config configuration
   * @private
   */
  private initConfig(config: SolverConfig) {
    if (config.maxIterations !== undefined) {
      this.config.maxIterations = Math.max(0, config.maxIterations);
    }
    if (config.retryIterations !== undefined) {
      this.config.retryIterations = Math.max(0, config.retryIterations);
    }
    if (config.lookAheadModels !== undefined) {
      this.config.lookAheadModels = Math.max(0, config.lookAheadModels);
    } else {
      this.config.lookAheadModels = -1;
    }
    if (config.randomnessFactor !== undefined) {
      this.config.randomnessFactor = Math.max(
        0,
        Math.min(config.randomnessFactor, 1)
      );
    }
    if (config.preferenceFactor !== undefined) {
      this.config.preferenceFactor = Math.max(
        0,
        Math.min(config.preferenceFactor, 1)
      );
    }
  }

  /**
   * Flatten a model domain object to have keys as strings, seperated by a dot
   * if the key is nested.
   *
   * @param modelDomain initial domain object
   * @param parent parent key
   * @param res result map
   * @private
   */
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

  /**
   * Creates a model domains object with domain values and current search index.
   *
   * @param modelDomain model domain
   * @private
   */
  private static getModelDomains(modelDomain: ModelDomain): ModelDomains {
    let flattened = Solver.flattenModelDomain(modelDomain);
    let res: ModelDomains = {};
    Object.keys(flattened).forEach(key => {
      res[key] = {
        index: 0,
        values: flattened[key].getValues(),
        preference: (element: any) => {
          return flattened[key].getPreferenceValue(element);
        },
      };
    });
    return res;
  }

  /**
   * Inserts a value into an object. Key is a dot separated string, which will
   * result in a nested value.
   *
   * @param object object where value should be inserted
   * @param key key of the value
   * @param value value to be inserted
   * @private
   */
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

  /**
   * Randomizes the current search index of each domain.
   *
   * @param modelDomains model domains
   * @private
   */
  private static randomizeModel(modelDomains: ModelDomains) {
    for (let key of Object.keys(modelDomains)) {
      let domain = modelDomains[key];
      domain.index = Math.floor(
        RandomUtils.unsignedFloat() * domain.values.length
      );
    }
  }

  /**
   * Creates a new model object from the values of the current search indices.
   *
   * @param modelDomains model domains
   * @private
   */
  private getCurrentModel(modelDomains: ModelDomains): M {
    let res = {};
    for (let key of Object.keys(modelDomains)) {
      let domain = modelDomains[key];
      Solver.insertValue(res, key, domain.values[domain.index]);
    }
    return res as M;
  }

  /**
   * Calculates a logarithmic score between 0 (bad) and 1 (perfect) for a given
   * model and state.
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

  /**
   * Returns a normalized preference score from 0 to 1
   *
   * @param preference preference of the domain value
   * @private
   */
  private getPreferenceScore(preference: number): number {
    return (
      1 -
      this.config.preferenceFactor +
      (preference / Domain.maxPreference) * this.config.preferenceFactor
    );
  }

  /**
   * Calculates the harmonic mean of the log score and preference score. This
   * penalizes low values for the log score, as well as low values for the
   * preference score. Only if both values are high, the harmonic mean will be
   * high as well.
   *
   * @param logScore log score
   * @param prefScore preference score
   * @private
   */
  private static getHarmonicMean(logScore: number, prefScore: number): number {
    return (2 * logScore * prefScore) / (logScore + prefScore);
  }

  /**
   * Calculates the total score of a given model and state.
   *
   * @param instance model with preference value
   * @param state state
   * @private
   */
  private getScore(instance: {preference: number; model: M}, state: S): number {
    let logScore = this.getLogScore(instance.model, state);
    let prefScore = this.getPreferenceScore(instance.preference);
    return Solver.getHarmonicMean(logScore, prefScore);
  }

  /**
   * Checks if a model is consistent with a given state.
   *
   * @param model model to be checked
   * @param state state to be checked
   * @private
   */
  private isModelFeasible(model: M, state: S): boolean {
    return this.system.getNumInconsistentConstraints(model, state) === 0;
  }

  /**
   * Shuffles an array of values.
   *
   * @param array array to be shuffled
   * @private
   */
  private static shuffle<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(RandomUtils.unsignedFloat() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Randomly chooses a key based on their counts as weights.
   *
   * @param domains key domains
   * @param keyCounts key counts
   * @private
   */
  private static chooseKey(
    domains: ModelDomains,
    keyCounts: {[key: string]: number}
  ): string {
    // apply laplace smoothing, since counts can be 0
    const laplaceAlpha = 0.1;

    let keys = Object.keys(domains);
    Solver.shuffle(keys);

    let totalCount = laplaceAlpha * keys.length;
    for (let key of keys) {
      totalCount += !!keyCounts[key] ? keyCounts[key] : 0;
    }

    // random value between 1 and total amount of keys
    let target = RandomUtils.unsignedFloat() * (totalCount - 1) + 1;

    for (let key of keys) {
      let count = keyCounts[key] + laplaceAlpha;
      if (target <= count) {
        return key;
      }
      target -= count;
    }

    // in theory, this can not happen
    return Solver.chooseRandom(keys);
  }

  /**
   * Returns an array of values to be considered as the next value for a model
   * domain.
   *
   * @param domains model domains
   * @param key key to be searched for values
   * @private
   */
  private getNextValuesForKey(domains: ModelDomains, key: string): any[] {
    let currentIndex = domains[key].index;
    let currentValues = domains[key].values;
    let start = Math.max(
      0,
      currentIndex - Math.floor(this.config.lookAheadModels / 2)
    );
    let end = Math.min(
      currentValues.length,
      currentIndex + Math.floor(this.config.lookAheadModels / 2)
    );
    return currentValues.slice(start, end);
  }

  /**
   * Checks if two models have equal keys and values.
   *
   * @param model0 first model
   * @param model1 second model
   * @private
   */
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

  /**
   * Checks if a model is already in an array of solutions.
   *
   * @param solutions solutions
   * @param model model
   * @private
   */
  private isModelInSolutions(solutions: M[], model: M): boolean {
    for (let solution of solutions) {
      if (Solver.modelsEqual(solution, model)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns an array of models to be considered as the next best model, along
   * with their preference value.
   *
   * @param solutions current solutions
   * @param domains model domains
   * @param key key to be changed for the next models
   * @param nextValues array of possible next values for the key
   * @private
   */
  private getNextModels(
    solutions: M[],
    domains: ModelDomains,
    key: string,
    nextValues: any[]
  ): {preference: number; model: M}[] {
    let res: {preference: number; model: M}[] = [];
    for (let nextValue of nextValues) {
      let model = this.getCurrentModel(domains);
      Solver.insertValue(model, key, nextValue);
      if (!this.isModelInSolutions(solutions, model)) {
        let preference = domains[key].preference(nextValue);
        res.push({
          preference: preference,
          model: model,
        });
      }
    }
    return res;
  }

  /**
   * Returns the next best model given a current model, state and solutions.
   *
   * @param solutions current solutions
   * @param domains model domains
   * @param currentModel current model
   * @param state state
   * @private
   */
  private getNextBestModel(
    solutions: M[],
    domains: ModelDomains,
    currentModel: M,
    state: S
  ): M | null {
    // for each variable value the amount of inconsistent constraints it is in
    let statisticsReport = this.system.evaluateStatistics(currentModel, state);
    let keyInfluences = statisticsReport.inconsistent.model;
    // choose next variable to generate values for
    let nextKey = Solver.chooseKey(domains, keyInfluences);
    // generate the next values for the variable
    let nextValuesForKey = this.getNextValuesForKey(domains, nextKey);
    // from the next values, generate new models
    let nextModels = this.getNextModels(
      solutions,
      domains,
      nextKey,
      nextValuesForKey
    );
    // from the new models, get the one with the minimum conflicts
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
    return values[Math.floor(RandomUtils.unsignedFloat() * values.length)];
  }

  /**
   * Returns the model with the minimum amount of conflicts (heuristic) and
   * factors in the preference value.
   *
   * @param models models to be considered
   * @param state state
   * @private
   */
  private minConflicts(
    models: {preference: number; model: M}[],
    state: S
  ): {preference: number; model: M} | null {
    // To avoid local maximums and plateaus, choose completely random sometimes
    if (RandomUtils.unsignedFloat() < this.config.randomnessFactor) {
      return Solver.chooseRandom(models);
    }

    let bestModel: {preference: number; model: M} | null = null;
    let bestScore: number = 0;

    // choose the model with the best score
    for (let instance of models) {
      // calculate score based on number of conflicts
      let score = this.getScore(instance, state);
      if (score > bestScore) {
        bestScore = score;
        bestModel = instance;
      }
    }
    return bestModel;
  }

  /**
   * Returns the maximum look ahead value based on the size of the largest
   * domain.
   *
   * @param domains model domains
   * @private
   */
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

  private static initializePreferredDomains(domains: ModelDomains) {
    for (let key of Object.keys(domains)) {
      let domain = domains[key];
      let bestIndex = 0;
      let bestPreference = Number.MIN_VALUE;
      for (let i = 0; i < domain.values.length; i++) {
        const value = domain.values[i];
        const preference = domain.preference(value);
        if (preference > bestPreference) {
          bestPreference = preference;
          bestIndex = i;
        }
      }
      domain.index = bestIndex;
    }
  }

  /**
   * Searches for solutions with a given configuration. Returns an array of
   * solutions as well as the number of iterations it took to find them.
   *
   * @param maxSolutions maximum number of solutions to be found before stopping
   * @param modelDomain model domain to be searched
   * @param state state
   * @param config solver configuration
   */
  solve(
    maxSolutions: number,
    modelDomain: ModelDomain,
    state: S,
    config?: SolverConfig
  ): {iterations: number; solutions: M[]} {
    if (!!config) {
      this.initConfig(config);
    }
    let domains = Solver.getModelDomains(modelDomain);

    // nothing configured, so use the largest domain size as default
    if (this.config.lookAheadModels < 0) {
      this.config.lookAheadModels = Solver.getMaxLookAhead(domains);
    }

    let max = Math.max(1, maxSolutions);
    let res: M[] = [];

    // start with the preferred model
    Solver.initializePreferredDomains(domains);
    let currentModel: M | null = this.getCurrentModel(domains);
    let iterations = 1;
    for (let i = 0; i < this.config.maxIterations && res.length < max; i++) {
      if (iterations % this.config.retryIterations === 0) {
        Solver.randomizeModel(domains);
      }
      if (!!currentModel) {
        if (this.isModelFeasible(currentModel, state)) {
          res.push(currentModel);

          // when we found a solution, start again with preferred values
          Solver.initializePreferredDomains(domains);
          currentModel = this.getCurrentModel(domains);
        } else {
          currentModel = this.getNextBestModel(res, domains, currentModel, state);
        }
      }
      iterations++;
    }
    return {
      iterations: iterations,
      solutions: res,
    };
  }

  /**
   * Searches for solutions with a given configuration. Returns an array of
   * solutions.
   *
   * @param maxSolutions maximum number of solutions to be found before stopping
   * @param modelDomain model domain to be searched
   * @param state state
   * @param config solver configuration
   */
  find(
    maxSolutions: number,
    modelDomain: ModelDomain,
    state: S,
    config?: SolverConfig
  ): M[] {
    return this.solve(maxSolutions, modelDomain, state, config).solutions;
  }
}
