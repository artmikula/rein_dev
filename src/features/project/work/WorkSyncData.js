import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Button, UncontrolledTooltip } from 'reactstrap';
import testScenarioAnsCaseStorage from './services/TestScenarioAnsCaseStorage';
import workService from './services/workService';

class WorkSyncData extends Component {
  _syncDebounce = debounce(() => {
    this.sync();
  }, 5000);

  constructor(props) {
    super(props);
    this.state = { syncing: false };
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
    const { syncing } = this.state;
    if (!syncing) {
      await this._syncDebounce();
    }
  };

  sync = async () => {
    this.setState({ syncing: true });

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

    this.setState({ syncing: false });
  };

  handleClickSaveButton = () => {
    this._syncDebounce.cancel();
    this.sync();
  };

  render() {
    const { syncing } = this.state;
    const iconClassName = syncing ? 'bi bi-arrow-repeat spinner-border ceta-spinner' : 'bi bi-arrow-repeat';
    const tooltipText = syncing ? Language.get('savingworkbtntooltip') : Language.get('saveworkbtntooltip');

    return (
      <>
        <Button
          color="link"
          size="sm"
          style={{ padding: '1.5px 6px' }}
          className="icon-btn clear-text-decor"
          id="save-work-btn"
          onClick={this.handleClickSaveButton}
          disabled={syncing}
        >
          <i className={iconClassName} style={{ fontSize: '18px', width: '18px', height: '18px' }} />
        </Button>
        <UncontrolledTooltip target="save-work-btn">
          <small>{tooltipText}</small>
        </UncontrolledTooltip>
      </>
    );
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
