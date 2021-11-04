import templateService from 'features/project/work/services/templateService';
import Language from 'features/shared/languages/Language';
import React, { useRef, useState } from 'react';
import { useHistory } from 'react-router';
import { Button } from 'reactstrap';
import TemplateList from '../TemplateList';

export default function TemplateLoading({ projectId, workId }) {
  const [selectedId, setSelectedId] = useState(null);
  const listRef = useRef();
  const history = useHistory();

  const handleSelectTemplate = ({ id }) => {
    if (selectedId !== id) {
      setSelectedId(id);
    } else {
      setSelectedId(null);
    }
  };

  const handleSubmit = async () => {
    const result = await templateService.loadTemplate(projectId, workId, selectedId);
    if (result.error) {
      alert(result.error);
    } else {
      history.push(history.location.pathname);
    }
  };

  const handleSuccessDelete = (item) => {
    if (item.id === selectedId) {
      setSelectedId(null);
    }
  };

  return (
    <div>
      <div className="mx-3 mt-3">
        <TemplateList
          ref={listRef}
          onSelectRow={handleSelectTemplate}
          selectedItemId={selectedId}
          onSuccessDelete={handleSuccessDelete}
        />
      </div>
      <div className="px-3 pt-2 pb-3 border-top d-flex justify-content-end">
        <Button size="sm" color="primary" onClick={handleSubmit}>
          {Language.get('Import')}
        </Button>
      </div>
    </div>
  );
}
