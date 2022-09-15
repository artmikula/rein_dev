/* eslint-disable no-restricted-globals */
/* eslint-disable no-restricted-syntax */
import cloneDeep from 'lodash.clonedeep';
import testDataService from '../TestData.js';
import SimpleTestCase from '../Helper/TestCaseHelper.ts';
import TestCase from '../TestCase.ts';

const _sortByString = (data, key) => {
  return data.sort((a, b) => {
    const stringA = a[key].toUpperCase();
    const stringB = b[key].toUpperCase();
    if (stringA < stringB) {
      return -1;
    }
    if (stringA > stringB) {
      return 1;
    }
    return 0;
  });
};

const _getTestCase = async (testCase, testAssertions, rawTestDatas, testDataLength) => {
  for await (const testAssertion of testAssertions) {
    const index = testAssertions.findIndex((assertion) => testAssertion.graphNodeId === assertion.graphNodeId);
    const nextAssertions = testAssertions.slice(index + 1);
    const { testDatas, type } = testDataService.getTestData(rawTestDatas, testAssertion);
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
          await _getTestCase(testCase, nextAssertions, rawTestDatas, testDataLength);
        }
      }
      if (existData && !existData?.data.includes(data)) {
        const newTestCase = new SimpleTestCase({
          testScenarioId: testCase.testScenarioId,
          results: cloneDeep(testCase.results),
          testDatas: _sortByString(
            testCase.testDatas.filter((testData) => testData.graphNodeId !== testAssertion.graphNodeId),
            'nodeId'
          ),
        });
        newTestCase.updateTestData(newTestData, testAssertion.graphNodeId);
        if (newTestCase.testDatas.length === testDataLength) {
          TestCase.testCaseSet?.add(newTestCase);
          if (nextAssertions.length > 0) {
            await _getTestCase(newTestCase, nextAssertions, rawTestDatas, testDataLength);
          }
          if (dataIndex === testData.length - 1 || nextAssertions.length === 0) {
            return;
          }
        } else {
          await _getTestCase(newTestCase, nextAssertions, rawTestDatas, testDataLength);
        }
      }
    }
  }
};

const workercode = () => {
  self.addEventListener('message', async function (e) {
    console.log(123, e);
    const { testScenarios, graphNodes, testDatas } = e.data;
    const _testScenarios = JSON.parse(testScenarios);
    const _graphNodes = JSON.parse(graphNodes);
    const _testDatas = JSON.parse(testDatas);
    for await (const testScenario of _testScenarios) {
      const { testAssertions, resultType, targetGraphNodeId } = testScenario;
      const results = [];
      const graphNode = _graphNodes.find((graphNode) => graphNode.id === targetGraphNodeId);
      const nodeDefinition = graphNode ? graphNode.definition : '';
      if (resultType === 'False') {
        results.push(`NOT(${nodeDefinition})`);
      } else {
        results.push(nodeDefinition);
      }
      const testCase = new SimpleTestCase({
        testScenarioId: testScenario.id,
        results,
      });
      await _getTestCase(testCase, testAssertions, _testDatas, testAssertions.length);
    }
    await self.postMessage('done');
    await self.terminate();
  });
  self.addEventListener('messageerror', function (e) {
    console.log('error', e);
    self.terminate();
  });
};

let code = workercode.toString();
code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));
const blob = new Blob([code], { type: 'application/javascript' });
const workerScript = URL.createObjectURL(blob);

export default workerScript;
