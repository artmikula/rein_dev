import Download from 'downloadjs';
import TestData from 'features/project/work/biz/TestData';
import testDataService from 'features/project/work/services/testDataService';
import {
  CLASSIFY,
  FILE_NAME,
  TESTDATA_TYPE,
  TEST_DATA_SHORTCUT,
  TEST_DATA_SHORTCUT_CODE,
} from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import eventBus from 'features/shared/lib/eventBus';
import { arrayToCsv } from 'features/shared/lib/utils';
import debounce from 'lodash.debounce';
import Mousetrap from 'mousetrap';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { FormGroup, Input, Table } from 'reactstrap';
import ImportForm from './ImportForm';
import './style.scss';

class TestDataTable extends Component {
  _updateTrueFalseData = debounce(async (testData, newList) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;

    const result = await testDataService.updateAsync(projectId, workId, testData);
    if (result.data !== undefined) {
      this._raiseEvent({
        action: domainEvents.ACTION.UPDATE,
        value: { ...newList },
        receivers: [domainEvents.DES.TESTSCENARIOS],
      });
    }
  }, 500);

  constructor(props) {
    super(props);
    this.state = {
      testDatas: [],
      importFormOpen: false,
    };
  }

  async componentDidMount() {
    await this._listData();
    eventBus.subscribe(this, domainEvents.CAUSEEFFECT_ONCHANGE_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleCauseEffectEvents(message);
    });
    eventBus.subscribe(this, domainEvents.TEST_DATA_MENU_DOMAINEVENT, (event) => {
      const { code } = event.message;
      this._handleShortCutEvents(code);
    });
    eventBus.subscribe(this, domainEvents.WORK_MENU_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleWorkMenuEvents(message);
    });
    eventBus.subscribe(this, domainEvents.WORK_DATA_COLLECTION, (event) => {
      const { message } = event;
      this._handleDataCollectionRequest(message);
    });
    TEST_DATA_SHORTCUT.forEach(({ code, shortcutKeys }) => {
      Mousetrap.bind(shortcutKeys.join('+'), (e) => {
        e.preventDefault();
        this._handleShortCutEvents(code);
      });
    });
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
    Mousetrap.reset();
  }

  _handleDataCollectionRequest = () => {
    const { testDatas } = this.state;
    this._raiseEvent({ action: domainEvents.ACTION.COLLECT_RESPONSE, value: testDatas });
  };

  _raiseEvent = (message) => {
    eventBus.publish(domainEvents.TEST_DATA_DOMAINEVENT, message);
  };

  _listData = async () => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const result = await testDataService.listAsync(projectId, workId);
    if (result.data) {
      TestData.set(result.data);
      this.setState({ testDatas: result.data });
    }
  };

  _addData = async (value) => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    if (value.type !== CLASSIFY.CAUSE || value.isMerged) {
      return;
    }
    const data = TestData.createTest(value.node);
    const result = await testDataService.createAsync(projectId, workId, [data]);
    if (result.data) {
      this.setState({ testDatas: TestData.add(data, result.data[0]) });
    }
  };

  _removeData = (value) => {
    this.setState({ testDatas: TestData.remove(value) });
  };

  _updateData = async (index, type, strength = 1) => {
    const { testDatas } = this.state;
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const test = { ...testDatas[index] };
    const strengthCase = appConfig.testData[type].find((x) => x.intensity === strength);
    test.type = type;
    test.strength = strength;
    test.trueDatas = strengthCase?.trueData;
    test.falseDatas = strengthCase?.falseData;

    const result = await testDataService.updateAsync(projectId, workId, test);
    if (result.data !== undefined) {
      const newList = TestData.update(index, test);
      this.setState({ testDatas: [...newList] });

      this._raiseEvent({
        action: domainEvents.ACTION.UPDATE,
        value: { ...newList },
        receivers: [domainEvents.DES.TESTSCENARIOS],
      });
    }
  };

  _onTrueFalseDataChange = async (index, valueType, value) => {
    const { testDatas } = this.state;
    const test = { ...testDatas[index] };
    switch (valueType) {
      case TESTDATA_TYPE.TrueData:
        test.trueDatas = value;
        break;
      case TESTDATA_TYPE.FalseData:
        test.falseDatas = value;
        break;
      default:
        break;
    }

    const newList = TestData.update(index, test);
    this.setState({ testDatas: [...newList] });

    await this._updateTrueFalseData(test, newList);
  };

  _handleCauseEffectEvents = (message) => {
    const { action, value } = message;
    if (action === domainEvents.ACTION.ADD) {
      this._addData(value);
    }
    if (action === domainEvents.ACTION.ACCEPTDELETE) {
      this._removeData(value);
    }
  };

  _exportData = () => {
    const { testDatas } = this.state;
    const { work } = this.props;
    const dataToConvert = testDatas.map((data) => ({
      Cause: data.nodeId,
      Type: data.type,
      Intensity: data.strength,
      'True Data': data.trueDatas,
      'False Data': data.falseDatas,
    }));
    const csvFile = arrayToCsv(dataToConvert);
    Download(csvFile, FILE_NAME.EXPORT_TEST_DATA.replace('workname', work.name), 'text/csv');
  };

  _handleShortCutEvents = (code) => {
    switch (code) {
      case TEST_DATA_SHORTCUT_CODE.EXPORT:
        this._exportData();
        break;
      case TEST_DATA_SHORTCUT_CODE.IMPORT:
        // TODO: import function
        this.setState({ importFormOpen: true });
        break;
      case TEST_DATA_SHORTCUT_CODE.DEFAULT_SETUP:
        console.log('DEFAULT_SETUP');
        break;
      default:
        break;
    }
  };

  _handleWorkMenuEvents = (message) => {
    const { action } = message;
    const { testDatas } = this.state;
    if (action === domainEvents.ACTION.REPORTWORK) {
      this._raiseEvent({
        action: domainEvents.ACTION.REPORTWORK,
        value: { testData: testDatas },
        receivers: [domainEvents.DES.WORKMENU],
      });
    }
  };

  _toggleImportForm() {
    this.setState({
      importFormOpen: false,
    });
  }

  render() {
    const { testDatas, importFormOpen } = this.state;
    const { match } = this.props;
    const { projectId, workId } = match.params;

    return (
      <>
        <Table size="sm" bordered className="test-data-table">
          <thead className="bg-transparent">
            <tr className="text-primary">
              <td className="bg-light-gray">{Language.get('cause')}</td>
              <td>{Language.get('type')}</td>
              <td>{Language.get('intensity')}</td>
              <td>{Language.get('truedata')}</td>
              <td>{Language.get('falsedata')}</td>
            </tr>
          </thead>
          <tbody>
            {testDatas.map((data, testIndex) => (
              <tr key={testIndex}>
                <td className="bg-light-gray">{data.nodeId}</td>
                <td className="position-relative p-0 test-data-type">
                  <FormGroup className="test-data-input">
                    <Input
                      type="select"
                      name="type"
                      bsSize="sm"
                      value={data.type}
                      onChange={(e) => this._updateData(testIndex, e.target.value)}
                    >
                      {Object.keys(appConfig.testData).map((type, index) => (
                        <option key={index} value={type}>
                          {type}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </td>
                <td className="position-relative p-0">
                  {appConfig.testData[data.type] && (
                    <FormGroup className="test-data-input">
                      <Input
                        type="select"
                        name="strength"
                        bsSize="sm"
                        value={data.strength}
                        onChange={(e) => this._updateData(testIndex, data.type, parseInt(e.target.value, 10))}
                      >
                        {appConfig.testData[data.type].map((item, index) => (
                          <option key={index} value={item.intensity}>
                            {item.intensity}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  )}
                </td>
                <td className="position-relative p-0">
                  <FormGroup className="test-data-input">
                    <Input
                      type="text"
                      name="strength"
                      bsSize="sm"
                      value={data.trueDatas ?? ''}
                      onChange={(e) => this._onTrueFalseDataChange(testIndex, TESTDATA_TYPE.TrueData, e.target.value)}
                    />
                  </FormGroup>
                </td>
                <td className="position-relative p-0">
                  <FormGroup className="test-data-input">
                    <Input
                      type="text"
                      name="strength"
                      bsSize="sm"
                      value={data.falseDatas ?? ''}
                      onChange={(e) => this._onTrueFalseDataChange(testIndex, TESTDATA_TYPE.FalseData, e.target.value)}
                    />
                  </FormGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <ImportForm
          isOpenModel={importFormOpen}
          projectId={projectId}
          workId={workId}
          onToggleModal={() => this._toggleImportForm()}
        />
      </>
    );
  }
}
TestDataTable.propTypes = {
  match: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.bool])).isRequired,
};

const mapStateToProps = (state) => ({
  work: state.work,
});
export default connect(mapStateToProps)(withRouter(TestDataTable));
