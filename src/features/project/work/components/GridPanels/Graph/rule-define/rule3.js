import { twoCauseDefinitionDoNotHasASameExclusive } from './common';

function rule3(currentNode, graphData) {
  const appliedDefinitions = new Set(['SWELL', 'INTERRUPTION ']);

  return twoCauseDefinitionDoNotHasASameExclusive(currentNode, graphData, appliedDefinitions);
}

export default rule3;
