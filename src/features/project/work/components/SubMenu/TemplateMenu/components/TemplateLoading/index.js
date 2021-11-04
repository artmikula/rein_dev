import { allPropertiesInJSON, allTagsInXML, readFileContent } from 'features/project/work/biz/Template';
import templateService from 'features/project/work/services/templateService';
import Language from 'features/shared/languages/Language';
import React, { useRef, useState } from 'react';
import { useHistory } from 'react-router';
import { Button, FormGroup, Input, Label } from 'reactstrap';
import TemplateList from '../TemplateList';

export default function TemplateLoading({ projectId, workId, isLoadMeta = false }) {
  const [selectedId, setSelectedId] = useState(null);
  const [loadingMeta, setLoadingFile] = useState({ isLoadMeta, file: null });
  const [loading, setLoading] = useState(false);
  const listRef = useRef();
  const history = useHistory();

  const handleSelectTemplate = ({ id }) => {
    if (selectedId !== id) {
      setSelectedId(id);
    } else {
      setSelectedId(null);
    }
  };

  const loadMeta = (callback) => {
    const fileName = loadingMeta.file.name;
    const ex = fileName.split('.').pop();
    if (ex.toLowerCase() === 'json') {
      readFileContent(loadingMeta.file, (content) => {
        const data = allPropertiesInJSON(content);
        localStorage.setItem('meta-data', data.join(','));
        if (typeof callback === 'function') {
          callback();
        }
      });
    } else if (ex.toLowerCase() === 'xml') {
      readFileContent(loadingMeta.file, (content) => {
        const data = allTagsInXML(content);
        localStorage.setItem('meta-data', data.join(','));
        if (typeof callback === 'function') {
          callback();
        }
      });
    }
  };

  const importTemplate = async () => {
    const result = await templateService.loadTemplate(projectId, workId, selectedId);
    if (result.error) {
      alert(result.error);
      setLoading(false);
    } else {
      window.location.assign(history.location.pathname);
    }
  };

  const handleSubmit = () => {
    setLoading(true);
    if (loadingMeta.isLoadMeta) {
      loadMeta(importTemplate);
    } else {
      importTemplate();
    }
  };

  const handleSuccessDelete = (item) => {
    if (item.id === selectedId) {
      setSelectedId(null);
    }
  };

  const handleChangeloadingFile = (e) => {
    setLoadingFile({ ...loadingMeta, isLoadMeta: e.target.checked });
  };

  const handleChangeFile = (e) => {
    setLoadingFile({ ...loadingMeta, file: e.target.files[0] });
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
      <div className="px-3 py-2">
        <FormGroup check>
          <Input
            id="load-meta-checkbox"
            type="checkbox"
            checked={loadingMeta.isLoadMeta}
            onChange={handleChangeloadingFile}
          />
          <Label check htmlFor="load-meta-checkbox">
            {Language.get('loadmeta')}
          </Label>
        </FormGroup>
        {loadingMeta.isLoadMeta && (
          <Input className="mt-1" type="file" accept=".json,.xml" onChange={handleChangeFile} />
        )}
      </div>
      <div className="px-3 pt-2 pb-3 border-top d-flex justify-content-end">
        <Button
          size="sm"
          color="primary"
          onClick={handleSubmit}
          disabled={!selectedId || loading || (loadingMeta.isLoadMeta && !loadingMeta.file)}
        >
          {loading && <div className="status-icon spinner-border mr-1" />}
          {Language.get('Import')}
        </Button>
      </div>
    </div>
  );
}
