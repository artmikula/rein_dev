/* eslint-disable no-bitwise */
/* eslint-disable max-lines */
import {
  GRAPH_NODE_TYPE,
  NODE_INSPECTION,
  OPERATOR_TYPE,
  RESULT_TYPE,
  TEST_SCENARIO_TYPE,
} from 'features/shared/constants';
import Enumerable from 'linq';
import { v4 as uuid } from 'uuid';
import TestScenarioHelper from '../TestScenarioHelper';
import MyersTechnique from './MyersTechnique';

class DNFLogicCoverage {
  constructor() {
    this.graphLinks = [];
    this.graphNodes = [];
    this.causeNodes = [];
    this.effectNodes = [];
    this.groupNodes = [];
    this.constraints = [];
  }

  _initValue(graphLinks = [], constraints = [], graphNodes = []) {
    this.graphLinks = graphLinks;
    this.graphNodes = [...graphNodes];
    this.causeNodes = [...graphNodes.filter((x) => x.type === GRAPH_NODE_TYPE.CAUSE)];
    this.effectNodes = [...graphNodes.filter((x) => x.type === GRAPH_NODE_TYPE.EFFECT)];
    this.groupNodes = [...graphNodes.filter((x) => x.type === GRAPH_NODE_TYPE.GROUP)];
    this.constraints = constraints;
  }

  buildTestScenario(graphLinks = [], constraints = [], graphNodes = []) {
    this._initValue(graphLinks, constraints, graphNodes);
    const assertionDictionary = TestScenarioHelper.buildAssertionDictionary(this.graphLinks);
    return this._updateMumcutTestScenario(assertionDictionary);
  }

  _updateMumcutTestScenario(assertionDictionary = new Map()) {
    let testScenarios = [];

    const boolExpressions = [];
    const utpScenarios = [];
    const cutpnfpScenarios = [];
    const nfpScenarios = [];

    this.graphNodes = [
      ...MyersTechnique.buildTestScenario(this.graphLinks, this.constraints, this.graphNodes).graphNodes,
    ];

    const effectAssertionDictionary = new Map(
      [...assertionDictionary].filter(([key]) => this.effectNodes.some((y) => y.id === key))
    );

    effectAssertionDictionary.forEach((value) => {
      const simplified = this.simplify(value, assertionDictionary);
      boolExpressions.push(simplified);
    });

    for (let i = 0; i < boolExpressions.length; i++) {
      const mutps = this._getMUTPs(boolExpressions[i]);
      utpScenarios.push(...mutps);

      const cutpnfps = this._getCUTPNFPs(boolExpressions[i]);

      cutpnfpScenarios.push(...cutpnfps.filter((x) => x.isFeasible));

      const mnfps = this._getMNFPs(boolExpressions[i]);
      nfpScenarios.push(...mnfps);
    }

    const scenarios = [...utpScenarios, ...cutpnfpScenarios, ...nfpScenarios];

    const effectToEffectRelations = [...this.graphLinks.filter((x) => x.source && x.target)];
    if (effectToEffectRelations.length > 0 && scenarios.length > 0) {
      for (let j = 0; j < effectToEffectRelations.length; j++) {
        const { source, target } = effectToEffectRelations[j];
        const sourceScenarios = scenarios.filter(
          (x) =>
            x.testResults &&
            x.testResults.some(
              (y) => (y.graphNodeId === source.id && y.type === RESULT_TYPE.True) || y.type === RESULT_TYPE.None
            )
        );
        for (let k = 0; k < sourceScenarios.length; k++) {
          const { testResults } = sourceScenarios[k];
          if (testResults.some((x) => x.type === RESULT_TYPE.False && x.graphNodeId === source.id)) {
            if (!effectToEffectRelations[j].isNotRelation) {
              if (!testResults.some((x) => x.graphNodeId === target.id && x.type === RESULT_TYPE.False)) {
                testResults.push({ graphNodeId: target.id, type: RESULT_TYPE.False });
              }
              if (source.effectGroup === target.effectGroup) {
                target.inspection |= NODE_INSPECTION.HasRelationInSameGroup;
                const node = this.graphNodes.find((x) => target.id === x.id);
                node.inspection = target.inspection;
              }
            } else if (!testResults.some((x) => x.graphNodeId === target.id && x.type === RESULT_TYPE.True)) {
              testResults.push({ graphNodeId: target.id, type: RESULT_TYPE.True });
            }
          } else if (!effectToEffectRelations[j].isNotRelation) {
            if (!testResults.some((x) => x.graphNodeId === target.id && x.type === RESULT_TYPE.True)) {
              testResults.push({ graphNodeId: target.id, type: RESULT_TYPE.True });
            }
            if (source.effectGroup === target.effectGroup) {
              target.inspection |= NODE_INSPECTION.HasRelationInSameGroup;
              const node = this.graphNodes.find((x) => target.id === x.id);
              node.inspection = target.inspection;
            }
          } else if (!testResults.some((x) => x.graphNodeId === target.id && x.type === RESULT_TYPE.False)) {
            testResults.push({ graphNodeId: target.id, type: RESULT_TYPE.False });
          }
        }
      }
    }

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      scenario.expectedResults = TestScenarioHelper.buildExpectedResultsOfTestScenario(
        scenario.testResults,
        this.graphNodes
      );
      scenario.id = uuid();

      if (scenarios[i].isValid === undefined) {
        scenarios[i].isValid = true;
      }

      if (scenarios[i].isFeasible === undefined) {
        scenarios[i].isFeasible = true;
      }
    }

    testScenarios = [...scenarios];

    return { scenarios: testScenarios, graphNodes: this.graphNodes };
  }

  // this is TestScenario.Simplify
  simplifyTestScenario(testScenario, assertionDictionary = new Map(), applyAbsorptionLaw = true) {
    const result = TestScenarioHelper.clone(testScenario);
    return result;
  }

  // this is TestScenario.SimplifyExt in C# code
  simplify(testScenario, assertionDictionary = new Map(), applyAbsorptionLaw = true) {
    let result = TestScenarioHelper.clone(testScenario);

    const getFirstGroupInTestAssertions = (assertions) => {
      return assertions.find((x) => x.graphNode && x.graphNode.type === GRAPH_NODE_TYPE.GROUP);
    };

    let group = getFirstGroupInTestAssertions(result.testAssertions);

    while (group) {
      // for (let group = groups[0]; groups.length > 0; [group] = groups) {
      const groupGraphNodeId = group.graphNode.id;
      let testScenario1 = assertionDictionary.get(group.graphNode.id);
      if (testScenario1) {
        const testAssertion = result.testAssertions.find((x) => x.graphNode && x.graphNode.id === groupGraphNodeId);
        if (testAssertion) {
          const groupT = result.testAssertions.find((x) => x.graphNode && x.graphNode.id === groupGraphNodeId);
          const groupResult = groupT ? groupT.result : false;
          testScenario1 = groupResult ? testScenario1 : TestScenarioHelper.applyDeMorgansLaw(testScenario1);
          testScenario1 = this.simplifyTestScenario(testScenario1, assertionDictionary, false);

          if (testScenario1.targetType === OPERATOR_TYPE.OR && result.targetType === OPERATOR_TYPE.AND) {
            const r = {
              id: uuid(),
              targetType: testScenario1.targetType,
              trueResults: result.trueResults,
              falseResults: result.falseResults,
              testAssertions: [],
            };
            const testScenario1Assertions = testScenario1.testAssertions;
            for (let j = 0; j < testScenario1Assertions.length; j++) {
              const child = {
                id: uuid(),
                targetType: result.targetType,
                testResults: [],
                testAssertions: [],
              };

              child.testResults.push({ type: RESULT_TYPE.True, graphNodeId: groupGraphNodeId });
              const assertions = result.testAssertions.filter(
                (x) => x.graphNode && x.graphNode.id !== groupGraphNodeId
              );
              child.testAssertions.push(...assertions);

              const assertion = child.testAssertions.find(
                (x) => x.graphNode && x.graphNode.id === testScenario1Assertions[j].graphNode.id
              );

              if (!assertion) {
                child.testAssertions.push({
                  graphNode: testScenario1Assertions[j].graphNode,
                  result: testScenario1Assertions[j].result,
                });
              }

              const simplifiedChild = this.simplifyTestScenario(child, assertionDictionary, false);

              r.testAssertions.push({ testScenario: simplifiedChild, result: true });

              result = this.simplifyTestScenario(r, assertionDictionary, false);
            }
          } else if (testScenario1.targetType === OPERATOR_TYPE.AND && result.targetType === OPERATOR_TYPE.OR) {
            result.testAssertions.push({ testScenario: testScenario1, result: true });
          } else {
            const testScenario1Assertions = testScenario1.testAssertions;
            for (let j = 0; j < testScenario1Assertions.length; j++) {
              const assertion = result.testAssertions.find(
                (x) => x.graphNode && x.graphNode.id === testScenario1Assertions[j].graphNode?.id
              );
              if (assertion) {
                assertion.result = testScenario1Assertions[j].result;
              } else {
                result.testAssertions.push({
                  graphNode: testScenario1Assertions[j].graphNode,
                  result: testScenario1Assertions[j].result,
                });
              }
            }
          }
        }
      }

      const grounpIndexInResult = result.testAssertions.findIndex(
        (x) => x.graphNode && x.graphNode.id === groupGraphNodeId
      );
      result.testAssertions.splice(grounpIndexInResult, 1);
      group = getFirstGroupInTestAssertions(result.testAssertions);
    }

    if (result.testAssertions.length === 1) {
      const child = result.testAssertions[0].testScenario;
      if (child) {
        child.testResults = result.testResults ? [...result.testResults] : [];
        result = this.simplifyTestScenario(child, assertionDictionary, false);
      }
    } else {
      const testScenarios = result.testAssertions
        .filter((x) => x.testScenario && x.testScenario.targetType === result.targetType)
        .map((x) => x.testScenario);
      for (let expression = testScenarios[0]; testScenarios.length > 0; [expression] = testScenarios) {
        const assertions = expression.testAssertions;
        for (let j = 0; j < assertions.length; j++) {
          const assertion = result.testAssertions.find(
            (x) =>
              (x.testScenario && assertions[j].testScenario && x.testScenario.id === assertions[j].testScenario.id) ||
              (x.graphNode && assertions[j].graphNode && assertions[j].graphNode.id === x.graphNode.id)
          );
          if (assertion) {
            assertion.result = assertions[j].result;
          } else {
            result.testAssertions.push(assertions[j]);
          }
        }

        const index = testScenarios.findIndex(
          (x) => x.testScenario && x.testScenario.id === expression.testScenario.id
        );
        testScenarios.splice(index, 1);
      }
    }

    if (applyAbsorptionLaw) {
      const assertionScenarios = result.testAssertions.filter((x) => x.testScenario).map((x) => x.testScenario);
      for (let i = 0; i < assertionScenarios.length - 1; i++) {
        const front = assertionScenarios[i];
        let removedFrontItem = false;
        for (let j = i + 1; j < assertionScenarios.length; j++) {
          const rear = assertionScenarios[j];

          const assertions = front.testAssertions.filter(
            (x) => x.testScenario && rear.testAssertions.some((y) => x.testScenario.id === y.testScenario.id)
          );
          const assertionsCount = assertions.length;
          const isAll = Enumerable.from(assertions).all((x) => {
            const frontAssertion = front.testAssertions.find(
              (y) =>
                (x.testScenario && y.testScenario && y.testScenario.id === x.testScenario.id) ||
                (x.graphNode && y.graphNode && y.graphNode.id === x.graphNode.id)
            );
            const rearAssertion = rear.testAssertions.find(
              (y) =>
                (x.testScenario && y.testScenario && y.testScenario.id === x.testScenario.id) ||
                (x.graphNode && y.graphNode && y.graphNode.id === x.graphNode.id)
            );

            return (
              (frontAssertion.testScenario &&
                rearAssertion.testScenario &&
                frontAssertion.testScenario.id === rearAssertion.testScenario.id) ||
              (frontAssertion.graphNode &&
                rearAssertion.graphNode &&
                frontAssertion.graphNode.id === rearAssertion.graphNode.id)
            );
          });
          if ((assertionsCount === front.length || assertionsCount === rear.length) && isAll) {
            if (front.testAssertions.length > rear.testAssertions.length) {
              const frontIndex = result.testAssertions.findIndex(
                (x) => x.testScenario && x.testScenario.id === front.testScenario.id
              );

              const frontIndexInScenarios = assertionScenarios.findIndex(
                (x) => x.testScenario && x.testScenario.id === front.testScenario.id
              );

              result.testAssertions.splice(frontIndex, 1);
              assertionScenarios.splice(frontIndexInScenarios, 1);
              j--;
              removedFrontItem = true;
            } else {
              const rearIndex = result.testAssertions.findIndex(
                (x) => x.testScenario && x.testScenario.id === rear.testScenario.id
              );

              const rearIndexInScenarios = assertionScenarios.findIndex(
                (x) => x.testScenario && x.testScenario.id === rear.testScenario.id
              );
              result.testAssertions.splice(rearIndex, 1);
              assertionScenarios.splice(rearIndexInScenarios, 1);
              j--;
            }
          }
        }
        if (removedFrontItem) {
          i--;
        }
      }
    }
    return result;
  }

  _getMUTPs(testScenario, expectedValue = true) {
    let result = [];
    const graphNodeAssertions = testScenario.testAssertions.filter((x) => x.graphNode);
    if (
      testScenario.targetType === OPERATOR_TYPE.AND ||
      (testScenario.testAssertions.length <= 1 && testScenario.testAssertions.length === graphNodeAssertions.length)
    ) {
      if (expectedValue) {
        const scenario = TestScenarioHelper.clone(testScenario);
        scenario.scenarioType = TEST_SCENARIO_TYPE.MUTP;
        result.push(scenario);
      } else if (testScenario.testAssertions.length === 1) {
        const invertedScenario = TestScenarioHelper.invertedCloneWithExceptId(testScenario);
        invertedScenario.scenarioType = TEST_SCENARIO_TYPE.MUTP;
        result.push(invertedScenario);
      } else if (testScenario.testAssertions.length > 1) {
        const utpFirstHalf = TestScenarioHelper.invertedCloneWithExceptId(testScenario);
        const utpLastHalf = TestScenarioHelper.invertedCloneWithExceptId(testScenario);

        let i = 0;
        const halfIndex = parseInt(testScenario.testAssertions.length / 2, 10);
        const { testAssertions } = testScenario;
        for (let k = 0; k < testAssertions.length; k++) {
          if (i < halfIndex) {
            const utpFirstAssertion = utpFirstHalf.testAssertions.find(
              (x) =>
                (x.graphNode && x.graphNode.id === testAssertions[k].graphNode.id) ||
                (x.testScenario && x.testScenario.id === testAssertions[k].testScenario.id)
            );
            if (utpFirstAssertion) {
              utpFirstAssertion.result = testAssertions[k].result;
            } else {
              result.testAssertions.push({
                graphNode: testAssertions[k].graphNode,
                testScenario: testAssertions[k].testScenario,
                result: testAssertions[k].result,
              });
            }
          } else {
            const utpLastAssertion = utpLastHalf.testAssertions.find(
              (x) =>
                (x.graphNode && x.graphNode.id === testAssertions[k].graphNode.id) ||
                (x.testScenario && x.testScenario.id === testAssertions[k].testScenario.id)
            );
            if (utpLastAssertion) {
              utpLastAssertion.result = testAssertions[k].result;
            } else {
              result.testAssertions.push({
                graphNode: testAssertions[k].graphNode,
                testScenario: testAssertions[k].testScenario,
                result: testAssertions[k].result,
              });
            }
          }

          i++;
        }

        utpFirstHalf.scenarioType = TEST_SCENARIO_TYPE.MUTP;
        utpLastHalf.scenarioType = TEST_SCENARIO_TYPE.MUTP;
        result.push(utpFirstHalf);
        result.push(utpLastHalf);
      }
    } else {
      const { testAssertions } = testScenario;
      for (let i = 0; i < testAssertions.length; i++) {
        if (!testAssertions[i].testScenario) {
          const assertion = {
            id: uuid(),
            testResults: testScenario.testResults,
            testAssertions: [testAssertions[i]],
          };

          testScenario.testAssertions.push({
            testScenario: assertion,
            result: true,
          });
          testAssertions.splice(i, 1);
          i--;
        }
      }

      const trueAssertions = testAssertions.filter((x) => x.testScenario).map((x) => x.testScenario);
      for (let i = 0; i < trueAssertions.length; i++) {
        const utp = TestScenarioHelper.invertedCloneWithExceptId(testScenario, trueAssertions[i].id);
        const trueResults = [...this._getMUTPs(trueAssertions[i])];
        const utpAssertions = utp.testAssertions.filter(
          (x) => x.testScenario && x.testScenario.id !== trueAssertions[i].id
        );

        for (let j = 0; j < utpAssertions.length; j++) {
          const falseAssertion = TestScenarioHelper.clone(utpAssertions[j].testScenario);
          const assertionOfTrueAssertions = trueAssertions[i].testAssertions;
          for (let k = 0; k < assertionOfTrueAssertions.length; k++) {
            const index = falseAssertion.testAssertions.findIndex(
              (x) =>
                (x.graphNode && x.graphNode.id === assertionOfTrueAssertions[k].graphNode.id) ||
                (x.testScenario && x.testScenario.id === assertionOfTrueAssertions[k].testScenario.id)
            );
            if (
              falseAssertion.testAssertions[index] &&
              falseAssertion.testAssertions[index].result === assertionOfTrueAssertions[k].result
            ) {
              falseAssertion.testAssertions.splice(index, 1);
              falseAssertion.isFeasible = false;
            }
          }

          const falseAssertionUtps = this._getMUTPs(falseAssertion, utpAssertions[j].result);
          const falseAssertionUtpsCount = falseAssertionUtps.length;
          if (trueResults.length < falseAssertionUtpsCount) {
            for (let k = 0; k < falseAssertionUtpsCount - trueResults.length; k++) {
              trueResults.push(TestScenarioHelper.clone(trueResults[0]));
            }
          }

          if (falseAssertionUtps.length > 0) {
            let index = -1;
            for (let k = 0; k < trueResults.length; k++) {
              if (falseAssertionUtps[index + 1]) {
                index++;
                const nextAssertion = { ...falseAssertionUtps[index] };
                const assertions = trueResults[k].testAssertions.filter(
                  (x) =>
                    (x.testScenario &&
                      nextAssertion.testAssertions.some((y) => x.testScenario.id === y.testScenario.id)) ||
                    (x.graphNode && nextAssertion.testAssertions.some((y) => x.graphNode.id === y.graphNode.id))
                );

                const isAll = Enumerable.from(assertions).all((x) => {
                  const resultAssertion = trueResults[k].testAssertions.find(
                    (y) =>
                      (x.testScenario && y.testScenario && y.testScenario.id === x.testScenario.id) ||
                      (x.graphNode && y.graphNode && y.graphNode.id === x.graphNode.id)
                  );
                  const next = nextAssertion.testAssertions.find(
                    (y) =>
                      (x.testScenario && y.testScenario && y.testScenario.id === x.testScenario.id) ||
                      (x.graphNode && y.graphNode && y.graphNode.id === x.graphNode.id)
                  );

                  return (
                    (resultAssertion.testScenario &&
                      next.testScenario &&
                      resultAssertion.testScenario.id === next.testScenario.id) ||
                    (resultAssertion.graphNode && next.graphNode && resultAssertion.graphNode.id === next.graphNode.id)
                  );
                });

                if (isAll) {
                  trueResults[k] = TestScenarioHelper.mergeAssertion(trueResults[k], nextAssertion).testScenario;
                }

                trueResults[k].scenarioType = TEST_SCENARIO_TYPE.MUTP;
                trueResults[k].testResults = testScenario.testResults;
                trueResults[k].id = null;
              }
            }
          }
        }

        result = TestScenarioHelper.unionScenarios(result, trueResults);
      }
    }

    return result;
  }

  _getCUTPNFPs(testScenario, expectedValue = true, overrideType = true) {
    let results = [];
    const graphNodeAssertions = testScenario.testAssertions.filter((x) => x.graphNode);
    const { testAssertions } = testScenario;
    if (
      testScenario.targetType === OPERATOR_TYPE.AND ||
      (testScenario.testAssertions.length <= 1 && testAssertions.length === graphNodeAssertions.length)
    ) {
      if (expectedValue) {
        const utp = TestScenarioHelper.clone(testScenario);
        utp.scenarioType = TEST_SCENARIO_TYPE.UTP;
        results.push(utp);
        for (let i = 0; i < testAssertions.length; i++) {
          const nfp = TestScenarioHelper.clone(testScenario);
          nfp.scenarioType = TEST_SCENARIO_TYPE.NFP;
          const assertion = nfp.testAssertions.find(
            (x) =>
              (x.graphNode && testAssertions[i].graphNode && x.graphNode.id === testAssertions[i].graphNode.id) ||
              (x.testScenario &&
                testAssertions[i].testScenario &&
                x.testScenario.id === testAssertions[i].testScenario.id)
          );
          if (assertion) {
            assertion.result = !assertion.result;
          }
          results.push(nfp);
        }
      } else {
        results.push(TestScenarioHelper.invertedCloneWithExceptId(testScenario));
      }
    } else {
      for (let i = 0; i < testAssertions.length; i++) {
        if (!testAssertions[i].testScenario) {
          const assertion = {
            id: uuid(),
            testResults: testScenario.testResults,
            testAssertions: [...testAssertions[i]],
          };

          testScenario.testAssertions.push({
            testScenario: assertion,
            result: true,
          });
          testAssertions.splice(i, 1);
          i--;
        }
      }

      const trueAssertions = testAssertions.filter((x) => x.testScenario).map((x) => x.testScenario);
      for (let i = 0; i < trueAssertions.length; i++) {
        const cutpnfp = TestScenarioHelper.invertedCloneWithExceptId(testScenario, trueAssertions[i].id);
        const trueResults = [...this._getCUTPNFPs(trueAssertions[i], true, false)];
        const cutpnfpAssertions = cutpnfp.testAssertions.filter(
          (x) => x.testScenario && x.testScenario.id !== trueAssertions[i].id
        );

        for (let j = 0; j < trueResults.length; j++) {
          for (let h = 0; h < cutpnfpAssertions.length; h++) {
            const falseAssertionCutpnfps = this._getCUTPNFPs(
              cutpnfpAssertions[h].testScenario,
              cutpnfpAssertions[h].result,
              false
            );
            if (falseAssertionCutpnfps.length > 0) {
              const falseAssertionCutpnfp = falseAssertionCutpnfps[0];
              const assertions = trueAssertions[i].testAssertions;

              for (let k = 0; k < assertions.length; k++) {
                const index = falseAssertionCutpnfp.testAssertions.findIndex(
                  (x) =>
                    (x.graphNode && x.graphNode.id === assertions[k].graphNode.id) ||
                    (x.testScenario && x.testScenario.id === assertions[k].testScenario.id)
                );

                if (index >= 0) {
                  falseAssertionCutpnfp.testAssertions.splice(index, 1);
                }
              }
            }

            const assertions = trueResults[j].testAssertions.filter(
              (x) =>
                (x.testScenario &&
                  falseAssertionCutpnfps[0].testAssertions.some((y) => x.testScenario.id === y.testScenario.id)) ||
                (x.graphNode && falseAssertionCutpnfps[0].testAssertions.some((y) => x.graphNode.id === y.graphNode.id))
            );

            const isAll = Enumerable.from(assertions).all((x) => {
              const resultAssertion = trueResults[j].testAssertions.find(
                (y) =>
                  (x.testScenario && y.testScenario && y.testScenario.id === x.testScenario.id) ||
                  (x.graphNode && y.graphNode && y.graphNode.id === x.graphNode.id)
              );
              const falseAssertion = cutpnfpAssertions[h].testScenario.testAssertions.find(
                (y) =>
                  (x.testScenario && y.testScenario && y.testScenario.id === x.testScenario.id) ||
                  (x.graphNode && y.graphNode && y.graphNode.id === x.graphNode.id)
              );

              return (
                (resultAssertion.testScenario &&
                  falseAssertion.testScenario &&
                  resultAssertion.testScenario.id === falseAssertion.testScenario.id) ||
                (resultAssertion.graphNode &&
                  falseAssertion.graphNode &&
                  resultAssertion.graphNode.id === falseAssertion.graphNode.id)
              );
            });

            if (assertions.length === 0 || isAll) {
              trueResults[j] = TestScenarioHelper.mergeAssertion(
                trueResults[j],
                falseAssertionCutpnfps[0]
              ).testScenario;
              trueResults[j].isFeasible = TestScenarioHelper.validate(trueResults[j], testScenario, trueAssertions[i]);
              trueResults[j].testResults = testScenario.testResults;
              trueResults[j].id = null;
              if (!trueResults[j].isFeasible) {
                const clone = TestScenarioHelper.clone(trueResults[j]);
                results.push(clone);
                trueResults[j].testAssertions = testScenario.testAssertions;
                //
              }
            }
          }
        }

        results = TestScenarioHelper.unionScenarios(results, trueResults);
      }
    }

    if (overrideType) {
      for (let i = 0; i < results.length; i++) {
        results[i].scenarioType = TEST_SCENARIO_TYPE.CUTPNFP;
      }
    }

    return results;
  }

  _getMNFPs(testScenario, expectedValue = true) {
    let results = [];
    const graphNodeAssertions = testScenario.testAssertions.filter((x) => x.graphNode);
    if (
      testScenario.targetType === OPERATOR_TYPE.AND ||
      (testScenario.testAssertions.length <= 1 && testScenario.testAssertions.length === graphNodeAssertions.length)
    ) {
      if (expectedValue) {
        for (let i = 0; i < graphNodeAssertions.length; i++) {
          const scenario = TestScenarioHelper.clone(testScenario);
          scenario.scenarioType = TEST_SCENARIO_TYPE.MNFP;
          const assertion = scenario.testAssertions.find((x) => x.graphNode.id === graphNodeAssertions[i].graphNode.id);
          if (assertion) {
            assertion.result = !assertion.result;
          }
          results.push(scenario);
        }
      } else if (testScenario.testAssertions.length === 1) {
        const invertedScenario = TestScenarioHelper.invertedCloneWithExceptId(testScenario);
        invertedScenario.scenarioType = TEST_SCENARIO_TYPE.MNFP;
        results.push(invertedScenario);
      } else if (testScenario.testAssertions.length > 1) {
        const nfpFirstHalf = TestScenarioHelper.invertedCloneWithExceptId(testScenario);
        const nfpLastHalf = TestScenarioHelper.invertedCloneWithExceptId(testScenario);

        let i = 0;
        const halfIndex = parseInt(testScenario.testAssertions.length / 2, 10);
        const { testAssertions } = testScenario;

        for (let k = 0; k < testAssertions.length; k++) {
          if (i < halfIndex) {
            const nfpFirstAssertion = nfpFirstHalf.testAssertions.find(
              (x) =>
                (x.graphNode && x.graphNode.id === testAssertions[k].graphNode.id) ||
                (x.testScenario && x.testScenario.id === testAssertions[k].testScenario.id)
            );
            if (nfpFirstAssertion) {
              nfpFirstAssertion.result = testAssertions[k].result;
            }
          } else {
            const utpLastAssertion = nfpLastHalf.testAssertions.find(
              (x) =>
                (x.graphNode && x.graphNode.id === testAssertions[k].graphNode.id) ||
                (x.testScenario && x.testScenario.id === testAssertions[k].testScenario.id)
            );
            if (utpLastAssertion) {
              utpLastAssertion.result = testAssertions[k].result;
            }
          }

          i++;
        }

        nfpFirstHalf.scenarioType = TEST_SCENARIO_TYPE.MNFP;
        nfpLastHalf.scenarioType = TEST_SCENARIO_TYPE.MNFP;
        results.push(nfpFirstHalf);
        results.push(nfpLastHalf);
      }
    } else {
      const { testAssertions } = testScenario;
      for (let i = 0; i < testAssertions.length; i++) {
        if (!testAssertions[i].testScenario) {
          const assertion = {
            id: uuid(),
            testResults: testScenario.testResults,
            testAssertions: [testAssertions[i]],
          };

          testScenario.testAssertions.push({
            testScenario: assertion,
            result: true,
          });
          testAssertions.splice(i, 1);
          i--;
        }
      }

      const trueAssertions = testAssertions.filter((x) => x.testScenario).map((x) => x.testScenario);
      for (let i = 0; i < trueAssertions.length; i++) {
        const nfp = TestScenarioHelper.invertedCloneWithExceptId(testScenario, trueAssertions[i].id);
        const trueResults = [...this._getMNFPs(trueAssertions[i])];
        const nfpAssertions = nfp.testAssertions.filter(
          (x) => x.testScenario && x.testScenario.id !== trueAssertions[i].id
        );

        for (let j = 0; j < nfpAssertions.length; j++) {
          const falseAssertion = TestScenarioHelper.clone(nfpAssertions[j].testScenario);
          const assertionOfTrueAssertions = trueAssertions[i].testAssertions;
          for (let k = 0; k < assertionOfTrueAssertions.length; k++) {
            const index = falseAssertion.testAssertions.findIndex(
              (x) =>
                (!!x.graphNode && x.graphNode.id === assertionOfTrueAssertions[k].graphNode.id) ||
                (!!x.testScenario && x.testScenario.id === assertionOfTrueAssertions[k].testScenario.id)
            );
            if (
              falseAssertion.testAssertions[index] &&
              falseAssertion.testAssertions[index].result === assertionOfTrueAssertions[k].result
            ) {
              falseAssertion.testAssertions.splice(index, 1);
              falseAssertion.isFeasible = false;
            }
          }

          const falseAssertionNfps = this._getMNFPs(falseAssertion, nfpAssertions[j].result);
          const falseAssertionNfpsCount = falseAssertionNfps.length;
          if (trueResults.length < falseAssertionNfpsCount) {
            for (let k = 0; k < falseAssertionNfpsCount - trueResults.length; k++) {
              trueResults.push(TestScenarioHelper.clone(trueResults[0]));
            }
          }

          if (falseAssertionNfps.length > 0) {
            let index = 0;
            for (let k = 0; k < trueResults.length; k++) {
              const nextAssertion = { ...falseAssertionNfps[index] };
              const assertions = trueResults[k].testAssertions.filter(
                (x) =>
                  (x.testScenario &&
                    nextAssertion.testAssertions.some((y) => x.testScenario.id === y.testScenario.id)) ||
                  (x.graphNode && nextAssertion.testAssertions.some((y) => x.graphNode.id === y.graphNode.id))
              );

              const isAll = Enumerable.from(assertions).all((x) => {
                const resultAssertion = trueResults[k].testAssertions.find(
                  (y) =>
                    (x.testScenario && y.testScenario && y.testScenario.id === x.testScenario.id) ||
                    (x.graphNode && y.graphNode && y.graphNode.id === x.graphNode.id)
                );
                const next = nextAssertion.testAssertions.find(
                  (y) =>
                    (x.testScenario && y.testScenario && y.testScenario.id === x.testScenario.id) ||
                    (x.graphNode && y.graphNode && y.graphNode.id === x.graphNode.id)
                );

                return (
                  (resultAssertion.testScenario &&
                    next.testScenario &&
                    resultAssertion.testScenario.id === next.testScenario.id) ||
                  (resultAssertion.graphNode && next.graphNode && resultAssertion.graphNode.id === next.graphNode.id)
                );
              });

              if (isAll) {
                trueResults[k] = TestScenarioHelper.mergeAssertion(trueResults[k], nextAssertion).testScenario;
              }

              if (falseAssertionNfps[index + 1]) {
                index++;
              }

              trueResults[k].id = null;
              trueResults[k].scenarioType = TEST_SCENARIO_TYPE.MNFP;
              trueResults[k].testResults = testScenario.testResults;
            }
          }
        }

        results = TestScenarioHelper.unionScenarios(results, trueResults);
      }
    }

    return results;
  }
}

export default new DNFLogicCoverage();
