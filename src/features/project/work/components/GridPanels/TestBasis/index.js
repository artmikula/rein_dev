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
import { STRING } from 'features/shared/constants';
import domainEvents from 'features/shared/domainEvents';
import eventBus from 'features/shared/lib/eventBus';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import GlobalContext from 'security/GlobalContext';
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
      selectionState: {},
    };
    this.initiatedTestBasis = false;
  }

  componentDidMount() {
    eventBus.subscribe(this, domainEvents.CAUSEEFFECT_DOMAINEVENT, (event) => {
      const { message } = event;
      this._handleEventBus(message);
    });

    this._initTestBasis();
    this.ready = true;
  }

  componentDidUpdate() {
    this._initTestBasis();
  }

  componentWillUnmount() {
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
          const { decoratedText, contentState, entityKey } = props;
          const entityData = contentState.getEntity(entityKey).getData();
          const newEntityData = { ...entityData, definition: decoratedText };
          const { type, definition } = entityData;
          // update definition
          if (definition !== decoratedText) {
            this._raiseEvent(domainEvents.ACTION.UPDATE, newEntityData);
            contentState.mergeEntityData(entityKey, newEntityData);
          }
          return <DecoratedText {...props} type={type} />;
        },
      },
    ]);

  _updateEditorState = (editorState, state) => {
    const { setTestBasis } = this.props;
    const drawContent = convertToRaw(editorState.getCurrentContent());

    TestBasisManager.set(drawContent);

    setTestBasis(JSON.stringify(drawContent));

    const newState = {
      isOpenClassifyPopover: false,
      selectionState: {},
      ...state,
      editorState: EditorState.set(editorState, {
        decorator: this._compositeDecorator(),
      }),
    };

    this.setState(newState);
  };

  _removeCauseEffect = (definitionId) => {
    if (this.ready) {
      const drawContent = TestBasisManager.removeEntity(definitionId);
      const editorState = EditorState.createWithContent(convertFromRaw(drawContent));

      this._updateEditorState(editorState);
    }
  };

  /* Events */
  _handleEventBus = (message) => {
    const { action, type, value, receivers } = message;
    if (receivers === undefined || receivers.includes(domainEvents.DES.TESTBASIS)) {
      if (action === domainEvents.ACTION.ACCEPTDELETE) {
        this._removeCauseEffect(value.definitionId);
      }
      if (action === domainEvents.ACTION.NOTACCEPT) {
        this._removeCauseEffect(value.definitionId);
      }
    }
  };

  _raiseEvent = (action, value) => {
    eventBus.publish(domainEvents.TESTBASIC_DOMAINEVENT, { action, value });
  };
  /* End event */

  _getSelectedText = (selectionState, newEditorState = null) => {
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
  _handleChange = (editorState) => {
    const { isOpenClassifyPopover } = this.state;

    if (!this.ready) {
      return;
    }

    const selectionState = editorState.getSelection();
    const { selectedText } = this._getSelectedText(selectionState, editorState);

    if (selectedText.length > 0 && !isOpenClassifyPopover) {
      this.setState({ isOpenClassifyPopover: true, selectionState });
    } else {
      this._updateEditorState(editorState, { selectionState });
    }
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

  _addCauseEffect = (data) => {
    const { editorState, selectionState } = this.state;
    if (this.ready) {
      const contentState = editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity(STRING.DEFINITION, 'MUTABLE', data);
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const contentStateWithLink = Modifier.applyEntity(contentStateWithEntity, selectionState, entityKey);
      const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithLink });

      this._updateEditorState(newEditorState);
    }
  };

  _classifyText = (type) => {
    if (!this.ready) {
      return;
    }

    const { selectionState } = this.state;
    const { selectedText, anchorKey, start, end } = this._getSelectedText(selectionState);
    const existDefinition = TestBasisManager.getEntity(selectedText, anchorKey, start, end);

    if (existDefinition && existDefinition.type !== type) {
      this._raiseEvent(domainEvents.ACTION.ADD, existDefinition);
    }

    if ((existDefinition && existDefinition.type !== type) || !existDefinition) {
      const definitionId = uuidv4();
      this._addCauseEffect({ type, definitionId, definition: selectedText });
      this._raiseEvent(domainEvents.ACTION.ADD, { type, definitionId, definition: selectedText });
    }
  };
  /* End Action */

  render() {
    const { editorState, isOpenClassifyPopover } = this.state;
    const visibleSelectionRect = getVisibleSelectionRect(window);

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
  match: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.bool])).isRequired,
  decoratedText: PropTypes.string,
  entityKey: PropTypes.string,
};

TestBasis.defaultProps = {
  decoratedText: undefined,
  entityKey: undefined,
};

TestBasis.contextType = GlobalContext;

const mapStateToProps = (state) => ({ testBasis: state.work.testBasis, workLoaded: state.work.loaded });

const mapDispatchToProps = { setTestBasis };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(TestBasis));
