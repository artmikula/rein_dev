import { NODE_INSPECTION } from 'features/shared/constants';

export const EDGE_COLOR = {
  NOT_RELATION: '#965196',
  CONSTRAINT: '#444444',
  RELATION: '#98c9ea',
};

export const NODE_BG_COLOR = {
  CAUSE: '#965196',
  EFFECT: '#965196',
  GROUP: '#965196',
  DEFAULT: '#fff',
};

export const LABELCOLOR = {
  NODE: '#333333',
  EDGE: '#444444',
};

export const DELETE_KEY = 46;

export const DEFAULT_NODE_X = {
  CAUSE: 150,
  EFFECT: 550,
  GROUP: 350,
  EXCLUSIVE: 40,
  INCLUSIVE: 60,
  ONLYONE: 80,
};

export const DEFAULT_SPACE = 100;

export const EDGE_DEFAULT_ID = 'EDGE_DEFAULT_ID';

export const NODE_INPECTION_TEXT_KEY = {
  [NODE_INSPECTION.DisconnectedNode]: 'disconnectednode',
  [NODE_INSPECTION.MissingIsRelation]: 'missingisrelation',
  [NODE_INSPECTION.MissingNotRelation]: 'missingnotrelation',
  [NODE_INSPECTION.HasRelationInSameGroup]: 'hasrelationinsamegroup',
  [NODE_INSPECTION.EConstraintViolation]: 'econstraintviolation',
  [NODE_INSPECTION.IConstraintViolation]: 'iconstraintviolation',
  [NODE_INSPECTION.OConstraintViolation]: 'oconstraintviolation',
  [NODE_INSPECTION.RConstraintViolation]: 'rconstraintviolation',
  [NODE_INSPECTION.MConstraintViolation]: 'mconstraintviolation',
  [NODE_INSPECTION.ConstraintViolation]: 'constraintviolation',
};

export const EXPORT_TYPE_NAME = {
  TestCase: 'TestCase',
};
