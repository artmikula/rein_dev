import { RULE_CODES } from 'features/shared/inspection-palettes';
import rule1 from './rule1';
import rule2 from './rule2';
import rule3 from './rule3';

const ruleDefine = {
  [RULE_CODES.RULE1]: rule1,
  [RULE_CODES.RULE2]: rule2,
  [RULE_CODES.RULE3]: rule3,
};

export default ruleDefine;
