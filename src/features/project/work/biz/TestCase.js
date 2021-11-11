/* eslint-disable no-loop-func */
import { CLASSIFY, RESULT_TYPE } from 'features/shared/constants';
import { v4 as uuid } from 'uuid';
import TestData from './TestData';

class TestCase {
  constructor() {
    this.allTestDatas = [];
    this.graphNodes = [];
    this.testDataService = TestData;
  }

  updateTestCase(testScenarios = [], allTestDatas = [], graphNodes) {
    this.allTestDatas = allTestDatas;
    this.graphNodes = graphNodes;

    const totalTCs = [];
    for (let i = 0; i < testScenarios.length; i++) {
      let testCasesOfScenario = [];
      const causeAssertions = testScenarios[i].testAssertions.filter((x) => x.graphNode);
      for (let j = 0; j < causeAssertions.length; j++) {
        const causeAssertion = causeAssertions[j];
        const testDatas = this.testDataService.getTestData(allTestDatas, causeAssertion);

        if (testCasesOfScenario.length > 0) {
          const tmp = [];
          for (let k = 0; k < testCasesOfScenario.length; k++) {
            const testDataArray = this._getTrueOrFalseList(testDatas);
            testDataArray.forEach((data) => {
              const clone = this._clone(testCasesOfScenario[k]);
              clone.id = uuid();
              const testDataInCase = clone.testDatas.find((x) => x.graphNodeId === causeAssertions[j].graphNode.id);
              if (testDataInCase) {
                testDataInCase.data = data;
              } else {
                clone.testDatas.push({ graphNodeId: causeAssertions[j].graphNode.id, data });
              }
              tmp.push(clone);
            });
          }

          testCasesOfScenario = [...tmp];
        } else {
          const testDataArray = this._getTrueOrFalseList(testDatas);
          testDataArray.forEach((data) => {
            const newCase = {
              id: uuid(),
              testScenarioId: testScenarios[i].id,
              testScenario: { ...testScenarios[i] },
              testDatas: [{ graphNodeId: causeAssertions[j].graphNode.id, data }],
              results: [],
            };
            const { testResults } = testScenarios[i];
            for (let k = 0; k < testResults.length; k++) {
              if (testResults[k].type === RESULT_TYPE.False) {
                newCase.results.push(`NOT(${this._getDesciptionOfGraphNode(testResults[k].graphNodeId)})`);
              } else {
                newCase.results.push(this._getDesciptionOfGraphNode(testResults[k].graphNodeId));
              }
            }
            testCasesOfScenario.push(newCase);
          });
        }
      }

      totalTCs.push(...testCasesOfScenario);
    }

    return totalTCs;
  }

  _getDesciptionOfGraphNode(graphNodeId) {
    const graphNode = this.graphNodes.find((x) => x.id === graphNodeId);

    return graphNode ? graphNode.definition : '';
  }

  _clone(testCase) {
    return { ...testCase, testDatas: [...testCase.testDatas], results: [...testCase.results] };
  }

  _getTrueOrFalseList(datas = '') {
    return datas ? datas.split(',') : [''];
  }

  generateReportData(data) {
    const testCases = [];
    const testScenarios = data.map((testScenario) => {
      const testScenarioItem = {
        name: testScenario.Name,
        cause: 0,
        group: 0,
        bools: [],
        expectedResults: testScenario.results,
      };
      const setValue = (key, type) => {
        const index = parseInt(key.substring(1), 10) - 1;
        testScenarioItem.bools[index] = {
          ...testScenarioItem.bools[index],
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
      testScenario.testCases.forEach((testCase) => {
        const testCaseItem = {
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
