import domainEvents from 'features/shared/domainEvents';
import eventBus from 'features/shared/lib/eventBus';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import testScenarioAnsCaseStorage from './services/TestScenarioAnsCaseStorage';
import workService from './services/workService';

class WorkSyncData extends Component {
  _sync = debounce(async () => {
    this.syncing = true;

    const { testBasis, causeEffects, graph, testCoverage, testDatas, match } = this.props;
    const { projectId, workId } = match.params;

    const testScenariosAndCases = testScenarioAnsCaseStorage.get();

    const data = {
      testBasis,
      causeEffects,
      graph,
      testCoverages: testCoverage,
      testDatas,
      testScenariosAndCases,
    };

    await workService.updateWorkDataAsync(projectId, workId, data);

    this.syncing = false;
  }, 3000);

  constructor(props) {
    super(props);
    this.syncing = false;
  }

  componentDidMount() {
    eventBus.subscribe(this, domainEvents.CAUSEEFFECT_DOMAINEVENT, this._handleEvent);
    eventBus.subscribe(this, domainEvents.TEST_DATA_DOMAINEVENT, this._handleEvent);
    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, this._handleEvent);
    eventBus.subscribe(this, domainEvents.TEST_SCENARIO_DOMAINEVENT, this._handleEvent);
    eventBus.subscribe(this, domainEvents.TESTBASIC_DOMAINEVENT, this._handleEvent);
    eventBus.subscribe(this, domainEvents.TEST_COVERAGE_DOMAINEVENT, this._handleEvent);
  }

  _handleEvent = async () => {
    if (!this.syncing) {
      await this._sync();
    }
  };

  render() {
    return null;
  }
}

WorkSyncData.propTypes = {
  testBasis: PropTypes.shape({ content: PropTypes.string }).isRequired,
  causeEffects: PropTypes.arrayOf(PropTypes.object).isRequired,
  graph: PropTypes.shape({
    graphNodes: PropTypes.arrayOf(PropTypes.object).isRequired,
    graphLinks: PropTypes.arrayOf(PropTypes.object).isRequired,
    constraints: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  testCoverage: PropTypes.shape({}).isRequired,
  testDatas: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const mapStateToProps = (state) => ({
  testBasis: state.work.testBasis,
  causeEffects: state.work.causeEffects,
  graph: state.work.graph,
  testCoverage: state.work.testCoverage,
  testDatas: state.work.testDatas,
});

export default connect(mapStateToProps)(withRouter(WorkSyncData));
