// import testScenarioAnsCaseStorage from 'features/project/work/services/TestScenarioAnsCaseStorage';
import { setTestCoverages } from 'features/project/work/slices/workSlice';
import { COVERAGE_ASPECT } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
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

  constructor(props) {
    super(props);
    this.state = { isPlanning: false };
    this.oldData = {};
  }

  componentDidMount() {
    eventBus.subscribe(this, domainEvents.TEST_SCENARIO_DOMAINEVENT, (event) => {
      this._handleEvents(event.message);
    });

    eventBus.subscribe(this, domainEvents.WORK_MENU_DOMAINEVENT, (event) => {
      this._handleWorkMenuEvents(event);
    });
  }

  componentWillUnmount() {
    eventBus.unsubscribe();
  }

  _setTestCoverages = (data) => {
    const { setTestCoverages } = this.props;
    this._raiseEvent({ action: domainEvents.ACTION.UPDATE });
    setTestCoverages(data);
  };

  isPlanDataChanging = () => {
    const { isPlanning } = this.state;
    const { data } = this.props;

    return !isEqual(this.oldData, data) && isPlanning;
  };

  _raiseEvent = (message) => {
    eventBus.publish(domainEvents.TEST_COVERAGE_DOMAINEVENT, message);
  };

  _calculate = async () => {
    const { graph, testDatas, dbContext } = this.props;

    /* TODO: remove this after finish implement indexedDb
    const testScenariosAndCases = testScenarioAnsCaseStorage.get();

    const testCases = [];
    testScenariosAndCases.forEach((testScenario) => {
      testScenario.testCases.forEach((testCase) =>
        testCases.push({
          ...testCase,
          testScenario: { ...testScenario },
          testDatas: testCase.testDatas,
          results: testCase.results,
        })
      );
    });

    testCoverage.initValue(graph.graphNodes, testCases, testScenariosAndCases, graph.graphLinks, testDatas);

    const data = {};

    Object.keys(COVERAGE_ASPECT).forEach((key) => {
      const result = testCoverage.calculateCoverage(COVERAGE_ASPECT[key]);
      data[COVERAGE_ASPECT[key]] = { actualPercent: toPercent(result), denominator: result.denominator };
    });

    return data;
    */

    if (dbContext && dbContext.db) {
      const { testScenarioSet, testCaseSet } = dbContext;
      const testScenarios = await testScenarioSet.get();
      const testCases = await testCaseSet.get();
      const promises = testScenarios.map(async (testScenario) => {
        const _testScenario = testScenario;
        _testScenario.testCases = await testCaseSet.get(testCaseSet.table.testScenarioId.eq(testScenario.id));
        return _testScenario;
      });
      await Promise.all(promises);
      testCoverage.initValue(graph.graphNodes, testCases, testScenarios, graph.graphLinks, testDatas);

      const data = {};
      Object.keys(COVERAGE_ASPECT).forEach((key) => {
        const result = testCoverage.calculateCoverage(COVERAGE_ASPECT[key]);
        data[COVERAGE_ASPECT[key]] = { actualPercent: toPercent(result), denominator: result.denominator };
      });
      return data;
    }

    return {};
  };

  _recalculate = async () => {
    const result = await this._calculate();
    if (result) {
      const { data } = this.props;

      Object.keys(result).forEach((key) => {
        result[key].planPercent = data[key]?.planPercent;
      });

      this._setTestCoverages(result);
    }
  };

  _handleRevert = () => {
    this._setTestCoverages(cloneDeep(this.oldData));
  };

  _handlePlanChange = (key, value) => {
    const { data } = this.props;
    const _data = cloneDeep(data);

    _data[key].planPercent = value;

    this._setTestCoverages(_data);
  };

  _handlePlan = () => {
    const { isPlanning } = this.state;
    const { data } = this.props;

    if (!isPlanning) {
      this.oldData = cloneDeep(data);
    }

    this.setState({ isPlanning: !isPlanning });
  };

  _handleEvents = (message) => {
    const { isPlanning } = this.state;
    if (message.action === domainEvents.ACTION.ACCEPTGENERATE && !isPlanning) {
      this._recalculate();
    }
  };

  _handleWorkMenuEvents = (event) => {
    const { action } = event.message;
    const { data } = this.props;

    if (action === domainEvents.ACTION.REPORTWORK) {
      this._raiseEvent({
        action: domainEvents.ACTION.REPORTWORK,
        value: { testCoverage: testCoverage.generateReportData(data) },
        receivers: [domainEvents.DES.WORKMENU],
      });
    }
  };

  render() {
    const { isPlanning } = this.state;
    const { data } = this.props;

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
              const value = isPlanning ? data[x.key]?.planPercent : data[x.key]?.actualPercent;
              const kiloValue = kiloFormat(data[x.key]?.denominator);

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
            {this.testCoverageProperties.map((x) => (
              <span key={x.key} className="test-coverage-item">
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
  data: PropTypes.shape({}).isRequired,
  testDatas: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  setTestCoverages: PropTypes.func.isRequired,
  graph: PropTypes.shape({
    graphNodes: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    graphLinks: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    constraints: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  }).isRequired,
  dbContext: PropTypes.oneOfType([PropTypes.object]),
};

TestCoverage.defaultProps = {
  dbContext: null,
};

const mapStateToProps = (state) => ({
  data: state.work.testCoverage,
  graph: state.work.graph,
  testDatas: state.work.testDatas,
  dbContext: state.work.dbContext,
});
const mapDispatchToProps = { setTestCoverages };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TestCoverage));
