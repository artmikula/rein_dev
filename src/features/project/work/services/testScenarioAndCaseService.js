class TestScenarioAnsCaseService {
  constructor() {
    this.localId = 'TestScenarioAnsCaseService';
  }

  setId = (localId) => {
    this.localId = localId;
  };

  set = (data) => {
    localStorage.setItem(this.localId, JSON.stringify(data));
  };

  get = () => {
    const data = localStorage.getItem(this.localId);

    return data ? JSON.parse(data) : [];
  };

  checkTestCase = (scenarioId, caseId, checked) => {
    const data = this.get();
    const testScenario = data.find((x) => x.id === scenarioId);

    if (testScenario) {
      const testCase = testScenario.testCases.find((x) => x.id === caseId);

      if (testCase) {
        testCase.isChecked = checked;

        if (!checked) {
          testScenario.isChecked = checked;
        } else {
          testScenario.isChecked = !testScenario.testCases.some((x) => !x.isChecked);
        }

        this.set(data);
      }
    }
  };

  checkTestScenario = (scenarioId, checked) => {
    const data = this.get();
    const testScenario = data.find((x) => x.id === scenarioId);

    if (testScenario) {
      testScenario.isChecked = checked;

      for (let i = 0; i < testScenario.testCases.length; i++) {
        testScenario.testCases[i].isChecked = checked;
      }

      this.set(data);
    }
  };

  changeTestScenario = (scenarioId, key, value) => {
    const data = this.get();
    const testScenario = data.find((x) => x.id === scenarioId);

    if (testScenario) {
      testScenario[key] = value;
    }

    this.set(data);
  };
}

const testScenarioAnsCaseService = new TestScenarioAnsCaseService();

window.testScenarioAnsCaseService = testScenarioAnsCaseService;

export default testScenarioAnsCaseService;
