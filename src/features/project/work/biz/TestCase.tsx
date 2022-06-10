/* eslint-disable no-loop-func */
import { CLASSIFY, RESULT_TYPE } from 'features/shared/constants';
import { v4 as uuid } from 'uuid';
import { IGraphNode, ITestScenario, ITestAssertion, ITestCase, ISimpleTestScenario } from 'types/models';
import testDataService from './TestData';

interface ITestDataList {
  id: string;
  workId: string;
  nodeId: string;
  trueDatas: string;
  falseDatas: string;
  strength: number;
  type: string;
  createdDate: Date;
  lastModifiedDate: Date;
}

class TestCase {
  updateTestCase(
    testScenarios: ISimpleTestScenario[] = [],
    testDataList: ITestDataList[] = [],
    graphNodes: IGraphNode[] = []
  ) {
    const totalTCs: ITestCase[] = [];
    for (let i = 0; i < testScenarios.length; i++) {
      let testCasesOfScenario: ITestCase[] = [];

      if (!testScenarios[i].isViolated) {
        const causeAssertions: ITestAssertion[] = testScenarios[i].testAssertions.filter((x) => x.graphNodeId);

        for (let j = 0; j < causeAssertions.length; j++) {
          const causeAssertion: ITestAssertion = causeAssertions[j];
          const { testDatas, type }: { testDatas: string; type: string } = testDataService.getTestData(
            testDataList,
            causeAssertion
          );

          if (testCasesOfScenario.length > 0) {
            const tmp: ITestCase[] = [];
            for (let k = 0; k < testCasesOfScenario.length; k++) {
              const testDataArray: string[] = this._getTrueOrFalseList(testDatas, type);
              testDataArray.forEach((data) => {
                const clone: ITestCase = this._clone(testCasesOfScenario[k]);
                clone.id = uuid();
                const testDataInCase = clone.testDatas.find((x) => x.graphNodeId === causeAssertions[j]?.graphNodeId);
                if (testDataInCase) {
                  testDataInCase.data = data;
                } else {
                  clone.testDatas.push({
                    graphNodeId: causeAssertions[j]?.graphNodeId,
                    data,
                    nodeId: causeAssertions[j]?.nodeId,
                  });
                }
                tmp.push(clone);
              });
            }

            testCasesOfScenario = [...tmp];
          } else {
            const testDataArray: string[] = this._getTrueOrFalseList(testDatas, type);
            testDataArray.forEach((data) => {
              const newCase: ITestCase = {
                id: uuid(),
                testScenarioId: testScenarios[i].id,
                testScenario: { ...testScenarios[i] },
                testDatas: [{ graphNodeId: causeAssertions[j]?.graphNodeId, data }],
                results: [],
              };
              if (testScenarios[i].resultType === RESULT_TYPE.False) {
                newCase.results.push(
                  `NOT(${this._getDescriptionOfGraphNode(graphNodes, testScenarios[i].targetGraphNodeId)})`
                );
              } else {
                newCase.results.push(this._getDescriptionOfGraphNode(graphNodes, testScenarios[i].targetGraphNodeId));
              }
              testCasesOfScenario.push(newCase);
            });
          }
        }
      }

      totalTCs.push(...testCasesOfScenario);
    }

    return totalTCs;
  }

  createTestCase = (
    testScenarios: ISimpleTestScenario[] = [],
    testDataList: ITestDataList[] = [],
    graphNodes: IGraphNode[] = []
  ) => {
    const totalTestCase: ITestCase[] = [];
    testScenarios.forEach((testScenario) => {
      const testCases: ITestCase[] = [];
      const { testAssertions } = testScenario;
      const causeAssertions: ITestAssertion[] = testAssertions.filter((testAssertion) => testAssertion.graphNode);

      causeAssertions.forEach((causeAssertion, index) => {
        const { testDatas, type }: { testDatas: string; type: string } = testDataService.getTestData(
          testDataList,
          causeAssertion
        );
        const convertTestValueToArray = this._getTrueOrFalseList(testDatas, type);
        convertTestValueToArray.forEach((testValue) => {
          if (index === 0) {
            const testCase: ITestCase = {
              id: uuid(),
              testScenarioId: testScenario.id,
              testScenario: { ...testScenario },
              testDatas: [
                {
                  graphNodeId: causeAssertion.graphNode?.id || causeAssertion.graphNodeId,
                  data: testValue,
                },
              ],
              results: [],
            };
            if (testScenario.resultType === RESULT_TYPE.False) {
              testCase.results.push(
                `NOT(${this._getDescriptionOfGraphNode(graphNodes, testScenario.targetGraphNodeId)})`
              );
            } else {
              testCase.results.push(this._getDescriptionOfGraphNode(graphNodes, testScenario.targetGraphNodeId));
            }

            testCases.push(testCase);
          } else {
            testCases.forEach((testCase) => {
              const existedNode = testCase.testDatas.findIndex(
                (testData) => testData.graphNodeId === causeAssertion.graphNodeId
              );
              if (existedNode > -1) {
                const newTestCase: ITestCase = {
                  id: uuid(),
                  testScenarioId: testScenario.id,
                  testScenario: { ...testScenario },
                  testDatas: testCase.testDatas.map((testData) => ({ ...testData })),
                  results: [],
                };
                newTestCase.testDatas[existedNode].data = testValue;
                testCases.push(newTestCase);
              } else {
                testCase.testDatas.push({
                  graphNodeId: causeAssertion.graphNodeId,
                  data: testValue,
                });
              }
            });
          }
        });
      });
      testCases.map((testCase) => totalTestCase.push(testCase));
    });
    return totalTestCase;
  };

  _getDescriptionOfGraphNode(graphNodes: IGraphNode[], graphNodeId: string) {
    const graphNode = graphNodes.find((graphNode) => graphNode.id === graphNodeId);

    return graphNode ? graphNode.definition : '';
  }

  _clone(testCase: ITestCase) {
    return { ...testCase, testDatas: [...testCase.testDatas], results: [...testCase.results] };
  }

  _splitTupple = (datas: string) => {
    let _data = datas.trim();
    _data = _data.substring(1, _data.length - 1);
    const arr = _data.split('],[');
    return arr.map((x) => `[${x}]`);
  };

  _getTrueOrFalseList(datas: string = '', type: string) {
    if (datas) {
      if (type === 'Tupple') {
        return this._splitTupple(datas);
      }

      return datas.split(',');
    }
    return [''];
  }

  generateReportData(data: any[] | any[] = []) {
    const testCases: any[] = [];
    const testScenarios: any[] = data.map((testScenario) => {
      const testScenarioItem: any = {
        name: testScenario.Name,
        cause: 0,
        group: 0,
        bools: [],
        expectedResults: testScenario.results,
      };
      const setValue = (key: string, type: string) => {
        const index: number = parseInt(key.substring(1), 10) - 1;
        testScenarioItem.bools[index] = {
          ...testScenarioItem?.bools[index],
          [type]: testScenario[key] || '',
        };
        if (testScenario[key]) {
          testScenarioItem[type] += 1;
        }
      };
      Object.keys(testScenario).forEach((key) => {
        if (key[0] === CLASSIFY.CAUSE_PREFIX) {
          setValue(key, 'cause');
        }
        if (key[0] === CLASSIFY.GROUP_PREFIX) {
          setValue(key, 'group');
        }
      });
      // create test data
      testScenario.testCases.forEach((testCase: any) => {
        const testCaseItem: any = {
          name: testCase.Name,
          expectedResults: testScenario.results,
          definition: testCase.results,
          causes: [],
        };
        Object.keys(testCase).forEach((key) => {
          if (key[0] === CLASSIFY.CAUSE_PREFIX) {
            testCaseItem[key] = testCase[key];
          }
        });
        testCases.push(testCaseItem);
      });
      return testScenarioItem;
    });
    return { testScenarios, testCases };
  }
}
export default new TestCase();
