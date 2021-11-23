
interface IGraphNode {
    id: string;
    childs?: any;
    createdDate?: any; 
    effectGroup?: number;
    inspection?: number;
    isLocked?: boolean;
    lastModifiedDate?: any;
    nodeId: string;
    positionX?: number;
    positionY?: number;
    targetType?: string;
    type?: string;
    workId: string;
    definition: any;
}

interface IGraphLink {
    id: string;
    isNotRelation?: boolean;
    sourceId: string;
    source: IGraphNode;
    targetId: string;
    target: IGraphNode;
    type: string;
}

interface ITestScenario {
    id: string;
    expectedResults?: string;
    isFeasible?: boolean;
    targetType?: string;
    testAssertions: ITestAssertion[];
    testResults: ITestResult[];
    isBaseScenario?: boolean;
    isViolated?: boolean;
    // Not sure, to check this prop
    testResult?: any;
    // [id: any]: any;
}

interface ITestAssertion {
    graphNode?: IGraphNode;
    result: boolean;
    testScenario?: ITestScenario;
}

interface ITestResult {
    graphNodeId: string;
    type: string;
}

export type { IGraphLink, ITestScenario, IGraphNode, ITestAssertion, ITestResult};