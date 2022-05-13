import { pdf } from '@react-pdf/renderer';
import Download from 'downloadjs';
import CreateForm from 'features/project/work/components/CreateForm';
import ImportForm from 'features/project/work/components/ImportForm';
import workService from 'features/project/work/services/workService';
import { setGeneratingReport } from 'features/project/work/slices/workSlice';
import { ReportDocument, SearchComponent, SubMenu } from 'features/shared/components';
import WorkList from 'features/shared/components/WorkList';
import { FILE_NAME } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import eventBus from 'features/shared/lib/eventBus';
import debounce from 'lodash.debounce';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Router } from 'react-router';
import { withRouter } from 'react-router-dom';
import WorkLink from './WorkLink';

class WorkMenu extends Component {
  _handleSearch = debounce((searchValue) => {
    this._searchWorks(searchValue);
  }, 300);

  constructor(props) {
    super(props);
    this.state = {
      recentWorks: [],
      searchWorks: [],
      createFormOpen: false,
      importFormOpen: false,
    };
    this.reportWorkData = { numCollectedData: 5 };
  }

  componentDidMount() {
    this._getRecentWorks();
    eventBus.subscribe(this, domainEvents.CAUSEEFFECT_DOMAINEVENT, (event) => {
      this._handleReportEvent(event);
    });
    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, (event) => {
      this._handleReportEvent(event);
    });
    eventBus.subscribe(this, domainEvents.TEST_COVERAGE_DOMAINEVENT, (event) => {
      this._handleReportEvent(event);
    });
    eventBus.subscribe(this, domainEvents.TEST_SCENARIO_DOMAINEVENT, (event) => {
      this._handleReportEvent(event);
    });
    eventBus.subscribe(this, domainEvents.TEST_DATA_DOMAINEVENT, (event) => {
      this._handleReportEvent(event);
    });
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
  }

  _confirmDelete = () => {
    const { match, history } = this.props;
    const { projectId, workId } = match.params;

    workService.deleteAsync(projectId, workId).then(() => {
      history.push(`/project/${projectId}/works`);
    });
  };

  _handleReportWork = (data) => {
    const { setGeneratingReport } = this.props;
    setGeneratingReport(true);
    // PDF generating block UI rendering -> delay 1s to render loading
    setTimeout(() => this._generateReport(data), 1000);
  };

  _generateReport = async (data) => {
    const { workName, projectName, workVersion, setGeneratingReport } = this.props;
    const reportData = {
      projectName,
      workName,
      functionName: workName,
      version: workVersion,
      reporter: '',
      reviewer: '',
      approver: '',
      causes: [],
      effects: [],
      inspections: [],
      testCoverage: [],
      testData: [],
      testCases: [],
      testScenarios: [],
      ...data,
    };
    reportData.workName = workName;
    reportData.testCases.forEach((e) => {
      const testCase = e;
      testCase.causes = reportData.causes.map((cause) => ({ ...cause, type: testCase[cause.node] }));
    });

    const blob = await pdf(ReportDocument(reportData)).toBlob();
    Download(blob, FILE_NAME.REPORT_WORK.replace('workname', workName));
    setGeneratingReport(false);
  };

  _handleReportEvent = async (event) => {
    const { action, value, receivers } = event.message;
    if (receivers && receivers.includes(domainEvents.DES.WORKMENU) && action === domainEvents.ACTION.REPORTWORK) {
      this.reportWorkData = { ...this.reportWorkData, ...value };
      this.reportWorkData.numCollectedData -= 1;
      if (this.reportWorkData.numCollectedData === 0) {
        this._handleReportWork(this.reportWorkData);
        this.reportWorkData = { numCollectedData: 5 };
      }
    }
  };

  _searchWorks = (searchValue) => {
    const { match } = this.props;
    const { projectId } = match.params;

    workService.listAsync(projectId, 1, 10, searchValue).then((response) => {
      this.setState({ searchWorks: response.items });
    });
  };

  _getRecentWorks = () => {
    const { match } = this.props;
    const { projectId } = match.params;

    workService.listAsync(projectId, 1, 5).then((response) => {
      this.setState({ recentWorks: response.items });
    });
  };

  _toggleCreateForm = (state) => {
    this.setState({ createFormOpen: state });
  };

  _toggleImportForm = (state) => {
    this.setState({ importFormOpen: state });
  };

  render() {
    const { recentWorks, searchWorks, createFormOpen, importFormOpen } = this.state;
    const { match, history } = this.props;
    const { projectId, workId } = match.params;
    const actions = [
      {
        key: 1,
        text: Language.get('new'),
        action: () => {
          this._toggleCreateForm(true);
        },
      },
      {
        key: 2,
        text: Language.get('import'),
        action: () => {
          this._toggleImportForm(true);
        },
      },
      {
        key: 3,
        text: Language.get('export'),
        action: async () => {
          const response = await workService.exportAsync(projectId, workId);
          if (response.data) {
            const fileContentString = atob(response.data.body);
            Download(
              fileContentString,
              response.data.headers.fileDownloadName[0],
              response.data.headers.contentType[0]
            );
          }
        },
      },
      {
        key: 4,
        text: Language.get('report'),
        action: () => {
          eventBus.publish(domainEvents.WORK_MENU_DOMAINEVENT, { action: domainEvents.ACTION.REPORTWORK });
        },
      },
      {
        key: 5,
        text: Language.get('delete'),
        action: () => {
          window.confirm(undefined, { yesAction: this._confirmDelete });
        },
      },
      {
        key: 5,
        text: Language.get('explorer'),
        action: () => {
          const modaProps = {
            title: Language.get('workexplorertitle'),
            content: (
              <Router history={history}>
                <div className="px-3 py-2">
                  <WorkList projectId={projectId} />
                </div>
              </Router>
            ),
            actions: null,
          };
          window.modal(modaProps);
        },
      },
    ];
    return (
      <>
        <SubMenu
          actions={actions}
          content={
            <SearchComponent
              recentTitle={Language.get('recentworks')}
              recentData={recentWorks}
              searchData={searchWorks}
              onSearch={this._handleSearch}
              renderItem={(item) => <WorkLink {...item} />}
              getItemKey={(item) => item.id}
            />
          }
        />
        <CreateForm
          isOpenModel={createFormOpen}
          onToggleModal={() => this._toggleCreateForm(false)}
          onSuccess={() => this._toggleCreateForm(false)}
        />
        <ImportForm
          isOpenModel={importFormOpen}
          onToggleModal={() => this._toggleImportForm(false)}
          projectId={projectId}
        />
      </>
    );
  }
}

WorkMenu.propTypes = {
  workName: PropTypes.string.isRequired,
  projectName: PropTypes.string.isRequired,
  workVersion: PropTypes.string.isRequired,
  setGeneratingReport: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  workName: state.work.name,
  projectName: state.work.projectName,
  workVersion: state.work.version,
});
const mapDispatchToProps = { setGeneratingReport };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(WorkMenu));
