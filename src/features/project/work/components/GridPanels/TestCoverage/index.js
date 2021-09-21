import constraintService from 'features/project/work/services/constraintService';
import graphLinkService from 'features/project/work/services/graphLinkService';
import graphNodeService from 'features/project/work/services/graphNodeService';
import testCoverageService from 'features/project/work/services/testCoverageService';
import testDataService from 'features/project/work/services/testDataService';
import testScenarioService from 'features/project/work/services/testScenarioService';
import { COVERAGE_ASPECT } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import cloneDeep from 'lodash.clonedeep';
import debounce from 'lodash.debounce';
import isEqual from 'lodash.isequal';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import testCoverage from '../../../biz/TestCoverage';
import PlanButton from './component/PlanButton';
import Range from './component/Range';
import RefreshButton from './component/RefreshButton';
import RevertButton from './component/RevertButton';
import './style.scss';
import { kiloFormat, toPercent } from './utils';

class TestCoverage extends Component {
  testCoverageProperties = [
    { label: Language.get('testcase'), key: COVERAGE_ASPECT.TestCase },
    { label: Language.get('cause'), key: COVERAGE_ASPECT.Cause },
    { label: Language.get('causetestdata'), key: COVERAGE_ASPECT.CauseTestData },
    { label: Language.get('effect'), key: COVERAGE_ASPECT.Effect },
    { label: Language.get('complexlogicalrelation'), key: COVERAGE_ASPECT.ComplexLogicalRelation },
    { label: Language.get('scenario'), key: COVERAGE_ASPECT.Scenario },
    { label: Language.get('basescenario'), key: COVERAGE_ASPECT.BaseScenario },
    { label: Language.get('validscenario'), key: COVERAGE_ASPECT.ValidScenario },
    { label: Language.get('invalidscenario'), key: COVERAGE_ASPECT.InvalidScenario },
  ];

  defaultTestCoverageData = {
    [COVERAGE_ASPECT.TestCase]: { actualPercent: 0, planPercent: 0, denominator: 0 },
    [COVERAGE_ASPECT.Cause]: { actualPercent: 0, planPercent: 0, denominator: 0 },
    [COVERAGE_ASPECT.CauseTestData]: { actualPercent: 0, planPercent: 0, denominator: 0 },
    [COVERAGE_ASPECT.Effect]: { actualPercent: 0, planPercent: 0, denominator: 0 },
    [COVERAGE_ASPECT.ComplexLogicalRelation]: { actualPercent: 0, denominator: 0 },
    [COVERAGE_ASPECT.Scenario]: { actualPercent: 0, planPercent: 0, denominator: 0 },
    [COVERAGE_ASPECT.BaseScenario]: { actualPercent: 0, planPercent: 0, denominator: 0 },
    [COVERAGE_ASPECT.ValidScenario]: { actualPercent: 0, planPercent: 0, denominator: 0 },
    [COVERAGE_ASPECT.InvalidScenario]: { actualPercent: 0, planPercent: 0, denominator: 0 },
  };

  _saveData = debounce(async (data) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const result = await testCoverageService.createUpdateAsync(projectId, workId, data);
    if (result.error) {
      alert(result.error);
    }
  }, 300);

  constructor(props) {
    super(props);
    this.state = {
      isPlanning: false,
      data: cloneDeep(this.defaultTestCoverageData),
    };
    this.oldData = {};
  }

  componentDidMount() {
    eventBus.subscribe(this, domainEvents.TEST_SCENARIO_DOMAINEVENT, (event) => {
      this._handleEvents(event.message);
    });
    eventBus.subscribe(this, domainEvents.WORK_MENU_DOMAINEVENT, (event) => {
      this._handleWorkMenuEvents(event);
    });
    eventBus.subscribe(this, domainEvents.WORK_DATA_COLLECTION, (event) => {
      const { message } = event;
      this._handleDataCollectionRequest(message);
    });
    this._getData();
  }

  componentWillUnmount() {
    eventBus.unsubscribe();
  }

  isPlanDataChanging = () => {
    const { data, isPlanning } = this.state;
    return !isEqual(this.oldData, data) && isPlanning;
  };

  _handleDataCollectionRequest = () => {
    const { data } = this.state;
    this._raiseEvent(domainEvents.ACTION.COLLECT_RESPONSE, data);
  };

  _raiseEvent = (action, value) => {
    eventBus.publish(domainEvents.TEST_COVERAGE_ONCHANGE_DOMAINEVENT, { action, value });
  };

  _calculate = async () => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const graphNodeResult = await graphNodeService.getListAsync(projectId, workId);
    const graphLinkResult = await graphLinkService.getListAsync(projectId, workId);
    const constraintResult = await constraintService.getListAsync(projectId, workId);
    const testDataResult = await testDataService.listAsync(projectId, workId);
    const testScenarioResult = await testScenarioService.getListAsync(projectId, workId);
    if (
      graphNodeResult.data &&
      graphLinkResult.data &&
      constraintResult.data &&
      testDataResult.data &&
      testScenarioResult.data
    ) {
      const testCases = [];
      testScenarioResult.data.forEach((testScenario) => {
        testScenario.testCases.forEach((testCase) =>
          testCases.push({
            ...testCase,
            testScenario: { ...testScenario },
            testDatas: JSON.parse(testCase.testDatas),
            results: JSON.parse(testCase.results),
          })
        );
      });

      testCoverage.initValue(
        graphNodeResult.data,
        testCases,
        testScenarioResult.data,
        graphLinkResult.data,
        testDataResult.data
      );

      const data = {};

      Object.keys(COVERAGE_ASPECT).forEach((key) => {
        const result = testCoverage.calculateCoverage(COVERAGE_ASPECT[key]);
        data[COVERAGE_ASPECT[key]] = { actualPercent: toPercent(result), denominator: result.denominator };
      });

      return data;
    }

    return null;
  };

  _recalculate = async () => {
    const result = await this._calculate();
    if (result) {
      const { data } = this.state;
      Object.keys(result).forEach((key) => {
        result[key].planPercent = data[key].planPercent;
      });
      this.setState({ data: result });
      this._saveData(result);
    }
  };

  _handleRevert = () => {
    this.setState({ data: cloneDeep(this.oldData) });
  };

  _handlePlanChange = (key, value) => {
    const { data } = this.state;
    const _data = cloneDeep(data);
    _data[key].planPercent = value;
    this.setState({ data: _data }, async () => {
      this._saveData(_data);
    });
  };

  _handlePlan = async () => {
    const { isPlanning, data } = this.state;
    if (!isPlanning) {
      this.oldData = cloneDeep(data);
    }
    this.setState({ isPlanning: !isPlanning });
  };

  _handleEvents = async (message) => {
    const { isPlanning } = this.state;
    if (message.action === domainEvents.ACTION.ACCEPTGENERATE && !isPlanning) {
      await this._recalculate();
    }
  };

  _handleWorkMenuEvents = (event) => {
    const { action } = event.message;
    const { data } = this.state;
    if (action === domainEvents.ACTION.REPORTWORK) {
      eventBus.publish(domainEvents.TEST_COVERAGE_ONCHANGE_DOMAINEVENT, {
        action: domainEvents.ACTION.REPORTWORK,
        value: { testCoverage: testCoverage.generateReportData(data) },
        receivers: [domainEvents.DES.WORKMENU],
      });
    }
  };

  _getData = async () => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const result = await testCoverageService.getAsync(projectId, workId);
    if (result.error) {
      alert(result.error);
    } else if (result.data) {
      this.setState({ data: cloneDeep(result.data) });
    }
  };

  render() {
    const { data, isPlanning } = this.state;

    return (
      <div className="d-flex test-coverage-container pt-3 text-muted">
        <div className="d-flex flex-column align-items-center px-3">
          <RefreshButton className="my-2" enable={!isPlanning} onClick={this._recalculate} />
          <div className="border-top my-1 divider" />
          <PlanButton className="my-2" enable={isPlanning} onClick={this._handlePlan} />
          <p className="mb-0 text-uppercase">{Language.get('planning')}</p>
          <div className="border-top mt-2 mb-1 divider" />
          <RevertButton className="my-2" enable={this.isPlanDataChanging()} onClick={this._handleRevert} />
        </div>
        <div className="d-flex flex-column flex-grow-1 pr-3 scrollbar-sm overflow-auto">
          <div className="d-flex flex-grow-1">
            {this.testCoverageProperties.map((x) => {
              const value = isPlanning ? data[x.key].planPercent : data[x.key].actualPercent;
              const kiloValue = kiloFormat(data[x.key].denominator);
              return (
                <Range
                  key={x.key}
                  value={value}
                  onChange={(value) => this._handlePlanChange(x.key, value)}
                  className="test-coverage-item"
                  editable={isPlanning}
                  kiloValue={kiloValue}
                />
              );
            })}
          </div>
          <div className="d-flex mt-2 mb-3">
            {this.testCoverageProperties.map((x, index) => (
              <span key={index} className="test-coverage-item">
                {x.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

TestCoverage.propTypes = {
  match: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.bool])).isRequired,
};

export default withRouter(TestCoverage);
