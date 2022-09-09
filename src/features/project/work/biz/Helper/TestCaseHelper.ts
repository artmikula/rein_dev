import { v4 as uuid } from 'uuid';
import { ISimpleTestCase, ITestData } from 'types/models';

interface IProps {
  testScenarioId: string;
  results: string[];
  testDatas?: ITestData[];
  isSelected?: boolean;
}
class SimpleTestCase implements ISimpleTestCase {
  id: string;

  testScenarioId: string;

  results: string[];

  testDatas: ITestData[];

  isSelected?: boolean;

  constructor({ testScenarioId, results = [], testDatas = [], isSelected = false }: IProps) {
    this.id = uuid();
    this.testScenarioId = testScenarioId;
    this.results = results;
    this.testDatas = testDatas;
    this.isSelected = isSelected;
  }

  updateTestData(testData: ITestData, graphNodeId: string): void {
    const index = this.testDatas.findIndex((testData) => testData.graphNodeId === graphNodeId);
    if (index > -1) {
      this.testDatas[index].data = testData.data;
    } else {
      this.addTestData(testData);
    }
  }

  addTestData(testData: ITestData): void {
    this.testDatas.push(testData);
  }
}

export default SimpleTestCase;
