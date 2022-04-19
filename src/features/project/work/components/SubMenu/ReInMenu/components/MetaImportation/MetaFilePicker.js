import Language from 'features/shared/languages/Language';
import React, { useState } from 'react';
import { Button, Input } from 'reactstrap';

export default function MetaFilePicker({ onSubmit }) {
  const [file, setFile] = useState(null);

  const handleSubmit = () => {
    onSubmit(file);
  };

  const handleChangeFile = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div>
      <div className="mx-3 my-3">
        <Input className="mt-1" type="file" accept=".json,.xml" onChange={handleChangeFile} />
      </div>
      <div className="px-3 pt-2 pb-3 border-top d-flex justify-content-end">
        <Button size="sm" color="primary" onClick={handleSubmit} disabled={!file}>
          {Language.get('Next')}
        </Button>
      </div>
    </div>
  );
}
