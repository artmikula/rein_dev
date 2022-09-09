/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import cloneDeep from 'lodash.clonedeep';
import { CLASSIFY, GRAPH_NODE_TYPE, RESULT_TYPE } from 'features/shared/constants';
import {
  IGraphNode,
  ITestCase,
  ISimpleTestScenario,
  ITestDataDetail,
  ITestData,
  ISimpleTestCase,
  ITestAssertion,
} from 'types/models';
import { ITestCaseSet } from 'features/shared/storage-services/dbContext/models';
import { ITestScenarioReport, ITestScenarioAndCaseRow, ITestCaseReport } from 'types/bizModels';
import SimpleTestCase from './Helper/TestCaseHelper';
import testDataService from './TestData';

interface ITestCaseHelper {
  testScenarios: ISimpleTestScenario[];
  graphNodes: IGraphNode[];
  testData: ITestDataDetail[];
  testDataDraft: ITestDataDetail[];
}

interface IReportData {
  testScenarios: ITestScenarioReport[];
  testCases: ITestCaseReport[];
}

class TestCase implements ITestCaseHelper {
  testScenarios: ISimpleTestScenario[];

  graphNodes: IGraphNode[];

  testData: ITestDataDetail[];

  testDataDraft: ITestDataDetail[];

  constructor() {
    this.testScenarios = [];
    this.graphNodes = [];
    this.testData = [];
    this.testDataDraft = [];
  }

  init(testScenarios: ISimpleTestScenario[], graphNodes: IGraphNode[], testData: ITestDataDetail[]) {
    this.testScenarios = testScenarios;
    this.graphNodes = graphNodes;
    this.testData = testData;
    this.testDataDraft = testData;
  }

  generateTestCases(testCaseSet: ITestCaseSet) {
    const allTestCases: ITestCase[] = [];
    for (let i = 0; i < this.testScenarios.length; i++) {
      let testCases: ISimpleTestCase[] = [];
      if (!this.testScenarios[i].isViolated) {
        const testAssertions = this.testScenarios[i].testAssertions.filter((testAssertion) =>
          this.graphNodes.some(
            (graphNode) => graphNode.id === testAssertion.graphNodeId && graphNode.type !== GRAPH_NODE_TYPE.GROUP
          )
        );
        for (let j = 0; j < testAssertions.length; j++) {
          const { testDatas, type }: { testDatas: string; type: string } = testDataService.getTestData(
            this.testData,
            testAssertions[j]
          );
          const testData: string[] = this.convertTestDataToList(testDatas, type);
          const tempTestCases: ISimpleTestCase[] = [];
          for (const data of testData) {
            if (j > 0) {
              for (const testCase of testCases) {
                const newTestCase = new SimpleTestCase({
                  testScenarioId: testCase.testScenarioId,
                  results: testCase.results.slice(),
                  testDatas: testCase.testDatas.slice(),
                  isSelected: testCase.isSelected ?? false,
                });
                const newTestData = {
                  graphNodeId: testAssertions[j].graphNodeId,
                  data,
                  nodeId: testAssertions[j].nodeId,
                };
                newTestCase.updateTestData(newTestData, testAssertions[j].graphNodeId);
                if (newTestCase.testDatas.length === testAssertions.length) {
                  testCaseSet.add(newTestCase);
                }
                tempTestCases.push(newTestCase);
              }
            } else {
              const results: string[] = [];
              if (this.testScenarios[i].resultType === RESULT_TYPE.False) {
                results.push(
                  `NOT(${this._getDescriptionOfGraphNode(this.graphNodes, this.testScenarios[i].targetGraphNodeId)})`
                );
              } else {
                results.push(this._getDescriptionOfGraphNode(this.graphNodes, this.testScenarios[i].targetGraphNodeId));
              }
              const testCase: ISimpleTestCase = new SimpleTestCase({
                testScenarioId: this.testScenarios[i].id,
                results,
              });
              testCase.addTestData({
                graphNodeId: testAssertions[j].graphNodeId,
                data,
                nodeId: testAssertions[j].nodeId,
              });
              testCases.push(testCase);
            }
          }
          if (j > 0) {
            testCases = tempTestCases;
          }
        }
      }
      testCases.forEach((testCase) => allTestCases.push(testCase));
    }
    return allTestCases;
  }

  async createTestCases(testCaseSet: ITestCaseSet) {
    for await (const testScenario of this.testScenarios) {
      const results: string[] = [];
      if (testScenario.resultType === RESULT_TYPE.False) {
        results.push(`NOT(${this._getDescriptionOfGraphNode(this.graphNodes, testScenario.targetGraphNodeId)})`);
      } else {
        results.push(this._getDescriptionOfGraphNode(this.graphNodes, testScenario.targetGraphNodeId));
      }
      const testCase = new SimpleTestCase({
        testScenarioId: testScenario.id,
        results,
      });
      const testDataLength = testScenario.testAssertions.length;
      await this.getTestCase(testCase, testScenario.testAssertions, testCaseSet, testDataLength);
    }
  }

  async getTestCase(
    testCase: ISimpleTestCase,
    testAssertions: ITestAssertion[],
    testCaseSet: ITestCaseSet,
    testDataLength: number
  ) {
    for await (const testAssertion of testAssertions) {
      // console.log('testAssertions[i]', testAssertions[i]);
      const i = testAssertions.findIndex((asssertion) => testAssertion.graphNodeId === asssertion.graphNodeId);
      const nextAssertions = testAssertions.slice(i + 1);
      const { testDatas, type }: { testDatas: string; type: string } = testDataService.getTestData(
        this.testData,
        testAssertion
      );
      const testData: string[] = this.convertTestDataToList(testDatas, type);
      for await (const data of testData) {
        // console.log('data', data);
        // console.log('testCase', testCase);
        const newTestData: ITestData = {
          graphNodeId: testAssertions[i].graphNodeId,
          data,
          nodeId: testAssertions[i].nodeId ?? '',
        };
        const existData = testCase.testDatas.find(
          (value: ITestData) => value.graphNodeId === testAssertions[i].graphNodeId
        );

        if (!existData) {
          await testCase.addTestData(newTestData);
          if (nextAssertions.length === 0) {
            // console.log('add to db 1');
            testCaseSet.add(testCase);
            continue;
          } else {
            await this.getTestCase(testCase, nextAssertions, testCaseSet, testDataLength);
          }
        }
        if (existData && !existData.data.includes(data)) {
          // console.log('new test case');
          const newTestCase = new SimpleTestCase({
            testScenarioId: testCase.testScenarioId,
            results: cloneDeep(testCase.results),
            testDatas: cloneDeep(testCase.testDatas),
          });
          newTestCase.updateTestData(newTestData, testAssertion.graphNodeId);
          if (nextAssertions.length === 0) {
            // console.log('add to db 2');
            testCaseSet.add(testCase);
            continue;
          } else {
            await this.getTestCase(newTestCase, nextAssertions, testCaseSet, testDataLength);
          }
        }
      }
    }
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

  generateReportData(data: ITestScenarioAndCaseRow[] = []): IReportData {
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
