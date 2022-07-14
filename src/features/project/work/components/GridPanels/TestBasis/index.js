/* eslint-disable max-lines */
import {
  CompositeDecorator,
  convertFromRaw,
  convertToRaw,
  Editor,
  EditorState,
  getVisibleSelectionRect,
  Modifier,
  RichUtils,
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import TestBasisManager from 'features/project/work/biz/TestBasis';
import { setTestBasis } from 'features/project/work/slices/workSlice';
import { pushActionStates } from 'features/project/work/slices/undoSlice';
import { STRING, TEST_BASIS_EVENT_TYPE, EVENT_LISTENER_LIST, UNDO_STACKS } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import eventBus from 'features/shared/lib/eventBus';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import ClassifyPopover from './ClassifyPopover';
import DecoratedText from './DecoratedText';
import StyleControlEditor from './StyleControlEditor';

class TestBasis extends Component {
  constructor(props) {
    super(props);
    this.ready = false;
    this.state = {
      isOpenClassifyPopover: false,
      editorState: EditorState.createEmpty(this._compositeDecorator()),
      selectionState: null,
      type: TEST_BASIS_EVENT_TYPE.DEFAULT,
      cutState: {
        entities: [],
        selection: null,
      },
      currIndex: -1,
    };
    this.initiatedTestBasis = false;
  }

  componentDidMount() {
    eventBus.subscribe(this, domainEvents.CAUSEEFFECT_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEventBus(message);
    });
    eventBus.subscribe(this, domainEvents.REIN_MENU_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEventBus(message);
    });

    window.addEventListener(EVENT_LISTENER_LIST.CUT, () => this.setState({ type: TEST_BASIS_EVENT_TYPE.CUT }));
    window.addEventListener(EVENT_LISTENER_LIST.KEYDOWN, (e) => this._handleKeyDownEvent(e));

    this._initTestBasis();
    this.ready = true;
  }

  componentDidUpdate() {
    this._initTestBasis();
  }

  componentWillUnmount() {
    window.removeEventListener(EVENT_LISTENER_LIST.CUT, () => this.setState({ type: TEST_BASIS_EVENT_TYPE.DEFAULT }));
    window.removeEventListener(EVENT_LISTENER_LIST.KEYDOWN, () => {});
    eventBus.unsubscribe(this);
  }

  _initTestBasis = () => {
    const { testBasis, workLoaded } = this.props;

    if (!this.initiatedTestBasis && testBasis.content !== null && workLoaded) {
      const editorState = EditorState.createWithContent(
        convertFromRaw(JSON.parse(testBasis.content)),
        this._compositeDecorator()
      );

      this._updateEditorState(editorState);
      this.initiatedTestBasis = true;
    }
  };

  _findEntities = (contentBlock, callback, contentState) => {
    contentBlock.findEntityRanges((character) => {
      const entityKey = character.getEntity();
      return entityKey !== null && contentState.getEntity(entityKey).getType() === STRING.DEFINITION;
    }, callback);
  };

  _compositeDecorator = () =>
    new CompositeDecorator([
      {
        strategy: this._findEntities,
        component: (props) => {
          // eslint-disable-next-line react/prop-types
          const { decoratedText, contentState, entityKey } = props;
          // eslint-disable-next-line react/prop-types
          const entityData = contentState.getEntity(entityKey).getData();
          const newEntityData = { ...entityData, definition: decoratedText };
          const { type, definition } = entityData;
          // update definition
          if (definition !== decoratedText) {
            this._raiseEvent(domainEvents.ACTION.UPDATE, newEntityData);
            // eslint-disable-next-line react/prop-types
            contentState.mergeEntityData(entityKey, newEntityData);
          }
          return <DecoratedText {...props} type={type} />;
        },
      },
    ]);

  _updateEditorState = (editorState) => {
    const { setTestBasis } = this.props;
    const drawContent = convertToRaw(editorState.getCurrentContent());

    TestBasisManager.set(drawContent);

    setTestBasis(JSON.stringify(drawContent));

    const newState = {
      isOpenClassifyPopover: false,
      selectionState: null,
      editorState: EditorState.set(editorState, {
        decorator: this._compositeDecorator(),
      }),
    };

    this.setState({
      isOpenClassifyPopover: newState.isOpenClassifyPopover,
      editorState: newState.editorState,
      selectionState: newState.selectionState,
    });
  };

  _removeCauseEffect = async (definitionId) => {
    if (this.ready) {
      const { actionStates } = this.props;

      if (actionStates.length === 0) {
        await this._handleStoreActions();
      }

      const newContent = TestBasisManager.removeEntity(definitionId);
      const newEditorState = EditorState.createWithContent(convertFromRaw(newContent));
      // update state
      await this._updateEditorState(newEditorState);
      await this._handleStoreActions();
    }
  };

  /* Events */
  _handleEventBus = (message) => {
    const { action, value, receivers } = message;
    if (receivers === undefined || receivers.includes(domainEvents.DES.TESTBASIS)) {
      if (action === domainEvents.ACTION.ACCEPTDELETE) {
        this._removeCauseEffect(value.definitionId);
      }
      if (action === domainEvents.ACTION.NOTACCEPT) {
        this._removeCauseEffect(value.definitionId);
      }
      if (action === domainEvents.ACTION.INSERTCAUSES) {
        this._insertCause(value);
      }
    }
  };

  _insertCause = (data) => {
    const { editorState } = this.state;
    const result = TestBasisManager.insertCauses(editorState, data);
    if (result.causes.length > 0) {
      this._raiseEvent(domainEvents.ACTION.ADD, result.causes);
    }

    this._updateEditorState(result.editorState);
  };

  _raiseEvent = (action, value) => eventBus.publish(domainEvents.TESTBASIC_DOMAINEVENT, { action, value });
  /* End event */

  _getSelection = (selectionState, newEditorState = null) => {
    const { editorState } = this.state;
    const _editorState = newEditorState ?? editorState;

    const anchorKey = selectionState.getAnchorKey();
    const content = _editorState.getCurrentContent();
    const contentBlock = content.getBlockForKey(anchorKey);
    const start = selectionState.getStartOffset();
    const end = selectionState.getEndOffset();
    const selectedText = contentBlock.getText().slice(start, end);

    return { selectedText, anchorKey, start, end };
  };

  /* Action */
  _handleChange = (newEditorState) => {
    const { isOpenClassifyPopover, editorState } = this.state;
    const { setTestBasis } = this.props;

    const currentContent = newEditorState.getCurrentContent();
    const drawContent = convertToRaw(currentContent);

    if (!this.ready) {
      return;
    }

    const selectionState = newEditorState.getSelection();
    const { selectedText, anchorKey, end, start } = this._getSelection(selectionState, newEditorState);

    if (
      selectedText.trim().length > 0 &&
      !TestBasisManager.checkSameEntity(anchorKey, start, end) &&
      !isOpenClassifyPopover
    ) {
      this.setState({ isOpenClassifyPopover: true, selectionState });
    } else {
      const currentPlainText = currentContent.getPlainText();
      const prevContent = editorState.getCurrentContent();
      const prevPlainText = prevContent.getPlainText();
      // check if delete definition
      if (currentPlainText.length !== prevPlainText.length) {
        const removedEntities = TestBasisManager.findRemovedEntities(drawContent);
        if (removedEntities.length > 0) {
          this._handleCutEvent(removedEntities, selectionState);
          removedEntities.forEach((item) => {
            this._raiseEvent(domainEvents.ACTION.REMOVE, { ...item });
          });
        }
      }

      this.setState({ isOpenClassifyPopover: false });
    }
    TestBasisManager.set(drawContent);
    setTestBasis(JSON.stringify(drawContent));
    this.setState({ editorState: newEditorState });
  };

  _handleKeyCommand = (command, editorState) => {
    if (this.ready) {
      const newState = RichUtils.handleKeyCommand(editorState, command);
      if (newState) {
        this._handleChange(newState);
        return 'handled';
      }
    }
    return 'not-handled';
  };

  _toggleInlineStyle = (inlineStyle) => {
    const { editorState } = this.state;

    if (this.ready) {
      this._handleChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    }
  };

  _toggleBlockType = (blockType) => {
    const { editorState } = this.state;
    if (this.ready) {
      this._handleChange(RichUtils.toggleBlockType(editorState, blockType));
    }
  };

  _addCauseEffect = async (data) => {
    const { editorState, selectionState, cutState } = this.state;
    const { actionStates } = this.props;
    if (this.ready) {
      if (actionStates.length === 0) {
        await this._handleStoreActions();
      }
      const contentState = editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity(STRING.DEFINITION, 'MUTABLE', data);
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const currentSelection = cutState.selection || selectionState;
      const contentStateWithLink = Modifier.applyEntity(contentStateWithEntity, currentSelection, entityKey);
      const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithLink });

      const drawContent = newEditorState.getCurrentContent();
      const newTestBasis = convertToRaw(drawContent);
      await this._handleStoreActions(newTestBasis);

      this._updateEditorState(newEditorState);
    }
  };

  _classifyText = (type) => {
    if (!this.ready) {
      return;
    }

    const { selectionState } = this.state;
    const { selectedText, anchorKey, start, end } = this._getSelection(selectionState);
    const existDefinition = TestBasisManager.getEntity(selectedText, anchorKey, start, end);

    if (existDefinition.type && existDefinition.type !== type) {
      this._raiseEvent(domainEvents.ACTION.REMOVE, existDefinition);
    }

    if (existDefinition.type !== type) {
      // await this._handleStoreActions();
      const definitionId = uuidv4();
      this._addCauseEffect({ type, definitionId, definition: selectedText });
      this._raiseEvent(domainEvents.ACTION.ADD, [{ type, definitionId, definition: selectedText }]);
    }
  };

  _handleCutEvent = (entities, selection) => {
    const { type } = this.state;
    if (!this.ready) {
      return;
    }
    if (type === TEST_BASIS_EVENT_TYPE.DEFAULT) {
      this.setState({ cutState: { entities: [], selection: null } });
    }
    if (type === TEST_BASIS_EVENT_TYPE.CUT && entities.length > 0) {
      this.setState({ cutState: { entities, selection } });
      const value = entities.map((entity) => entity.definitionId);
      this._raiseEvent(domainEvents.ACTION.CUT, value);
    }
  };

  _handlePastedText = (text) => {
    const texts = text.split('\n').filter((text) => text);
    const { cutState } = this.state;
    let isContainsText = false;
    if (cutState.entities.length > 0) {
      isContainsText = cutState.entities.every((entity) => texts.includes(entity.definition));
    }
    if (!isContainsText) {
      alert('Cannot pasted because of non-existed text or duplicated!', {
        title: 'Cannot pasted text',
        error: true,
      });
      this.setState({ cutState: { entities: [], selection: null } });
      return true;
    }
    this._handlePasteEvent();
    this.setState({ type: TEST_BASIS_EVENT_TYPE.DEFAULT });
    return false;
  };

  _handlePasteEvent = () => {
    const { type } = this.state;
    if (type === TEST_BASIS_EVENT_TYPE.CUT) {
      const { cutState, editorState } = this.state;
      const currentContent = editorState.getCurrentContent();
      const drawContent = convertToRaw(currentContent);

      const { entityMap } = drawContent;
      const entities = Object.values(entityMap);
      let newEntities = [];
      if (entities.length > 0) {
        newEntities = cutState.entities.filter((removedEntity) =>
          entities.some((entity) => entity.data.definitionId !== removedEntity.definitionId)
        );
      } else {
        newEntities = cutState.entities.slice();
      }
      if (newEntities.length > 0) {
        newEntities.forEach((entity) => {
          this._addCauseEffect(entity);
        });
        this._raiseEvent(domainEvents.ACTION.PASTE);
        this.setState({ cutState: { entities: [], selection: null } });
      }
    }
  };
  /* End Action */

  /* Undo/Redo Action */
  _handleStoreActions = async (newTestBasis = undefined) => {
    const { pushActionStates, undoHandlers, testBasis, actionStates } = this.props;

    if (actionStates.length === UNDO_STACKS) {
      actionStates.shift();
    }

    let currentState = {
      testBasis: newTestBasis ?? JSON.parse(testBasis.content),
    };

    this.setState({ currIndex: actionStates.length });

    await undoHandlers.forEach((undoHandler) => {
      if (typeof undoHandler.update === 'function') {
        currentState = undoHandler.update(currentState);
      }
    });

    await pushActionStates({
      actions: currentState,
    });
    clearTimeout();
  };

  _handleKeyDownEvent = ({ ctrlKey, key }) => {
    if (ctrlKey && key === 'z') {
      this._undoEvent();
    }
    if (ctrlKey && key === 'y') {
      this._redoEvent();
    }
  };

  _undoEvent = () => {
    const { currIndex } = this.state;
    const { actionStates } = this.props;
    if (currIndex - 1 > -1 && actionStates.length > 0) {
      const prevIndex = currIndex - 1;
      const drawContent = convertFromRaw(actionStates[prevIndex].actions.testBasis);
      const newEditorState = EditorState.createWithContent(drawContent);
      this._updateEditorState(newEditorState);
      this._updateUndoState(prevIndex);
      this.setState({ currIndex: currIndex - 1 });
    }
  };

  _redoEvent = () => {
    const { currIndex } = this.state;
    const { actionStates } = this.props;
    if (currIndex + 1 < actionStates.length) {
      const nextIndex = currIndex + 1;
      const drawContent = convertFromRaw(actionStates[nextIndex].actions.testBasis);
      const newEditorState = EditorState.createWithContent(drawContent);
      this._updateEditorState(newEditorState);
      this._updateUndoState(nextIndex);
      this.setState({ currIndex: currIndex + 1 });
    }
  };

  _updateUndoState = (currentIndex) => {
    const { undoHandlers } = this.props;
    undoHandlers.forEach((undoHandler) => {
      if (typeof undoHandler.undo === 'function') {
        undoHandler.undo(currentIndex);
      }
    });
  };
  /* End Undo/Redo Action */

  render() {
    const { editorState, isOpenClassifyPopover } = this.state;
    const visibleSelectionRect = getVisibleSelectionRect(window);

    console.log('basis index', this.state.currIndex);

    return (
      <div className="h-100 p-4">
        <StyleControlEditor
          editorState={editorState}
          onToggleBlockType={this._toggleBlockType}
          onToggleInlineStyle={this._toggleInlineStyle}
        />
        <Editor
          placeholder="Type test basis here ..."
          spellCheck
          editorState={editorState}
          handleKeyCommand={this._handleKeyCommand}
          onChange={this._handleChange}
          handlePastedText={this._handlePastedText}
        />
        <ClassifyPopover
          isOpen={isOpenClassifyPopover}
          visibleSelectionRect={visibleSelectionRect}
          onClickItem={this._classifyText}
        />
      </div>
    );
  }
}

TestBasis.propTypes = {
  decoratedText: PropTypes.string,
  entityKey: PropTypes.string,
  actionStates: PropTypes.oneOfType([PropTypes.array]).isRequired,
  testBasis: PropTypes.shape({ content: PropTypes.string }).isRequired,
  workLoaded: PropTypes.bool.isRequired,
  setTestBasis: PropTypes.func.isRequired,
  pushActionStates: PropTypes.func.isRequired,
  undoHandlers: PropTypes.oneOfType([PropTypes.array]).isRequired,
};

TestBasis.defaultProps = {
  decoratedText: undefined,
  entityKey: undefined,
};

const mapStateToProps = (state) => ({
  testBasis: state.work.testBasis,
  workLoaded: state.work.loaded,
  undoHandlers: state.undoHandlers.handlers,
  actionStates: state.undoHandlers.actionStates,
});

const mapDispatchToProps = { setTestBasis, pushActionStates };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TestBasis));
