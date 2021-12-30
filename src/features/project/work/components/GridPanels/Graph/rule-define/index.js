import { RULE_CODES } from 'features/shared/inspection-palettes';
import { nodesSagSwellInterruptionHaveToConnectedWithOneAndOnlyConst } from './common';

function rule1({ currentNode, graphData }) {
  const appliedDefinitions = new Set(['SAG', 'SWELL']);

  return nodesSagSwellInterruptionHaveToConnectedWithOneAndOnlyConst(currentNode, graphData, appliedDefinitions);
}

function toolTipsWarningRule() {
  return true;
}

const ruleDefine = {
  [RULE_CODES.RULE1]: rule1,
  [RULE_CODES.RULE2]: toolTipsWarningRule,
  [RULE_CODES.RULE3]: toolTipsWarningRule,
  [RULE_CODES.RULE4]: toolTipsWarningRule,
  [RULE_CODES.RULE5]: toolTipsWarningRule,
  [RULE_CODES.RULE6]: toolTipsWarningRule,
};

export default ruleDefine;
