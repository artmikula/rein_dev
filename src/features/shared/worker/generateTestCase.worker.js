/* eslint-disable no-continue */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-restricted-syntax */

const workercode = () => {
  let testCaseId = 1000000;
  const getTestCaseId = () => {
    testCaseId++;
    return `TC#-${testCaseId}`;
  };

  const convertTestDataToList = (datas = '', type = '') => {
    if (datas) {
      if (type === 'Tupple') {
        return this._splitTupple(datas);
      }

      return datas.split(',');
    }
    return [''];
  };

  const getTestData = (testDatas, assertion) => {
    const testData = testDatas.find((x) => x.nodeId === assertion.nodeId);
    if (testData) {
      return { testDatas: assertion.result ? testData.trueDatas : testData.falseDatas, type: testData.type };
    }

    return { testDatas: '', type: 'String' };
  };

  const updateTestData = (newTestCase, testData, graphNodeId) => {
    const index = newTestCase.testDatas.findIndex((testData) => testData.graphNodeId === graphNodeId);
    if (index > -1) {
      const _newTestCase = newTestCase;
      _newTestCase.testDatas[index].data = testData.data;
    } else {
      newTestCase.testDatas.push(testData);
    }
  };

  const _getTestCase = async (testCase, testAssertions, rawTestDatas, testDataLength, indexedDb) => {
    for await (const testAssertion of testAssertions) {
      const index = testAssertions.findIndex((assertion) => testAssertion.graphNodeId === assertion.graphNodeId);
      const nextAssertions = testAssertions.slice(index + 1);
      const { testDatas, type } = getTestData(rawTestDatas, testAssertion);
      const testData = convertTestDataToList(testDatas, type);
      for await (const data of testData) {
        const dataIndex = testData.indexOf(data);
        const newTestData = {
          graphNodeId: testAssertion.graphNodeId,
          data,
          nodeId: testAssertion.nodeId ?? '',
        };
        const existData = testCase.testDatas.find((testData) => testData.graphNodeId === testAssertion.graphNodeId);

        if (!existData) {
          await testCase.testDatas.push(newTestData);
          if (nextAssertions.length === 0) {
            indexedDb.add({ id: testCaseId, value: testCase });
            continue;
          } else {
            await _getTestCase(testCase, nextAssertions, rawTestDatas, testDataLength, indexedDb);
          }
        }
        if (existData && !existData?.data.includes(data)) {
          const newTestCase = {
            id: getTestCaseId(),
            testScenarioId: testCase.testScenarioId,
            results: [...testCase.results],
            testDatas: testCase.testDatas
              .filter((testData) => testData.graphNodeId !== testAssertion.graphNodeId)
              .sort((a, b) => {
                const nodeA = a.nodeId.toUpperCase();
                const nodeB = b.nodeId.toUpperCase();
                if (nodeA < nodeB) {
                  return -1;
                }
                if (nodeA > nodeB) {
                  return 1;
                }
                return 0;
              }),
            isSelected: false,
          };
          updateTestData(newTestCase, newTestData, testAssertion.graphNodeId);
          if (newTestCase.testDatas.length === testDataLength) {
            indexedDb.add({ id: testCaseId, value: newTestCase });
            if (nextAssertions.length > 0) {
              await _getTestCase(newTestCase, nextAssertions, rawTestDatas, testDataLength, indexedDb);
            }
            if (dataIndex === testData.length - 1 || nextAssertions.length === 0) {
              return;
            }
          } else {
            await _getTestCase(newTestCase, nextAssertions, rawTestDatas, testDataLength, indexedDb);
          }
        }
      }
    }
  };

  self.addEventListener(
    'message',
    async function (e) {
      const { testScenarios, graphNodes, testDatas, dbInfo } = e.data;
      const _testScenarios = JSON.parse(testScenarios);
      const _graphNodes = JSON.parse(graphNodes);
      const _testDatas = JSON.parse(testDatas);
      const _dbInfo = JSON.parse(dbInfo);
      const indexedDb = e.target.indexedDB;
      const request = await indexedDb.open(_dbInfo.name, _dbInfo.version);
      request.onsuccess = async function ({ target }) {
        const db = target.result;
        const transaction = await db.transaction([_dbInfo.table], 'readwrite');
        const indexedDb = await transaction.objectStore(_dbInfo.table);
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
          const testCase = {
            id: getTestCaseId(),
            testScenarioId: testScenario.id,
            results,
            testDatas: [],
            isSelected: false,
          };
          await _getTestCase(testCase, testAssertions, _testDatas, testAssertions.length, indexedDb);
        }
      };
      // close transaction
      await e.target.postMessage('done');
      await e.target.close();
    },
    false
  );
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
