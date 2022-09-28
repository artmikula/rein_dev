import { pdf } from '@react-pdf/renderer';
import Download from 'downloadjs';
import TestScenarioHelper from 'features/project/work/biz/TestScenario/TestScenarioHelper';
import TestCase from 'features/project/work/biz/TestCase';
import TestCoverage from 'features/project/work/biz/TestCoverage';
import CauseEffect from 'features/project/work/biz/CauseEffect';
import CreateForm from 'features/project/work/components/CreateForm';
import ImportForm from 'features/project/work/components/ImportForm';
import workService from 'features/project/work/services/workService';
import { setGeneratingReport } from 'features/project/work/slices/workSlice';
import { ReportDocument, SearchComponent, SubMenu } from 'features/shared/components';
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
import WorkList from './WorkList';

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
  }

  componentDidMount() {
    this._getRecentWorks();
    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, (event) => {
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
    try {
      const { dbContext, testDatas, testCoverage, causeEffects, graph } = this.props;
      const { action, value, receivers } = event.message;
      if (!dbContext || !dbContext.db) {
        alert('Cannot access to database. Please reload and try again', { error: true });
        return;
      }
      if (receivers && receivers.includes(domainEvents.DES.WORKMENU) && action === domainEvents.ACTION.REPORTWORK) {
        const reportData = {
          testData: testDatas,
          testCoverage: TestCoverage.generateReportData(testCoverage),
          causeEffect: CauseEffect.generateReportData(causeEffects),
          graph: value,
        };
        const { testScenarioSet, testCaseSet } = dbContext;
        const testScenarios = await testScenarioSet.get();
        const dataColumns = TestScenarioHelper.convertToColumns(graph.graphNodes, Language);
        const promises = testScenarios.map(async (testScenario) => {
          const _testScenario = testScenario;
          _testScenario.testCases = await testCaseSet.get(testCaseSet.table.testScenarioId.eq(testScenario.id));
          return _testScenario;
        });

        const testScenariosAndCases = await Promise.all(promises);
        const dataRows = await TestScenarioHelper.convertToRows(
          testScenariosAndCases,
          testScenarios,
          dataColumns,
          graph.graphNodes
        );
        reportData.testScenariosAndCases = TestCase.generateReportData(dataRows);
        this._handleReportWork(reportData);
      }
    } catch (error) {
      console.log('err', error);
      alert('Cannot get report data!', { error: true });
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
          const modalProps = {
            title: Language.get('workexplorertitle'),
            content: (
              <Router history={history}>
                <WorkList projectId={projectId} />
              </Router>
            ),
            actions: null,
          };
          window.modal(modalProps);
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
  graph: PropTypes.shape({
    graphNodes: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    graphLinks: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
    constraints: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  }).isRequired,
  testDatas: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  testCoverage: PropTypes.oneOfType([PropTypes.object]).isRequired,
  causeEffects: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
  dbContext: PropTypes.oneOfType([PropTypes.object]),
};

WorkMenu.defaultProps = {
  dbContext: null,
};

const mapStateToProps = (state) => ({
  workName: state.work.name,
  projectName: state.work.projectName,
  workVersion: state.work.version,
  graph: state.work.graph,
  dbContext: state.work.dbContext,
  testDatas: state.work.testDatas,
  testCoverage: state.work.testCoverage,
  causeEffects: state.work.causeEffects,
});
const mapDispatchToProps = { setGeneratingReport };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(WorkMenu));
