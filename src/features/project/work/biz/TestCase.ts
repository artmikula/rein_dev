import { CLASSIFY } from 'features/shared/constants';
import { ITestScenarioReport, ITestScenarioAndCaseRow, ITestCaseReport } from 'types/bizModels';

interface IReportData {
  testScenarios: ITestScenarioReport[];
  testCases: ITestCaseReport[];
}

class TestCase {
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
          definition: testScenario.effectDefinition,
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
