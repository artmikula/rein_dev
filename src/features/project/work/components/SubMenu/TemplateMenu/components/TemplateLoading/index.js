import templateService from 'features/project/work/services/templateService';
import Language from 'features/shared/languages/Language';
import React, { useRef, useState } from 'react';
import { Button } from 'reactstrap';
import TemplateList from '../TemplateList';

export default function TemplateLoading({ projectId, workId }) {
  const [selectedId, setSelectedId] = useState(null);
  const listRef = useRef();

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
      window.location.reload();
    }
  };

  const handleSuccessDelete = (item) => {
    if (item.id === selectedId) {
      setSelectedId(null);
    }
  };

  return (
    <div className="m-3">
      <TemplateList
        ref={listRef}
        onSelectRow={handleSelectTemplate}
        selectedItemId={selectedId}
        onSuccessDelete={handleSuccessDelete}
      />
      <div className="pt-2 mt-2 border-top d-flex justify-content-end">
        <Button size="sm" color="primary" onClick={handleSubmit}>
          {Language.get('Import')}
        </Button>
      </div>
    </div>
  );
}
