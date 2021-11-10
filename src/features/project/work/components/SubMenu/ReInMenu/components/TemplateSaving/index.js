import templateService from 'features/project/work/services/templateService';
import Language from 'features/shared/languages/Language';
import React, { useRef, useState } from 'react';
import { Button } from 'reactstrap';
import TemplateList from '../TemplateList';

const defaultItem = { name: '', id: null };

export default function TemplateSaving({ projectId, workId }) {
  const [data, setData] = useState(defaultItem);
  const listRef = useRef();

  const handleChangeName = (e) => setData({ ...data, name: e.target.value });

  const handleSelectTemplate = ({ id, name }) => {
    if (id !== data.id) {
      setData({ id, name });
    } else {
      setData({ ...data, id: null });
    }
  };

  const updateTemplate = async () => {
    const result = await templateService.updateAsync(projectId, workId, data);
    if (result.error) {
      window.alert(result.error);
    } else {
      listRef.current.reload();
      setData(defaultItem);
    }
  };

  const createTemplate = async () => {
    const result = await templateService.createAsync(projectId, workId, data);
    if (result.error) {
      window.alert(result.error);
    } else {
      listRef.current.reload();
      setData(defaultItem);
    }
  };

  const handleSubmit = () => {
    if (data.id) {
      updateTemplate();
    } else {
      createTemplate();
    }
  };

  const handleSuccessDelete = (item) => {
    if (item.id === data.id) {
      setData(defaultItem);
    }
  };

  return (
    <div>
      <div className="mx-3 mt-3">
        <TemplateList
          ref={listRef}
          onSelectRow={handleSelectTemplate}
          selectedItemId={data.id}
          onSuccessDelete={handleSuccessDelete}
        />
      </div>
      <div className="px-3 pt-2 mb-3 border-top d-flex justify-content-between">
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
        <Button size="sm" color="primary" onClick={handleSubmit}>
          {Language.get('save')}
        </Button>
      </div>
    </div>
  );
}
