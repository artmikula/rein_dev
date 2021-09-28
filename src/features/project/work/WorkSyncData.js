import domainEvents from 'features/shared/domainEvents';
import eventBus from 'features/shared/lib/eventBus';
import { debounce } from 'lodash';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import GlobalContext from 'security/GlobalContext';
import workService from './services/workService';

class WorkSyncData extends Component {
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

  _sync = debounce(async () => {
    this.syncing = true;

    const { testBasis, causeEffects, graph, testCoverage, testDatas, testScenariosAndCases, match } = this.props;
    const { projectId, workId } = match.params;
    const { getToken } = this.context;

    const data = { testBasis, causeEffects, graph, testCoverages: testCoverage, testDatas, testScenariosAndCases };
    await workService.updateWorkDataAsync(getToken(), projectId, workId, data);

    this.syncing = false;
  }, 3000);

  _handleEvent = async () => {
    if (!this.syncing) {
      await this._sync();
    }
  };

  render() {
    return null;
  }
}

const mapStateToProps = (state) => ({
  testBasis: state.work.testBasis,
  causeEffects: state.work.causeEffects,
  graph: state.work.graph,
  testCoverage: state.work.testCoverage,
  testDatas: state.work.testDatas,
  testScenariosAndCases: state.work.testScenariosAndCases,
});

WorkSyncData.contextType = GlobalContext;

export default connect(mapStateToProps)(withRouter(WorkSyncData));
