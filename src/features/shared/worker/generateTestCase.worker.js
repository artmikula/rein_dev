/* eslint-disable no-continue */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-restricted-syntax */

const workercode = () => {
  let testCaseId = 10000;
  const getTestCaseId = () => {
    testCaseId++;
    return `TC#-${testCaseId}`;
  };

  const _splitTupple = (datas) => {
    let _data = datas.trim();
    _data = _data.substring(1, _data.length - 1);
    const arr = _data.split('],[');
    return arr.map((x) => `[${x}]`);
  };

  const _convertTestDataToList = (datas = '', type = '') => {
    if (datas) {
      if (type === 'Tupple') {
        return _splitTupple(datas);
      }

      return datas.split(',');
    }
    return [''];
  };

  const _getTestData = (testDatas, assertion) => {
    const testData = testDatas.find((x) => x.nodeId === assertion.nodeId);
    if (testData) {
      return { testDatas: assertion.result ? testData.trueDatas : testData.falseDatas, type: testData.type };
    }

    return { testDatas: '', type: 'String' };
  };

  const _updateTestData = (newTestCase, testData, graphNodeId) => {
    const index = newTestCase.testDatas.findIndex((testData) => testData.graphNodeId === graphNodeId);
    if (index > -1) {
      const _newTestCase = newTestCase;
      _newTestCase.testDatas[index].data = testData.data;
    } else {
      newTestCase.testDatas.push(testData);
    }
  };

  const _insertTestCase = async (testCase, testAssertions, rawTestDatas, testDataLength, testCaseSet, maxTestCase) => {
    if (testCaseId <= maxTestCase) {
      for await (const testAssertion of testAssertions) {
        const index = testAssertions.findIndex((assertion) => testAssertion.graphNodeId === assertion.graphNodeId);
        const nextAssertions = testAssertions.slice(index + 1);
        const { testDatas, type } = _getTestData(rawTestDatas, testAssertion);
        const testData = _convertTestDataToList(testDatas, type);
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
            if (nextAssertions.length === 0 && testCaseId <= maxTestCase) {
              await testCaseSet.add({ id: testCaseId, value: testCase });
              continue;
            } else {
              await _insertTestCase(testCase, nextAssertions, rawTestDatas, testDataLength, testCaseSet, maxTestCase);
            }
          }
          if (existData && existData?.data === data) {
            const newTestCase = {
              id: getTestCaseId(),
              testScenarioId: testCase.testScenarioId,
              results: [...testCase.results],
              testDatas: structuredClone(testCase.testDatas),
              isSelected: false,
            };
            _updateTestData(newTestCase, newTestData, testAssertion.graphNodeId);
            if (nextAssertions.length > 0) {
              await _insertTestCase(
                newTestCase,
                nextAssertions,
                rawTestDatas,
                testDataLength,
                testCaseSet,
                maxTestCase
              );
            }
          } else if (existData && existData?.data !== data) {
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
            _updateTestData(newTestCase, newTestData, testAssertion.graphNodeId);
            if (newTestCase.testDatas.length === testDataLength && testCaseId <= maxTestCase) {
              await testCaseSet.add({ id: testCaseId, value: newTestCase });
              if (nextAssertions.length > 0) {
                await _insertTestCase(
                  newTestCase,
                  nextAssertions,
                  rawTestDatas,
                  testDataLength,
                  testCaseSet,
                  maxTestCase
                );
              }
              if (dataIndex < testData.length - 1) {
                continue;
              }
              if (dataIndex === testData.length - 1 || nextAssertions.length === 0) {
                return;
              }
            } else if (nextAssertions.length > 0) {
              await _insertTestCase(
                newTestCase,
                nextAssertions,
                rawTestDatas,
                testDataLength,
                testCaseSet,
                maxTestCase
              );
            } else {
              continue;
            }
          }
        }
      }
    }
  };

  self.addEventListener('message', async function (e) {
    if (e.data === 'request cancel') {
      e.target.postMessage('reset');
      return;
    }
    const { testScenarios, graphNodes, testDatas, dbInfo, lastKey } = e.data;
    const _testScenarios = JSON.parse(testScenarios);
    const _graphNodes = JSON.parse(graphNodes);
    const _testDatas = JSON.parse(testDatas);
    const _dbInfo = JSON.parse(dbInfo);
    const indexedDb = e.target.indexedDB;
    const request = await indexedDb.open(_dbInfo.name, _dbInfo.version);
    const maxTestCaseNumber = 100000;
    const _lastKey = lastKey === 0 ? testCaseId : lastKey + 5000 + _testScenarios.length;
    testCaseId = _lastKey;
    request.onsuccess = async function ({ target }) {
      const db = target.result;
      const transaction = await db.transaction([_dbInfo.table], 'readwrite');
      const objectStore = await transaction.objectStore(_dbInfo.table);
      await objectStore.clear();
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
        const maxTestCase = testCaseId + maxTestCaseNumber;

        await _insertTestCase(testCase, testAssertions, _testDatas, testAssertions.length, objectStore, maxTestCase);
      }
      e.target.postMessage('success');
    };
  });

  self.addEventListener('messageerror', function (e) {
    e.target.postMessage('fail');
    self.close();
  });
};

let code = workercode.toString();
code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));
const blob = new Blob([code], { type: 'application/javascript' });
const workerScript = URL.createObjectURL(blob);

export default workerScript;
