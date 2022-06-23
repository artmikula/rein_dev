/* eslint-disable max-lines */
import CauseEffect from 'features/project/work/biz/CauseEffect';
import { setCauseEffects } from 'features/project/work/slices/workSlice';
import domainEvents from 'features/shared/domainEvents';
import Language from 'features/shared/languages/Language';
import appConfig from 'features/shared/lib/appConfig';
import eventBus from 'features/shared/lib/eventBus';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Table } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import AbbreviateConfirmContent from './components/AbbreviateConfirmContent';
import CauseEffectRow from './components/CauseEffectRow';
import './style.scss';

class CauseEffectTable extends Component {
  state = {
    removedCauseEffects: [],
  };

  mergeItem = null;

  componentDidMount() {
    eventBus.subscribe(this, domainEvents.TESTBASIC_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEvent(message);
    });
    eventBus.subscribe(this, domainEvents.GRAPH_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEvent(message);
    });
    eventBus.subscribe(this, domainEvents.WORK_MENU_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEvent(message);
    });
  }

  componentWillUnmount() {
    eventBus.unsubscribe(this);
  }

  _raiseEvent = (message) => {
    console.log('message', message);

    eventBus.publish(domainEvents.CAUSEEFFECT_DOMAINEVENT, message);
  };

  _confirmAbbreviate = (value, similarItem) => {
    const { definition, type } = value;
    const { listData } = this.props;
    const newNode = CauseEffect.createNode(listData, type);

    const confirmModal = window.confirm(
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
          this._handleAddEvent([value], true);
        },
        noAction: () => {
          this._handleAddEvent([value], false);
        },
      }
    );

    return confirmModal;
  };

  /* Handle event */
  _handleAddEvent = async (data, confirmedAbbreviate = undefined) => {
    const { setCauseEffects } = this.props;
    let { listData } = this.props;
    const result = [];
    this.needConfirm = false;

    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      let parent = null;
      if (data.length === 1) {
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
      }
      // create cause/effect item and set id
      const newItem = CauseEffect.generateCauseEffectItem(listData, value, parent);
      newItem.id = uuidv4();
      result.push(newItem);
      listData = [...listData, newItem];
    }

    this._raiseEvent({ action: domainEvents.ACTION.ADD, value: result });
    setCauseEffects(listData);
  };

  _handleReCreateEvent = (data) => {
    const { removedCauseEffects } = this.state;
    const { setCauseEffects, listData } = this.props;
    const result = [];
    const causeEffects = listData.slice();
    const existedRemovedCauseEffects = removedCauseEffects.filter((removedCauseEffect) =>
      data.some((item) => item.definitionId === removedCauseEffect.definitionId)
    );
    console.log('removedCauseEffects', removedCauseEffects);
    console.log('existedRemovedCauseEffects', existedRemovedCauseEffects);
    this.needConfirm = false;

    const newCauseEffects = removedCauseEffects.filter((removedCauseEffect) =>
      listData.some((causeEffect) => causeEffect.node !== removedCauseEffect.node)
    );

    for (let i = 0; i < newCauseEffects.length; i++) {
      const value = newCauseEffects[i];
      if (newCauseEffects.length === 1) {
        const checkResult = CauseEffect.checkExistOrSimilarity(value, listData, appConfig);
        // if existed
        if (checkResult.similarItem && checkResult.rate > 100) {
          CauseEffect.alertExistItem();
          this._raiseEvent({ action: domainEvents.ACTION.NOTACCEPT, value });
          return;
        }
        // if found similar
        if (checkResult.similarItem) {
          // if (confirmedAbbreviate === undefined) {
          //   this._confirmAbbreviate(value, checkResult.similarItem);
          //   return;
          // }
        }
      }
      // create cause/effect item and set id
      result.push(value);
      causeEffects.push(value);
    }

    this._raiseEvent({ action: domainEvents.ACTION.RECREATE, value: result });
    setCauseEffects(causeEffects);
  };

  _handleDeleteAction = (item) => {
    const removeList = this._delete(item);

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

  _delete = (item) => {
    const { listData, setCauseEffects } = this.props;
    const { definitionId } = item;
    const data = listData.find((x) => x.definitionId === definitionId);
    if (!data) {
      return false;
    }
    // does not remove merged item
    if (data?.isMerged) {
      window.alert(Language.get('cannotremovemergedefinition'));
      return false;
    }

    const { id } = data;
    const newList = [];
    const removeList = [];

    listData.forEach((data) => {
      if (data.id === id || data.parent === id) {
        removeList.push(data);
      } else {
        newList.push(data);
      }
    });

    setCauseEffects(newList);

    return removeList;
  };

  _handleRemoveEvent = (item) => {
    const removeList = this._delete(item);
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

  _handleUpdateEvent = (value) => {
    const { listData, setCauseEffects } = this.props;
    const { definitionId, definition } = value;
    const index = listData.findIndex((e) => e.definitionId === definitionId);

    if (index < 0) {
      return;
    }

    const newItem = { ...listData[index], definition };
    const newList = [...listData];
    newList[index] = newItem;

    setCauseEffects(newList);
    this._raiseEvent({ action: domainEvents.ACTION.UPDATE, value: newItem });
  };

  _handleWorkMenuEvent = () => {
    const { listData } = this.props;
    const value = CauseEffect.generateReportData(listData);
    this._raiseEvent({
      action: domainEvents.ACTION.REPORTWORK,
      value,
      receivers: [domainEvents.DES.WORKMENU],
    });
  };

  _handleEvent = (message) => {
    const { action, value, receivers } = message;
    if (receivers === undefined || receivers.includes(domainEvents.DES.CAUSEEFFECT)) {
      switch (action) {
        case domainEvents.ACTION.ADD:
          this._handleAddEvent(value);
          break;
        case domainEvents.ACTION.RECREATE:
          this._handleReCreateEvent(value);
          break;
        case domainEvents.ACTION.UPDATE:
          this._handleUpdateEvent(value);
          break;
        case domainEvents.ACTION.REMOVE:
          this._handleRemoveEvent(value);
          break;
        case domainEvents.ACTION.ACCEPTDELETE:
          this._handleAcceptDeleteEvent(value);
          break;
        case domainEvents.ACTION.REPORTWORK:
          this._handleWorkMenuEvent();
          break;
        default:
          break;
      }
    }
  };

  _handleInsertCauses = (data) => {
    const { setCauseEffects } = this.props;
    let { listData } = this.props;
    const causes = [];
    data.forEach((item) => {
      const cause = CauseEffect.generateCauseEffectItem(listData, item);
      causes.push(cause);
      listData = [...listData, cause];
    });

    setCauseEffects(listData);
    this._raiseEvent({ action: domainEvents.ACTION.ADD, value: causes });
  };

  // /**
  //  * @type items
  //  * @param {*} items: IGraphNode[]
  //  */
  _handleAcceptDeleteEvent = (items) => {
    const { listData, setCauseEffects } = this.props;
    // get causeEffect need remove
    let removedCauseEffects = listData.filter((x) =>
      items.some(
        (item) => item.nodeId === x.node && (!this.mergeItem || (this.mergeItem && item.nodeId !== this.mergeItem.node))
      )
    );

    // get causeEffect need remove include merged causeEffect;
    removedCauseEffects = listData.filter((x) =>
      removedCauseEffects.some(
        (removedCauseEffect) => removedCauseEffect.id === x.parent || removedCauseEffect.id === x.id
      )
    );
    const newListData = listData.filter(
      (x) => !removedCauseEffects.some((removedCauseEffect) => removedCauseEffect === x)
    );

    if (newListData.length !== listData.length) {
      setCauseEffects(newListData);
      this.setState({ removedCauseEffects });

      removedCauseEffects.forEach((removedCauseEffect) => {
        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: removedCauseEffect,
          receivers: [domainEvents.DES.TESTBASIS, domainEvents.DES.TESTDATA],
        });
      });
    }
  };

  _handleMerge = (mergeId, parentId) => {
    const { listData, setCauseEffects } = this.props;

    const mergeItem = listData.find((x) => x.id === mergeId);
    const parentItem = listData.find((x) => x.id === parentId);

    this.mergeItem = mergeItem;

    if (mergeItem && parentItem && mergeItem.type === parentItem.type && !parentItem.isMerged) {
      const newListData = [...listData];
      const mergeIndex = newListData.findIndex((x) => x.id === mergeItem.id);

      if (mergeIndex > -1) {
        newListData.forEach((x, index) => {
          if (x.isMerged && x.parent === mergeItem.id) {
            newListData[index] = { ...x, id: uuidv4(), isMerged: true, parent: parentItem.id };
          }
        });

        const newItem = { ...mergeItem, id: uuidv4(), isMerged: true, parent: parentItem.id };

        newListData[mergeIndex] = newItem;
        setCauseEffects(newListData);

        this._raiseEvent({
          action: domainEvents.ACTION.ACCEPTDELETE,
          value: mergeItem,
          receivers: [domainEvents.DES.GRAPH, domainEvents.DES.TESTDATA],
        });

        const alertContent = Language.get('abridgealert')
          .replace(/mergeNode/g, mergeItem.node)
          .replace(/parentNode/g, parentItem.node);

        alert(alertContent, { info: true });
      }

      this.mergeItem = null;
    }
  };

  handleUnabridge = (id) => {
    const { listData, setCauseEffects } = this.props;
    const index = listData.findIndex((x) => x.id === id);

    if (index !== -1 && listData[index].isMerged) {
      const newItem = { ...listData[index], isMerged: false };
      const newListData = [...listData];

      newListData[index] = newItem;
      setCauseEffects(newListData);

      this._raiseEvent({
        action: domainEvents.ACTION.ADD,
        value: [newItem],
        receivers: [domainEvents.DES.TESTDATA],
      });
    }
  };

  handleEditNode = (id, newNode) => {
    const { listData, setCauseEffects } = this.props;

    if (listData.find((x) => x.node === newNode)) {
      const alertContent = Language.get('exitednodealert').replace(/newNode/g, newNode);

      alert(alertContent, { error: true });

      return;
    }

    const index = listData.findIndex((x) => x.id === id);

    if (index !== -1) {
      const oldNode = listData[index].node;
      const newItem = { ...listData[index], node: newNode };
      const newListData = [...listData];

      newListData[index] = newItem;
      setCauseEffects(newListData);

      this._raiseEvent({
        action: domainEvents.ACTION.CHANGE_NODE_ID,
        value: { oldNode, newNode },
        receivers: [domainEvents.DES.TESTDATA, domainEvents.DES.GRAPH],
      });
    }
  };

  handleReorder = (...arg) => {
    const { listData, setCauseEffects } = this.props;
    setCauseEffects(CauseEffect.reorder(listData, ...arg));
  };

  /* End handle event */
  render() {
    const { listData } = this.props;
    const rows = CauseEffect.generateData(listData);

    return (
      <Table bordered size="sm" className="border-bottom cause-effect-table">
        <thead className="bg-transparent">
          <tr className="text-primary font-weight-bold">
            <td className="text-right">{Language.get('id')}</td>
            <td>{Language.get('definition')}</td>
            <td> {Language.get('abridged')}</td>
          </tr>
        </thead>

        <tbody>
          {rows.map((item) => (
            <CauseEffectRow
              key={item.id}
              data={item}
              onDelete={this._handleDeleteAction}
              onMerge={this._handleMerge}
              onUnabridge={this.handleUnabridge}
              onEditNode={this.handleEditNode}
              onReorder={this.handleReorder}
            />
          ))}
        </tbody>
      </Table>
    );
  }
}

CauseEffectTable.propTypes = {
  setCauseEffects: PropTypes.func.isRequired,
  listData: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object)]).isRequired,
};

const mapStateToProps = (state) => ({ listData: state.work.causeEffects });
const mapDispatchToProps = { setCauseEffects };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(CauseEffectTable));
