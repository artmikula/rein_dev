import { IDbContext } from 'features/shared/storage-services/dbContext/models';
import { ICauseEffect, IGraphNode, IGraphLink, ITestCoverage, ITestDataDetail, IConstraint } from './models';

interface IGraphState {
  graphNodes: IGraphNode[];
  graphLinks: IGraphLink[];
  constraints: IConstraint[];
}

interface IWorkSlice {
  name: string;
  version: string;
  projectName: string;
  generatingReport: boolean;
  loaded: boolean;
  testBasis: {
    content: string | null;
  };
  causeEffects: ICauseEffect[];
  graph: IGraphState;
  testCoverage: ITestCoverage;
  testDatas: ITestDataDetail[];
  dbContext: IDbContext | null;
}

export type { IGraphState, IWorkSlice };
