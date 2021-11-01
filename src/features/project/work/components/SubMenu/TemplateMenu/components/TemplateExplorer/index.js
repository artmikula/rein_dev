import templateService from 'features/project/work/services/templateService';
import React, { useEffect, useState } from 'react';
import TemplateList from '../TemplateList';

export default function TemplateExplorer({ projectId, workId }) {
  const [temlateList, setTemplateList] = useState([]);
  const getTemplateList = async () => {
    const result = await templateService.listAsync();
    if (result.data) {
      setTemplateList(result.data.items);
    }
  };

  const handleSuccessDelete = () => {
    getTemplateList();
  };

  useEffect(() => {
    getTemplateList();
  }, []);

  return (
    <div className="m-3">
      <TemplateList data={temlateList} onSuccessDelete={handleSuccessDelete} />
    </div>
  );
}
