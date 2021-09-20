import React from 'react';

function Loading() {
  return (
    <div className="d-flex justify-content-center align-items-center flex-column" style={{ margin: '48px auto' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="sr-only" />
      </div>
      <div className="mt-2">Please wait a second ...</div>
    </div>
  );
}

export default Loading;
