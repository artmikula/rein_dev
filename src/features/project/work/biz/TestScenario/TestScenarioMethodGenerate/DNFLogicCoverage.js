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
import cloneDeep from 'lodash.clonedeep';
import constraintHelper from '../../Constraint';
import TestScenarioGenerator from '../TestScenarioGenerator';
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
    const assertionDictionary = TestScenarioGenerator.calculateScenarioDictionary(this.graphLinks, this.effectNodes);
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
      [...assertionDictionary].filter(([key]) => this.effectNodes.some((effectNode) => effectNode.id === key))
    );

    effectAssertionDictionary.forEach((value) => {
      const simplified = this.SimplifyExt(value, assertionDictionary);
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
                let targetInspection = target.inspection;
                targetInspection |= NODE_INSPECTION.HasRelationInSameGroup;
                const node = this.graphNodes.find((x) => target.id === x.id);
                node.inspection = targetInspection;
              }
            } else if (!testResults.some((x) => x.graphNodeId === target.id && x.type === RESULT_TYPE.True)) {
              testResults.push({ graphNodeId: target.id, type: RESULT_TYPE.True });
            }
          } else if (!effectToEffectRelations[j].isNotRelation) {
            if (!testResults.some((x) => x.graphNodeId === target.id && x.type === RESULT_TYPE.True)) {
              testResults.push({ graphNodeId: target.id, type: RESULT_TYPE.True });
            }
            // temporary comment this because of
            // 'Cannot assign to read only property 'inspection' of object '#<Object>' error occurs
            // if (source.effectGroup === target.effectGroup) {
            //   let targetInspection = target.inspection;
            //   targetInspection |= NODE_INSPECTION.HasRelationInSameGroup;
            //   const node = this.graphNodes.find((x) => target.id === x.id);
            //   node.inspection = targetInspection;
            // }
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

    for (let i = 0; i < testScenarios.length; i++) {
      for (let j = 0; j < this.constraints.length; j++) {
        const validation = constraintHelper.validate(this.constraints[j], testScenarios[i]);

        if (validation !== NODE_INSPECTION.None) {
          testScenarios[i].isViolated = true;
          testScenarios[i].testAssertions.forEach((testAssertion) => {
            const graphNode = this.graphNodes.find((x) => x.id === testAssertion.graphNodeId);
            graphNode.inspection |= validation;
          });
        }
      }
    }

    testScenarios = testScenarios.filter((x) => x.expectedResults);

    return { scenarios: testScenarios, graphNodes: this.graphNodes };
  }

  // this is TestScenario.Simplify
  // eslint-disable-next-line no-unused-vars
  simplifyTestScenario(testScenario, _assertionDictionary = new Map(), _applyAbsorptionLaw = true) {
    const result = TestScenarioHelper.clone(testScenario);
    return result;
  }

  // this is TestScenario.SimplifyExt in C# code
  SimplifyExt(scenario, assertionDictionary = new Map(), applyAbsorptionLaw = true) {
    let resultScenario = TestScenarioHelper.clone(scenario);
    const resultAssertions = resultScenario.testAssertions;

    const getFirstGroupInTestAssertions = (assertions) => {
      const testAssertions = assertions.find((assertion) =>
        this.groupNodes.some((groupNode) => groupNode.id === assertion.graphNodeId)
      );
      return testAssertions;
    };

    let group = getFirstGroupInTestAssertions(resultAssertions);

    while (group) {
      const groupExpectedResult = group.result;
      // for (let group = groups[0]; groups.length > 0; [group] = groups) {
      const groupGraphNodeId = group.graphNodeId;
      let groupScenario = assertionDictionary.get(group.graphNodeId);
      if (groupScenario) {
        groupScenario = groupExpectedResult ? groupScenario : TestScenarioHelper.applyDeMorgansLaw(groupScenario);
        groupScenario = this.simplifyTestScenario(groupScenario, assertionDictionary, false);

        if (groupScenario.targetType === OPERATOR_TYPE.OR && resultScenario.targetType === OPERATOR_TYPE.AND) {
          const newTestScenario = cloneDeep(resultScenario);
          newTestScenario.id = uuid();
          newTestScenario.targetType = groupScenario.targetType;
          const testScenario1Assertions = groupScenario.testAssertions;
          for (let j = 0; j < testScenario1Assertions.length; j++) {
            const groupTestScenario = {
              id: uuid(),
              targetType: resultScenario.targetType,
              testResults: [],
              testAssertions: [],
            };

            groupTestScenario.testResults.push({ type: RESULT_TYPE.True, graphNodeId: groupGraphNodeId });
            const assertions = resultAssertions.filter((x) => x.graphNodeId !== groupGraphNodeId);
            assertions.forEach((assertion) => groupTestScenario.testAssertions.push(assertion));

            const assertion = groupTestScenario.testAssertions.find(
              (x) => x.graphNodeId === testScenario1Assertions[j].graphNodeId
            );

            if (!assertion) {
              groupTestScenario.testAssertions.push({
                graphNodeId: testScenario1Assertions[j].graphNodeId,
                nodeId: testScenario1Assertions[j].nodeId,
                result: testScenario1Assertions[j].result,
              });
            }

            const simplifiedChild = this.simplifyTestScenario(groupTestScenario, assertionDictionary, false);

            groupTestScenario.testAssertions.forEach((testAssertion) =>
              newTestScenario.testAssertions.push({
                graphNodeId: testAssertion.graphNodeId,
                nodeId: testAssertion.nodeId,
                testScenario: simplifiedChild,
                result: testAssertion.result,
              })
            );

            resultScenario = this.simplifyTestScenario(newTestScenario, assertionDictionary, false);
          }
        } else if (groupScenario.targetType === OPERATOR_TYPE.AND && resultScenario.targetType === OPERATOR_TYPE.OR) {
          resultAssertions.push({ testScenario: groupScenario, result: true });
        } else {
          const testScenario1Assertions = groupScenario.testAssertions;
          for (let j = 0; j < testScenario1Assertions.length; j++) {
            const assertion = resultAssertions.find((x) => x.graphNodeId === testScenario1Assertions[j].graphNodeId);
            if (assertion) {
              assertion.result = testScenario1Assertions[j].result;
            } else {
              resultAssertions.push({
                graphNodeId: testScenario1Assertions[j].graphNodeId,
                nodeId: testScenario1Assertions[j].nodeId,
                result: testScenario1Assertions[j].result,
              });
            }
          }
        }
      }

      const groupIndexInResult = resultAssertions.findIndex((x) => x.graphNodeId === groupGraphNodeId);
      resultAssertions.splice(groupIndexInResult, 1);
      group = getFirstGroupInTestAssertions(resultAssertions);
    }

    if (resultAssertions.length <= 1) {
      const child = resultAssertions[0].testScenario;
      if (child) {
        child.testResults = resultScenario.testResults ? [...resultScenario.testResults] : [];
        resultScenario = this.simplifyTestScenario(child, assertionDictionary, false);
      }
    } else {
      const getFirstScenarioSameGroupType = (assertions, targetGroupType) => {
        return assertions.filter((x) => x.testScenario).find((x) => x.testScenario.targetType === targetGroupType);
      };

      let remainScenario = getFirstScenarioSameGroupType(resultAssertions, resultScenario.targetType);
      while (remainScenario) {
        const testScenario1Assertions = remainScenario.testAssertions;
        for (let j = 0; j < testScenario1Assertions.length; j++) {
          const assertion = resultAssertions.find((x) => x.graphNodeId === testScenario1Assertions[j].graphNodeId);
          if (assertion) {
            assertion.result = testScenario1Assertions[j].result;
          } else {
            resultAssertions.push({
              graphNodeId: testScenario1Assertions[j].graphNodeId,
              nodeId: testScenario1Assertions[j].nodeId,
              result: testScenario1Assertions[j].result,
            });
          }
        }

        const remainScenarioId = remainScenario.id;
        const scenarioIndexInResult = resultAssertions.findIndex((x) => x.id === remainScenarioId);
        resultAssertions.splice(scenarioIndexInResult, 1);

        remainScenario = getFirstScenarioSameGroupType(resultAssertions, resultScenario.targetType);
      }
    }

    if (applyAbsorptionLaw) {
      const assertionScenarios = resultAssertions.filter((x) => x.testScenario).map((x) => x.testScenario);
      for (let i = 0; i < assertionScenarios.length - 1; i++) {
        const front = assertionScenarios[i];
        let removedFrontItem = false;
        for (let j = i + 1; j < assertionScenarios.length; j++) {
          const rear = assertionScenarios[j];

          const assertions = front.testAssertions.filter(
            (x) => x.testScenario && rear.testAssertions.some((y) => x.testScenario?.id === y.testScenario?.id)
          );
          const assertionsCount = assertions.length;
          const isAll = Enumerable.from(assertions).all((x) => {
            const frontAssertion = front.testAssertions.find(
              (y) =>
                (x.testScenario && y.testScenario && y.testScenario?.id === x.testScenario?.id) ||
                y.graphNodeId === x.graphNodeId
            );
            const rearAssertion = rear.testAssertions.find(
              (y) =>
                (x.testScenario && y.testScenario && y.testScenario?.id === x.testScenario?.id) ||
                y.graphNodeId === x.graphNodeId
            );

            return (
              (frontAssertion.testScenario &&
                rearAssertion.testScenario &&
                frontAssertion.testScenario?.id === rearAssertion.testScenario?.id) ||
              frontAssertion.graphNodeId === rearAssertion.graphNodeId
            );
          });
          if ((assertionsCount === front.length || assertionsCount === rear.length) && isAll) {
            if (front.testAssertions.length > rear.testAssertions.length) {
              const frontIndex = resultAssertions.findIndex(
                (x) => x.testScenario && x.testScenario?.id === front.testScenario?.id
              );

              const frontIndexInScenarios = assertionScenarios.findIndex(
                (x) => x.testScenario && x.testScenario?.id === front.testScenario?.id
              );

              resultAssertions.splice(frontIndex, 1);
              assertionScenarios.splice(frontIndexInScenarios, 1);
              j--;
              removedFrontItem = true;
            } else {
              const rearIndex = resultAssertions.findIndex(
                (x) => x.testScenario && x.testScenario?.id === rear.testScenario?.id
              );

              const rearIndexInScenarios = assertionScenarios.findIndex(
                (x) => x.testScenario && x.testScenario?.id === rear.testScenario?.id
              );
              resultAssertions.splice(rearIndex, 1);
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

    resultScenario.testAssertions = resultAssertions;

    return resultScenario;
  }

  _getMUTPs(testScenario, expectedValue = true) {
    let result = [];
    const graphNodeAssertions = testScenario.testAssertions.filter((x) => x.graphNodeId);
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
                x.graphNodeId === testAssertions[k].graphNodeId ||
                (x.testScenario && x.testScenario?.id === testAssertions[k].testScenario?.id)
            );
            if (utpFirstAssertion) {
              utpFirstAssertion.result = testAssertions[k].result;
            } else {
              result.testAssertions.push({
                graphNodeId: testAssertions[k].graphNodeId,
                testScenario: testAssertions[k]?.testScenario,
                nodeId: testAssertions[k].nodeId,
                result: testAssertions[k].result,
              });
            }
          } else {
            const utpLastAssertion = utpLastHalf.testAssertions.find(
              (x) =>
                x.graphNodeId === testAssertions[k].graphNodeId ||
                (x.testScenario && x.testScenario?.id === testAssertions[k].testScenario?.id)
            );
            if (utpLastAssertion) {
              utpLastAssertion.result = testAssertions[k].result;
            } else {
              result.testAssertions.push({
                graphNodeId: testAssertions[k].graphNodeId,
                testScenario: testAssertions[k]?.testScenario,
                nodeId: testAssertions[k].nodeId,
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
        const utp = TestScenarioHelper.invertedCloneWithExceptId(testScenario, trueAssertions[i]?.id);
        const trueResults = [...this._getMUTPs(trueAssertions[i])];
        const utpAssertions = utp.testAssertions.filter(
          (x) => x.testScenario && x.testScenario?.id !== trueAssertions[i]?.id
        );

        for (let j = 0; j < utpAssertions.length; j++) {
          const falseAssertion = TestScenarioHelper.clone(utpAssertions[j].testScenario);
          const assertionOfTrueAssertions = trueAssertions[i].testAssertions;
          for (let k = 0; k < assertionOfTrueAssertions.length; k++) {
            const index = falseAssertion.testAssertions.findIndex(
              (x) =>
                x.graphNodeId === assertionOfTrueAssertions[k].graphNodeId ||
                (x.testScenario && x.testScenario?.id === assertionOfTrueAssertions[k].testScenario?.id)
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
                      nextAssertion.testAssertions.some((y) => x.testScenario?.id === y.testScenario?.id)) ||
                    nextAssertion.testAssertions.some((y) => x.graphNodeId === y.graphNodeId)
                );

                const isAll = Enumerable.from(assertions).all((x) => {
                  const resultAssertion = trueResults[k].testAssertions.find(
                    (y) =>
                      (x.testScenario && y.testScenario && y.testScenario?.id === x.testScenario?.id) ||
                      y.graphNodeId === x.graphNodeId
                  );
                  const next = nextAssertion.testAssertions.find(
                    (y) =>
                      (x.testScenario && y.testScenario && y.testScenario?.id === x.testScenario?.id) ||
                      y.graphNodeId === x.graphNodeId
                  );

                  return (
                    (resultAssertion.testScenario &&
                      next.testScenario &&
                      resultAssertion.testScenario.id === next.testScenario.id) ||
                    resultAssertion.graphNodeId === next.graphNodeId
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
    const graphNodeAssertions = testScenario.testAssertions.filter((x) => x.graphNodeId);
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
              x.graphNodeId === testAssertions[i].graphNodeId ||
              (x.testScenario &&
                testAssertions[i].testScenario &&
                x.testScenario?.id === testAssertions[i].testScenario?.id)
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
        const cutpnfp = TestScenarioHelper.invertedCloneWithExceptId(testScenario, trueAssertions[i]?.id);
        const trueResults = [...this._getCUTPNFPs(trueAssertions[i], true, false)];
        const cutpnfpAssertions = cutpnfp.testAssertions.filter(
          (x) => x.testScenario && x.testScenario?.id !== trueAssertions[i]?.id
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
                    x.graphNodeId === assertions[k].graphNodeId ||
                    (x.testScenario && x.testScenario?.id === assertions[k].testScenario?.id)
                );

                if (index >= 0) {
                  falseAssertionCutpnfp.testAssertions.splice(index, 1);
                }
              }
            }

            const assertions = trueResults[j].testAssertions.filter(
              (x) =>
                (x.testScenario &&
                  falseAssertionCutpnfps[0].testAssertions.some((y) => x.testScenario?.id === y.testScenario?.id)) ||
                falseAssertionCutpnfps[0].testAssertions.some((y) => x.graphNodeId === y.graphNodeId)
            );

            const isAll = Enumerable.from(assertions).all((x) => {
              const resultAssertion = trueResults[j].testAssertions.find(
                (y) =>
                  (x.testScenario && y.testScenario && y.testScenario?.id === x.testScenario?.id) ||
                  y.graphNodeId === x.graphNodeId
              );
              const falseAssertion = cutpnfpAssertions[h].testScenario.testAssertions.find(
                (y) =>
                  (x.testScenario && y.testScenario && y.testScenario?.id === x.testScenario?.id) ||
                  y.graphNodeId === x.graphNodeId
              );

              return (
                (resultAssertion.testScenario &&
                  falseAssertion.testScenario &&
                  resultAssertion.testScenario.id === falseAssertion.testScenario.id) ||
                resultAssertion?.graphNodeId === falseAssertion?.graphNodeId
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
    const graphNodeAssertions = testScenario.testAssertions.filter((x) => x.graphNodeId);
    if (
      testScenario.targetType === OPERATOR_TYPE.AND ||
      (testScenario.testAssertions.length <= 1 && testScenario.testAssertions.length === graphNodeAssertions.length)
    ) {
      if (expectedValue) {
        for (let i = 0; i < graphNodeAssertions.length; i++) {
          const scenario = TestScenarioHelper.clone(testScenario);
          scenario.scenarioType = TEST_SCENARIO_TYPE.MNFP;
          const assertion = scenario.testAssertions.find((x) => x.graphNodeId === graphNodeAssertions[i].graphNodeId);
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
                x.graphNodeId === testAssertions[k].graphNodeId ||
                (x.testScenario && x.testScenario?.id === testAssertions[k].testScenario?.id)
            );
            if (nfpFirstAssertion) {
              nfpFirstAssertion.result = testAssertions[k].result;
            }
          } else {
            const utpLastAssertion = nfpLastHalf.testAssertions.find(
              (x) =>
                x.graphNodeId === testAssertions[k].graphNodeId ||
                (x.testScenario && x.testScenario?.id === testAssertions[k].testScenario?.id)
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
          (x) => x.testScenario && x.testScenario?.id !== trueAssertions[i]?.id
        );

        for (let j = 0; j < nfpAssertions.length; j++) {
          const falseAssertion = TestScenarioHelper.clone(nfpAssertions[j].testScenario);
          const assertionOfTrueAssertions = trueAssertions[i].testAssertions;
          for (let k = 0; k < assertionOfTrueAssertions.length; k++) {
            const index = falseAssertion.testAssertions.findIndex(
              (x) =>
                x.graphNodeId === assertionOfTrueAssertions[k].graphNodeId ||
                (!!x.testScenario && x.testScenario?.id === assertionOfTrueAssertions[k].testScenario?.id)
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
                    nextAssertion.testAssertions.some((y) => x.testScenario?.id === y.testScenario?.id)) ||
                  nextAssertion.testAssertions.some((y) => x.graphNodeId === y.graphNodeId)
              );

              const isAll = Enumerable.from(assertions).all((x) => {
                const resultAssertion = trueResults[k].testAssertions.find(
                  (y) =>
                    (x.testScenario && y.testScenario && y.testScenario?.id === x.testScenario?.id) ||
                    y.graphNodeId === x.graphNodeId
                );
                const next = nextAssertion.testAssertions.find(
                  (y) =>
                    (x.testScenario && y.testScenario && y.testScenario?.id === x.testScenario?.id) ||
                    y.graphNodeId === x.graphNodeId
                );

                return (
                  (resultAssertion.testScenario &&
                    next.testScenario &&
                    resultAssertion.testScenario?.id === next.testScenario?.id) ||
                  resultAssertion.graphNodeId === next.graphNodeId
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
