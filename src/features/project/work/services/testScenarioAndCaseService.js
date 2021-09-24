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

  checkTestCase = (scenarioId, caseId, checked, defaultData = null) => {
    const data = defaultData ?? this.get();
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

        if (!defaultData) {
          this.set(data);
        }
      }
    }

    return data;
  };

  checkTestScenario = (scenarioId, checked, defaultData = null) => {
    const data = defaultData ?? this.get();
    const testScenario = data.find((x) => x.id === scenarioId);

    if (testScenario) {
      testScenario.isChecked = checked;

      for (let i = 0; i < testScenario.testCases.length; i++) {
        testScenario.testCases[i].isChecked = checked;
      }

      if (!defaultData) {
        this.set(data);
      }
    }

    return data;
  };

  changeTestScenario = (scenarioId, key, value, defaultData = null) => {
    const data = defaultData ?? this.get();
    const testScenario = data.find((x) => x.id === scenarioId);

    if (testScenario) {
      testScenario[key] = value;

      if (!defaultData) {
        this.set(data);
      }
    }

    return data;
  };
}

const testScenarioAnsCaseService = new TestScenarioAnsCaseService();

window.testScenarioAnsCaseService = testScenarioAnsCaseService;

export default testScenarioAnsCaseService;
