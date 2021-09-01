import React from 'react';
import PropTypes from 'prop-types';
import Language from '../../../../../../shared/languages/Language';

export default function AbbreviateConfirmContent({ addNode, addDefination, similarNode, similarDefination }) {
  const content = Language.get('similarelementwasfound');
  const elementToAdd = Language.get('elementstoadd');
  const similarElement = Language.get('similarelement');
  const subtitle = Language.get('willbeleft');
  return (
    <div>
      <p className="mb-3">{content}</p>
      <p className="mb-1 text-secondary">
        {elementToAdd} {addNode}: {addDefination}
      </p>
      <p className="mb-3 text-secondary">
        {similarElement} {similarNode}: {similarDefination}
      </p>
      <p>
        {similarNode} {subtitle}
      </p>
    </div>
  );
}

AbbreviateConfirmContent.propTypes = {
  addNode: PropTypes.string.isRequired,
  addDefination: PropTypes.string.isRequired,
  similarNode: PropTypes.string.isRequired,
  similarDefination: PropTypes.string.isRequired,
};
