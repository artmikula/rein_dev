import Language from 'features/shared/languages/Language';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Alert } from 'reactstrap';

function AlertGenerateReport(props) {
  const { generatingReport } = props;

  return (
    generatingReport && (
      <Alert color="dark" className="d-flex align-items-center py-1 position-absolute generateStatus">
        <i className="status-icon spinner-border mr-1" />
        <span>{Language.get('reportgenerated')}</span>
      </Alert>
    )
  );
}

AlertGenerateReport.propTypes = {
  generatingReport: PropTypes.bool.isRequired,
};

const mapStateToProps = (state) => ({ generatingReport: state.work.generatingReport });

export default connect(mapStateToProps)(AlertGenerateReport);
