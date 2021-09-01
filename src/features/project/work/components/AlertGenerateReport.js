import React from 'react';
import { connect } from 'react-redux';
import { Alert } from 'reactstrap';

function AlertGenerateReport(props) {
  const { generatingReport } = props;

  return (
    generatingReport && (
      <Alert color="dark" className="d-flex align-items-center py-1 position-absolute generateStatus">
        <i className="status-icon spinner-border mr-1" />
        <span>Report is being generated</span>
      </Alert>
    )
  );
}

const mapStateToProps = (state) => ({ generatingReport: state.work.generatingReport });

export default connect(mapStateToProps)(AlertGenerateReport);
