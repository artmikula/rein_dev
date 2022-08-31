import domainEvents from 'features/shared/domainEvents';
import saveIcon from 'features/shared/icons/save-icon.svg';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Button, UncontrolledTooltip } from 'reactstrap';
import workService from './services/workService';

const SYNC_STATUS = {
  NONE: 1,
  SYNCING: 2,
  FAILED: 3,
  SUCCESS: 4,
};

class WorkSyncData extends Component {
  _syncDebounce = debounce(() => {
    this.sync();
  }, 30000);

  constructor(props) {
    super(props);
    this.state = { syncStatus: SYNC_STATUS.NONE };
  }

  componentDidMount() {
    eventBus.subscribe(this, domainEvents.CAUSEEFFECT_DOMAINEVENT, this._handleEvent);
    eventBus.subscribe(this, domainEvents.TEST_DATA_DOMAINEVENT, this._handleEvent);
    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, this._handleEvent);
    eventBus.subscribe(this, domainEvents.TESTBASIC_DOMAINEVENT, this._handleEvent);
    eventBus.subscribe(this, domainEvents.TEST_COVERAGE_DOMAINEVENT, this._handleEvent);
  }

  _handleEvent = async () => {
    const { syncStatus } = this.state;
    if (syncStatus !== SYNC_STATUS.SYNCING) {
      await this._syncDebounce();
    }
  };

  sync = async () => {
    this.setState({ syncStatus: SYNC_STATUS.SYNCING });

    const { testBasis, causeEffects, graph, testCoverage, testDatas, match } = this.props;
    const { projectId, workId } = match.params;

    const data = {
      testBasis,
      causeEffects,
      graph,
      testCoverages: testCoverage,
      testDatas,
    };

    const result = await workService.updateWorkDataAsync(projectId, workId, data);
    if (result.error) {
      this.setState({ syncStatus: SYNC_STATUS.FAILED });
    } else {
      this.setState({ syncStatus: SYNC_STATUS.SUCCESS });
    }

    this.statusTimeOut = setTimeout(() => this.setState({ syncStatus: SYNC_STATUS.NONE }), 2000);
  };

  handleClickSaveButton = () => {
    this._syncDebounce.cancel();
    this.sync();
  };

  render() {
    const { syncStatus } = this.state;
    const isSyncing = syncStatus === SYNC_STATUS.SYNCING;
    const tooltipText = isSyncing ? Language.get('savingworkbtntooltip') : Language.get('saveworkbtntooltip');
    let iconClassName = 'central bi bi-arrow-repeat';

    if (isSyncing) {
      iconClassName += ' spinner-border ceta-spinner';
    }

    return (
      <>
        {isSyncing && <span>{Language.get('saving')}</span>}
        {syncStatus === SYNC_STATUS.FAILED && <span className="text-danger">{Language.get('failed')}</span>}
        {syncStatus === SYNC_STATUS.SUCCESS && <span className="text-success">{Language.get('success')}</span>}
        <Button
          color="link"
          size="sm"
          className="icon-btn sm clear-text-decor"
          id="save-work-btn"
          onClick={this.handleClickSaveButton}
          disabled={isSyncing}
        >
          {!isSyncing ? (
            <img src={saveIcon} alt="" style={{ width: '15px', height: '15px' }} />
          ) : (
            <i className={iconClassName} style={{ fontSize: '16px', width: '16px', height: '16px' }} />
          )}
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
  causeEffects: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  graph: PropTypes.shape({
    graphNodes: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    graphLinks: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    constraints: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  }).isRequired,
  testCoverage: PropTypes.shape({}).isRequired,
  testDatas: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
};

const mapStateToProps = (state) => ({
  testBasis: state.work.testBasis,
  causeEffects: state.work.causeEffects,
  graph: state.work.graph,
  testCoverage: state.work.testCoverage,
  testDatas: state.work.testDatas,
});

export default connect(mapStateToProps)(withRouter(WorkSyncData));
