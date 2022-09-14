/* eslint-disable no-restricted-syntax */
import { RESULT_TYPE } from 'features/shared/constants';
import { sortByString } from 'features/shared/lib/utils';
import cloneDeep from 'lodash.clonedeep';
import testDataService from '../TestData';
import SimpleTestCase from '../Helper/TestCaseHelper';
import TestCase from '../TestCase';

export default class TestCaseWorker {
  async createTestCases() {
    for await (const testScenario of TestCase.testScenarios) {
      const { testAssertions, resultType, targetGraphNodeId } = testScenario;
      const results = [];
      if (resultType === RESULT_TYPE.False) {
        results.push(`NOT(${TestCase._getDescriptionOfGraphNode(TestCase.graphNodes, targetGraphNodeId)})`);
      } else {
        results.push(TestCase._getDescriptionOfGraphNode(TestCase.graphNodes, targetGraphNodeId));
      }
      const testCase = new SimpleTestCase({
        testScenarioId: testScenario.id,
        results,
      });
      await TestCase.getTestCase(testCase, testAssertions, testAssertions.length);
    }
  }

  async getTestCase(testCase, testAssertions, testDataLength) {
    for await (const testAssertion of testAssertions) {
      const index = testAssertions.findIndex((assertion) => testAssertion.graphNodeId === assertion.graphNodeId);
      const nextAssertions = testAssertions.slice(index + 1);
      const { testDatas, type } = testDataService.getTestData(TestCase.testData, testAssertion);
      const testData = TestCase.convertTestDataToList(testDatas, type);
      for await (const data of testData) {
        const dataIndex = testData.indexOf(data);
        const newTestData = {
          graphNodeId: testAssertion.graphNodeId,
          data,
          nodeId: testAssertion.nodeId ?? '',
        };
        const existData = testCase.testDatas.find((testData) => testData.graphNodeId === testAssertion.graphNodeId);

        if (!existData) {
          await testCase.addTestData(newTestData);
          if (nextAssertions.length === 0) {
            TestCase.testCaseSet?.add(testCase);
            // eslint-disable-next-line no-continue
            continue;
          } else {
            await TestCase.getTestCase(testCase, nextAssertions, testDataLength);
          }
        }
        if (existData && !existData?.data.includes(data)) {
          const newTestCase = new SimpleTestCase({
            testScenarioId: testCase.testScenarioId,
            results: cloneDeep(testCase.results),
            testDatas: sortByString(
              testCase.testDatas.filter((testData) => testData.graphNodeId !== testAssertion.graphNodeId),
              'nodeId'
            ),
          });
          newTestCase.updateTestData(newTestData, testAssertion.graphNodeId);
          if (newTestCase.testDatas.length === testDataLength) {
            TestCase.testCaseSet?.add(newTestCase);
            if (nextAssertions.length > 0) {
              await TestCase.getTestCase(newTestCase, nextAssertions, testDataLength);
            }
            if (dataIndex === testData.length - 1 || nextAssertions.length === 0) {
              return;
            }
          } else {
            await TestCase.getTestCase(newTestCase, nextAssertions, testDataLength);
          }
        }
      }
    }
  }
}
