import { v4 as uuid } from 'uuid';
import Enumerable from 'linq';
import { OPERATOR_TYPE } from 'features/shared/constants';
import { ITestAssertion, ISimpleTestScenario } from 'types/models';
import TestScenarioHelper from './TestScenarioHelper';

export default class FlattenScenarioProcess {
  testScenario: ISimpleTestScenario;

  resultList: ISimpleTestScenario[] = [];

  showReducedScenariosAndCases: boolean = false;

  flattenedFragmentsObj: any = {};

  scenarioDictionary: Map<string, ISimpleTestScenario> = new Map();

  baseScenarios: ISimpleTestScenario[];

  constructor(
    testScenario: ISimpleTestScenario,
    scenarioDictionary: Map<string, ISimpleTestScenario>,
    showReducedScenariosAndCases: boolean = false
  ) {
    this.testScenario = testScenario;
    this.scenarioDictionary = scenarioDictionary;
    this.baseScenarios = Array.from(scenarioDictionary.values());
    this.showReducedScenariosAndCases = showReducedScenariosAndCases;
  }

  run() {
    // defitions: _mergeScenarioFragments
    // assertions: C1:True, G1:True => can simplify by C1:True ~ C1 ; C1:False ~ !C1
    // fragment ~ assertion
    // scenario: OR(C1:True, G1:True) = E1
    // flat scenario fragments means remove Group fragment in sthe scenario
    // flat method:
    //     Method 1: (A && B) => flat to 1 scenario: (A && B)
    //     Method 2: (A OR B) => flat to 2 sceanrios: (A OR !B); (!A OR B)
    //                 in this case, the scenario (A:True OR B:True) is Ommitted
    //                 because only need A:True or B:True is enough
    // De Morgan Law: to use to flat Group with False value
    //     statement 1: !(A AND B) equals !A OR !B
    //     statement 2: !(A OR B) equals !A AND !B
    // Sample: OR(C1:True, G1:False) = E1 ; G1 = OR(C2, C3)
    //     - flat 1: E1 = OR(C1, !G1) | !G1 = AND(!C2, !C3) use DeMorganLaw statement 2
    //     - flat 2: Use Flat method 2 to flat E1 to 2 scenarios
    //         + E1 = OR(C1, G1) => becomes 2 scenarios after flat G1 using flat method 2
    //             - TS1: E1 = OR(!C1, C2, !C3)
    //             - TS2: E1 = OR(!C1, !C2, C3)
    //         + E1 = OR(!C1, !G1) => become 1 scenario after flat !G1
    //             - TS3: E1 = OR(!C1, !C2, !C3)

    this.flatFragment(this.testScenario);

    return this.resultList;
  }

  flatFragment(scenario: ISimpleTestScenario) {
    if (scenario.targetType === OPERATOR_TYPE.AND) {
      this.flatAndFragment(scenario);
    } else {
      this.flatOrFragment(scenario);
    }
  }

  flatAndFragment(scenario: ISimpleTestScenario) {
    this.resultList.push(scenario);

    scenario.testAssertions.forEach((assertion) => {
      const groupScenario = this.findGroupScenario(assertion);

      if (groupScenario) {
        // flat group and add to result.
        const runScenario = !assertion.result ? this.applyDeMorganLaw(groupScenario) : { ...groupScenario };
        runScenario.id = uuid();
        const p = new FlattenScenarioProcess(runScenario, this.scenarioDictionary, this.showReducedScenariosAndCases);
        const flattenScenariosOfGroup = p.run();

        // diferenc with CS code: in CS code use foreach all scenario in resultList and merge assertion of this group
        flattenScenariosOfGroup.forEach((flattenScenario) => {
          const mergedResult = TestScenarioHelper.mergeTestAssertions(scenario, flattenScenario, true);
          if (mergedResult.isMergeSuccessfully) {
            this.resultList.push(mergedResult.testScenario);
          }
        });

        // remove the original scenario after flatten
        this.removeScenarioFromResult(scenario);
      }
    });
  }

  flatOrFragment(scenario: ISimpleTestScenario) {
    const combinations = TestScenarioHelper.combination(scenario.testAssertions.map((x) => x.nodeId));

    const groups = Enumerable.from(combinations).groupBy((x) => x.length);

    const lastGroupKey = groups.last().key();
    const hasMultipleFragments = groups.count() > 1;
    const shouldOmmitLastGroup = hasMultipleFragments && !this.showReducedScenariosAndCases;

    groups.forEach((group) => {
      const groupKey = group.key();
      const ignore = lastGroupKey === groupKey && shouldOmmitLastGroup;
      if (!ignore) {
        group.forEach((exceptIds: any[]) => {
          const scenario2 = TestScenarioHelper.invertedCloneSimple(scenario, exceptIds);
          scenario2.targetType = OPERATOR_TYPE.AND;
          scenario2.sourceTargetType = scenario.targetType;

          const p = new FlattenScenarioProcess(scenario2, this.scenarioDictionary, this.showReducedScenariosAndCases);
          const flattenScenariosOfGroup = p.run();

          flattenScenariosOfGroup.forEach((flattenScenario) => {
            this.resultList.push(flattenScenario);
          });
        });
      }
    });
  }

  removeScenarioFromResult(scenario: ISimpleTestScenario) {
    const idx = this.resultList.indexOf(scenario);
    if (idx >= 0) {
      this.resultList.splice(idx, 1);
    }
  }

  applyDeMorganLaw(scenario: ISimpleTestScenario): ISimpleTestScenario {
    const assertions = scenario.testAssertions.map((x) => {
      return { ...x, result: !x.result };
    });
    return { ...scenario, testAssertions: assertions };
  }

  findGroupScenario(fragment: ITestAssertion) {
    return this.baseScenarios.find((x) => x.targetNodeId === fragment.nodeId);
  }
}
