import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { useSelector } from 'react-redux';
import Language from 'features/shared/languages/Language';
import { Button, Input, Label } from 'reactstrap';
import { FILTER_OPTIONS, FILTER_TYPE, GENERATE_STATUS, OPERATOR_TYPE, RESULT_TYPE } from 'features/shared/constants';
import { sortByString } from 'features/shared/lib/utils';

function FilterBar(props) {
  const { setFilterOptions, filterOptions, onSubmit } = props;

  const { generating, dbContext, graph } = useSelector((state) => state.work);

  const { causeNodes: nodesProp, resultType, sourceTargetType, isBaseScenario, isValid } = filterOptions;

  const [causeNodes, setCauseNodes] = React.useState([]);

  React.useEffect(async () => {
    if ((generating === GENERATE_STATUS.COMPLETE || generating === GENERATE_STATUS.INITIAL) && dbContext) {
      const { testScenarioSet } = dbContext;
      const testScenarios = await testScenarioSet.get();
      const testAssertions = testScenarios.map((testScenario) => testScenario.testAssertions).flat();
      const causeNodes = testAssertions
        .filter(
          (testAssertion, index, array) =>
            array.findIndex((arr) => arr?.graphNodeId === testAssertion?.graphNodeId) === index &&
            testAssertion.nodeId.startsWith('C')
        )
        .map((testAssertion) => {
          const definition =
            graph.graphNodes.find((graphNode) => graphNode.nodeId === testAssertion.nodeId)?.definition ?? '';
          return {
            value: testAssertion?.graphNodeId ?? '',
            label: `${testAssertion.nodeId}: ${definition}` ?? '',
          };
        });

      const result = sortByString(causeNodes, 'label');
      setCauseNodes(result);
    }
    return [];
  }, [generating]);

  return (
    <div className="d-flex m-2">
      <div className="d-flex justify-content-around align-items-center small filter-wrapper">
        <div className="auto-complete">
          <Select
            isMulti
            value={nodesProp ?? null}
            onChange={(values) => setFilterOptions(FILTER_OPTIONS.CAUSE_NODES, values)}
            options={causeNodes}
            placeholder={Language.get('select')}
          />
        </div>

        <Input
          value={resultType}
          type="select"
          bsSize="sm"
          className="ml-2"
          style={{ minWidth: 66, fontSize: 'inherit' }}
          disabled={nodesProp === null || nodesProp?.length === 0}
          onChange={(e) => setFilterOptions(FILTER_OPTIONS.RESULT_TYPE, e.target.value)}
        >
          <option value={RESULT_TYPE.All}>{RESULT_TYPE.All}</option>
          <option value={RESULT_TYPE.True}>{RESULT_TYPE.True}</option>
          <option value={RESULT_TYPE.False}>{RESULT_TYPE.False}</option>
        </Input>

        <div className="vertical-line d-flex ml-2" />
        <div className="ml-2 d-flex justify-content-center">
          <div className="form-check form-check-inline">
            <input
              checked={sourceTargetType === OPERATOR_TYPE.AND}
              className="form-check-input"
              onChange={(e) => setFilterOptions(FILTER_OPTIONS.SOURCE_TARGET_TYPE, e.target.value)}
              type="radio"
              name="inlineRadioOptions"
              value={OPERATOR_TYPE.AND}
            />
            <Label className="form-check-label">{Language.get('and')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input
              checked={sourceTargetType === OPERATOR_TYPE.OR}
              className="form-check-input"
              onChange={(e) => setFilterOptions(FILTER_OPTIONS.SOURCE_TARGET_TYPE, e.target.value)}
              type="radio"
              name="inlineRadioOptions"
              value={OPERATOR_TYPE.OR}
            />
            <Label className="form-check-label">{Language.get('or')}</Label>
          </div>
        </div>

        <div className="vertical-line" />
        <div className="d-flex ml-2">
          <div className="form-check form-check-inline">
            <input
              type="checkbox"
              checked={isBaseScenario ?? false}
              className="form-check-input"
              onChange={(e) => setFilterOptions(FILTER_OPTIONS.BASE_SCENARIO, e.target.checked)}
            />
            <Label className="form-check-label">{Language.get('base')}</Label>
          </div>
          <div className="form-check form-check-inline">
            <input
              type="checkbox"
              checked={isValid ?? false}
              className="form-check-input"
              onChange={(e) => setFilterOptions(FILTER_OPTIONS.VALID, e.target.checked)}
            />
            <Label className="form-check-label">{Language.get('valid')}</Label>
          </div>
        </div>
      </div>

      <Button
        color="primary"
        size="sm"
        className="filter-button"
        style={{ marginRight: 10 }}
        onClick={() => onSubmit(FILTER_TYPE.SUBMIT)}
      >
        {Language.get('apply')}
      </Button>
      <Button
        color="primary"
        size="sm"
        className="filter-button"
        onClick={() => {
          setFilterOptions(FILTER_OPTIONS.TYPE, FILTER_TYPE.RESET);
          onSubmit(FILTER_TYPE.RESET);
        }}
      >
        Reset
      </Button>
    </div>
  );
}

FilterBar.propTypes = {
  filterOptions: PropTypes.shape({
    causeNodes: PropTypes.oneOfType([PropTypes.array]),
    sourceTargetType: PropTypes.string,
    resultType: PropTypes.string,
    isBaseScenario: PropTypes.bool,
    isValid: PropTypes.bool,
    type: PropTypes.string,
  }).isRequired,
  setFilterOptions: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
export default FilterBar;
