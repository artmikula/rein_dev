/* eslint-disable no-loop-func */
import { CLASSIFY, RESULT_TYPE } from 'features/shared/constants';
import { v4 as uuid } from 'uuid';
import testDataService from './TestData';

class TestCase {
  updateTestCase(testScenarios = [], allTestDatas = [], graphNodes) {
    const totalTCs = [];
    for (let i = 0; i < testScenarios.length; i++) {
      let testCasesOfScenario = [];
      const causeAssertions = testScenarios[i].testAssertions.filter((x) => x.graphNode);
      for (let j = 0; j < causeAssertions.length; j++) {
        const causeAssertion = causeAssertions[j];
        const { testDatas, type } = testDataService.getTestData(allTestDatas, causeAssertion, graphNodes);

        if (testCasesOfScenario.length > 0) {
          const tmp = [];
          for (let k = 0; k < testCasesOfScenario.length; k++) {
            const testDataArray = this._getTrueOrFalseList(testDatas, type);
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
          const testDataArray = this._getTrueOrFalseList(testDatas, type);
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
                newCase.results.push(`NOT(${this._getDesciptionOfGraphNode(graphNodes, testResults[k].graphNodeId)})`);
              } else {
                newCase.results.push(this._getDesciptionOfGraphNode(graphNodes, testResults[k].graphNodeId));
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

  _getDesciptionOfGraphNode(graphNodes, graphNodeId) {
    const graphNode = graphNodes.find((x) => x.id === graphNodeId);

    return graphNode ? graphNode.definition : '';
  }

  _clone(testCase) {
    return { ...testCase, testDatas: [...testCase.testDatas], results: [...testCase.results] };
  }

  _splitTupple = (datas) => {
    let _data = datas.trim();
    _data = _data.substring(1, _data.length - 1);
    const arr = _data.split('],[');
    return arr.map((x) => `[${x}]`);
  };

  _getTrueOrFalseList(datas = '', type) {
    if (datas) {
      if (type === 'Tupple') {
        return this._splitTupple(datas);
      }

      return datas.split(',');
    }
    return [''];
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
