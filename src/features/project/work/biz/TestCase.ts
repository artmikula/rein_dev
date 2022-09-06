/* eslint-disable no-loop-func */
import { CLASSIFY, GRAPH_NODE_TYPE, RESULT_TYPE } from 'features/shared/constants';
import { v4 as uuid } from 'uuid';
import { IGraphNode, ITestAssertion, ITestCase, ISimpleTestScenario, ITestDataDetail } from 'types/models';
import { ITestCaseSet } from 'features/shared/storage-services/dbContext/models';
import { ITestScenarioReport, ITestScenarioAndCaseRow, ITestCaseReport } from 'types/bizModels';
import testDataService from './TestData';

class TestCase {
  updateTestCase(
    testCaseSet: ITestCaseSet,
    testScenarios: ISimpleTestScenario[] = [],
    testDataList: ITestDataDetail[] = [],
    graphNodes: IGraphNode[] = []
  ) {
    const totalTCs: ITestCase[] = [];
    for (let i = 0; i < 1; i++) {
      let testCasesOfScenario: ITestCase[] = [];

      if (!testScenarios[i].isViolated) {
        const testAssertions: ITestAssertion[] = testScenarios[i].testAssertions.filter((testAssertion) =>
          graphNodes.some(
            (graphNode) => graphNode.id === testAssertion.graphNodeId && graphNode.type !== GRAPH_NODE_TYPE.GROUP
          )
        );

        for (let j = 0; j < 10; j++) {
          const testAssertion: ITestAssertion = testAssertions[j];

          const { testDatas, type }: { testDatas: string; type: string } = testDataService.getTestData(
            testDataList,
            testAssertion
          );

          if (testCasesOfScenario.length > 0) {
            const tmp: ITestCase[] = [];
            for (let k = 0; k < testCasesOfScenario.length; k++) {
              const testDataArray: string[] = this.convertTestDataToList(testDatas, type);
              testDataArray.forEach((data) => {
                const clone: ITestCase = structuredClone(testCasesOfScenario[k]);
                clone.id = uuid();
                const testDataInCase = clone.testDatas.find((x) => x.graphNodeId === testAssertions[j]?.graphNodeId);
                if (testDataInCase) {
                  testDataInCase.data = data;
                } else {
                  clone.testDatas.push({
                    graphNodeId: testAssertions[j]?.graphNodeId,
                    data,
                    nodeId: testAssertions[j]?.nodeId,
                  });
                }
                if (clone.testDatas.length === 10) {
                  clone.isSelected = false;
                  testCaseSet.add(clone);
                }
                tmp.push(clone);
              });
            }

            testCasesOfScenario = tmp;
          } else {
            const testDataArray: string[] = this.convertTestDataToList(testDatas, type);
            testDataArray.forEach((data) => {
              const newCase: ITestCase = {
                id: uuid(),
                testScenarioId: testScenarios[i].id,
                // testScenario: { ...testScenarios[i] },
                testDatas: [{ graphNodeId: testAssertions[j]?.graphNodeId, data, nodeId: testAssertions[j]?.nodeId }],
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

      testCasesOfScenario.forEach((tc) => {
        totalTCs.push(tc);
      });
      // totalTCs.push(testCasesOfScenario);
    }

    return totalTCs;
  }

  _getDescriptionOfGraphNode(graphNodes: IGraphNode[], graphNodeId: string) {
    const graphNode = graphNodes.find((graphNode) => graphNode.id === graphNodeId);

    return graphNode ? graphNode.definition : '';
  }

  _splitTupple = (datas: string) => {
    let _data = datas.trim();
    _data = _data.substring(1, _data.length - 1);
    const arr = _data.split('],[');
    return arr.map((x) => `[${x}]`);
  };

  convertTestDataToList(datas = '', type = ''): string[] {
    if (datas) {
      if (type === 'Tupple') {
        return this._splitTupple(datas);
      }

      return datas.split(',');
    }
    return [''];
  }

  generateReportData(data: ITestScenarioAndCaseRow[] = []): {
    testScenarios: ITestScenarioReport[];
    testCases: ITestCaseReport[];
  } {
    const testCases: ITestCaseReport[] = [];
    const testScenarios: ITestScenarioReport[] = data.map((testScenario) => {
      const testScenarioItem: ITestScenarioReport = {
        name: testScenario.Name,
        cause: 0,
        group: 0,
        bools: [],
        expectedResults: testScenario.results,
      };
      const setValue = (key: string, type: keyof ITestScenarioReport) => {
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
      testScenario.testCases?.forEach((testCase) => {
        const testCaseItem: ITestCaseReport = {
          name: testCase.Name,
          expectedResults: testScenario.results,
          definition: testCase.results,
          causes: [],
        };
        Object.keys(testCase).forEach((key: keyof ITestCaseReport) => {
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
