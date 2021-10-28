import Language from 'features/shared/languages/Language';
import React, { useState } from 'react';
import { Button } from 'reactstrap';
import TemplateList from '../TemplateList';

export default function TemplateSaving() {
  const [data, setData] = useState({ name: '' });

  const handleChangeName = (e) => setData({ name: e.target.value });

  const handleSelectTemplate = ({ id, name }) => setData({ id, name });

  return (
    <div className="m-3">
      <TemplateList onSelectRow={handleSelectTemplate} selectedItemId={data.id} />
      <div className="pt-2 mt-2 border-top">
        <div className="d-flex justify-content-between">
          <label className="form-check-label font-weight-bold" htmlFor="inlineCheckbox1">
            {Language.get('templatename')}
            <input
              className="border-1 ml-2 px-2"
              id="inlineCheckbox1"
              value={data.name}
              onChange={handleChangeName}
              style={{ outline: 'none', width: '300px' }}
            />
          </label>
          <Button size="sm" color="primary">
            {Language.get('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
