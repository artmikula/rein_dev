/* eslint-disable no-loop-func */
import { CLASSIFY, RESULT_TYPE, TEST_CASE_LIMITATION } from 'features/shared/constants';
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
            const maxNumberOfTestCases =
              testCasesOfScenario.length < TEST_CASE_LIMITATION ? testCasesOfScenario.length : TEST_CASE_LIMITATION;
            for (let k = 0; k < maxNumberOfTestCases; k++) {
              const testDataArray: string[] = this.convertTestDataToList(testDatas, type);
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
                if (clone.testDatas.length === causeAssertions.length) {
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
                testDatas: [{ graphNodeId: causeAssertions[j]?.graphNodeId, data, nodeId: causeAssertions[j]?.nodeId }],
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

  _clone(testCase: ITestCase) {
    return { ...testCase, testDatas: [...testCase.testDatas], results: [...testCase.results] };
  }

  _splitTupple = (datas: string) => {
    let _data = datas.trim();
    _data = _data.substring(1, _data.length - 1);
    const arr = _data.split('],[');
    return arr.map((x) => `[${x}]`);
  };

  convertTestDataToList(datas: string = '', type: string = ''): string[] {
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
          if (typeof key === 'string' && key[0] === CLASSIFY.CAUSE_PREFIX) {
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
