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
        testCase.isSelected = checked;
        testScenario.isSelected = !testScenario.testCases.some((x) => !x.isSelected);

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
      testScenario.isSelected = checked;

      for (let i = 0; i < testScenario.testCases.length; i++) {
        testScenario.testCases[i].isSelected = checked;
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
