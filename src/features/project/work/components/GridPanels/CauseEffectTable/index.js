import CauseEffect from 'features/project/work/biz/CauseEffect';
import causeEffectService from 'features/project/work/services/causeEffectService';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import eventBus from 'features/shared/lib/eventBus';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Table } from 'reactstrap';
import GlobalContext from 'security/GlobalContext';
import CauseEffectRow from './CauseEffectRow';
import AbbreviateConfirmContent from './components/AbbreviateConfirmContent';
import './style.scss';

class CauseEffectTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      listData: [],
    };
  }

  async componentDidMount() {
    await this._listData();
    eventBus.subscribe(this, domainEvents.TESTBASIC_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEvent(message);
    });
    eventBus.subscribe(this, domainEvents.GRAPH_ONCHANGE_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEvent(message);
    });
    eventBus.subscribe(this, domainEvents.WORK_MENU_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEvent(message);
    });
    eventBus.subscribe(this, domainEvents.WORK_DATA_COLLECTION, (event) => {
      const { message } = event;
      this._handleEvent(message);
    });
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
  }

  _raiseEvent = (message) => eventBus.publish(domainEvents.CAUSEEFFECT_ONCHANGE_DOMAINEVENT, message);

  _listData = async () => {
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { getToken } = this.context;
    const result = await causeEffectService.listAsync(getToken(), projectId, workId);
    if (result.data) {
      this.setState({ listData: result.data });
    }
  };

  _confirmAbbreviate = (value, similarItem) => {
    const { definition, type } = value;
    const { listData } = this.state;
    const newNode = CauseEffect.createNode(listData, type);

    return window.confirm(
      <AbbreviateConfirmContent
        addDefination={definition}
        addNode={newNode}
        similarDefination={similarItem.definition}
        similarNode={similarItem.node}
      />,
      {
        title: 'Automatic abridged',
        icon: <i className="bi bi-list-stars" />,
        yesAction: () => {
          this._handleAddEvent(value, true);
        },
        noAction: () => {
          this._handleAddEvent(value, false);
        },
      }
    );
  };

  /* Handle event */
  _handleAddEvent = async (value, confirmedAbbreviate = undefined) => {
    const { listData } = this.state;
    let parent = null;
    const checkResult = CauseEffect.checkExistOrSimilarity(value, listData, appConfig);
    // if existed
    if (checkResult.similarItem && checkResult.rate > 100) {
      CauseEffect.alertExistItem();
      this._raiseEvent({ action: domainEvents.ACTION.NOTACCEPT, value });
      return;
    }
    // if found similar
    if (checkResult.similarItem) {
      if (confirmedAbbreviate === undefined) {
        this._confirmAbbreviate(value, checkResult.similarItem);
        return;
      }
      parent = confirmedAbbreviate ? checkResult.similarItem : null;
    }
    // create cause/effect item
    const newItem = CauseEffect.generateCauseEffectItem(listData, value, parent);
    // call api add item
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { getToken } = this.context;
    const result = await causeEffectService.createAsync(getToken(), projectId, workId, newItem);

    if (result.error) {
      this._raiseEvent({ action: domainEvents.ACTION.NOTACCEPT, value: newItem });
      CauseEffect.alertError(result.error);
    } else {
      newItem.id = result.data;
      this.setState((state) => {
        return { listData: [...state.listData, newItem] };
      });
      eventBus.publish(domainEvents.CAUSEEFFECT_ONCHANGE_DOMAINEVENT, {
        action: domainEvents.ACTION.ADD,
        value: newItem,
      });
    }
  };

  _handleDeleteAction = async (item) => {
    const removeList = await this._delete(item);
    if (removeList) {
      removeList.forEach((e) => {
        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: e,
          receivers: [domainEvents.DES.GRAPH, domainEvents.DES.TESTBASIS, domainEvents.DES.TESTDATA],
        });
      });
    }
  };

  _delete = async (item) => {
    const { listData } = this.state;
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { definitionId } = item;
    const data = listData.find((x) => x.definitionId === definitionId);
    if (!data) {
      return false;
    }
    const { id } = data;
    // does not remove merged item
    if (data?.isMerged) {
      window.alert(Language.get('cannotremovemergedefinition'));
      return false;
    }
    const { getToken } = this.context;
    const result = await causeEffectService.deleteAsync(getToken(), projectId, workId, id);
    if (result.error) {
      alert(Language.get('errorwhendeletedefinition'));
      return false;
    }
    const newList = [];
    const removeList = [];
    this.setState((state) => {
      state.listData.forEach((data) => {
        if (data.id === id || data.parent === id) {
          removeList.push(data);
        } else {
          newList.push(data);
        }
      });
      return { listData: newList };
    });

    return removeList;
  };

  _handleRemoveEvent = async (item) => {
    const removeList = await this._delete(item);
    if (removeList) {
      removeList.forEach((e) => {
        const receivers = [domainEvents.DES.GRAPH, domainEvents.DES.TESTDATA];
        if (e.isMerged) {
          receivers.push(domainEvents.DES.TESTBASIS);
        }
        this._raiseEvent({ action: domainEvents.ACTION.ACCEPTDELETE, value: e, receivers });
      });
    }
  };

  _handleUpdateEvent = async (value) => {
    const { listData } = this.state;
    const { match } = this.props;
    const { projectId, workId } = match.params;
    const { definitionId } = value;
    const index = listData.findIndex((e) => e.definitionId === definitionId);
    if (index < 0) {
      return;
    }
    const { id } = listData[index];
    const newItem = { ...listData[index], ...value };
    const { getToken } = this.context;
    const result = await causeEffectService.updateAsync(getToken(), projectId, workId, id, newItem);
    if (result.error) {
      this._raiseEvent({ action: domainEvents.ACTION.NOTACCEPT, value });
      CauseEffect.alertError(result.error);
    } else {
      listData[index] = newItem;
      this.setState({ listData });
    }
  };

  _handleWorkMenuEvent = () => {
    const { listData } = this.state;
    const value = CauseEffect.generateReportData(listData);
    this._raiseEvent({
      action: domainEvents.ACTION.REPORTWORK,
      value,
      receivers: [domainEvents.DES.WORKMENU],
    });
  };

  _handleEvent = async (message) => {
    const { action, value, receivers } = message;
    if (receivers === undefined || receivers.includes(domainEvents.DES.CAUSEEFFECT)) {
      switch (action) {
        case domainEvents.ACTION.ADD:
          await this._handleAddEvent(value);
          break;
        case domainEvents.ACTION.UPDATE:
          await this._handleUpdateEvent(value);
          break;
        case domainEvents.ACTION.REMOVE:
          await this._handleRemoveEvent(value);
          break;
        case domainEvents.ACTION.ACCEPTDELETE:
          this._handleAcceptDeleteEvent(value);
          break;
        case domainEvents.ACTION.REPORTWORK:
          this._handleWorkMenuEvent();
          break;
        case domainEvents.ACTION.COLLECT_REQUEST:
          this._handleDataCollectionRequest();
          break;
        default:
          break;
      }
    }
  };

  _handleDataCollectionRequest = () => {
    const { listData } = this.state;

    this._raiseEvent({ action: domainEvents.ACTION.COLLECT_RESPONSE, value: listData });
  };

  _handleAcceptDeleteEvent = (items) => {
    const { listData } = this.state;
    // get causeEffect need remove
    let removedcauseEffects = listData.filter((x) => items.some((item) => item.nodeId === x.node));
    // get causeEffect need remove include merged causeEffect;
    removedcauseEffects = listData.filter((x) =>
      removedcauseEffects.some(
        (removedcauseEffect) => removedcauseEffect.id === x.parent || removedcauseEffect.id === x.id
      )
    );
    const newListData = listData.filter(
      (x) => !removedcauseEffects.some((removedcauseEffect) => removedcauseEffect === x)
    );

    if (newListData.length !== listData.length) {
      this.setState({ listData: newListData });
      removedcauseEffects.forEach((removedcauseEffect) => {
        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: removedcauseEffect,
          receivers: [domainEvents.DES.TESTBASIS, domainEvents.DES.TESTDATA],
        });
      });
    }
  };

  /* End handle event */
  render() {
    const { listData } = this.state;
    return (
      <Table bordered size="sm" className="border-bottom cause-effect-table">
        <thead className="bg-transparent">
          <tr className="text-primary font-weight-bold">
            <td className="text-right">{Language.get('id')}</td>
            <td>{Language.get('definition')}</td>
            <td>{Language.get('abridged')}</td>
          </tr>
        </thead>
        <tbody>
          <CauseEffectRow rows={CauseEffect.generateData(listData)} onDelete={this._handleDeleteAction} />
        </tbody>
      </Table>
    );
  }
}
CauseEffectTable.propTypes = {
  match: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.bool])).isRequired,
};

CauseEffectTable.contextType = GlobalContext;

export default withRouter(CauseEffectTable);
