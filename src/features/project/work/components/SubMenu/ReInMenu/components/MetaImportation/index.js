import { allPropertiesInJSON, allTagsInXML, readFileContent } from 'features/project/work/biz/Template';
import React, { useState } from 'react';
import MetaFilePicker from './MetaFilePicker';
import NodeSelection from './NodeSelection';
import './style.scss';

export default function MetaImportation({ onSubmit, causes }) {
  const [nodes, setNodes] = useState(null);

  const handleSubmit = () => {
    onSubmit(nodes.filter((x) => x.selected).map((x) => x.name));
  };

  const handleChange = (item) => {
    const newNodes = [...nodes];
    const index = newNodes.findIndex((x) => x.name === item.name);

    newNodes[index] = { ...newNodes[index], selected: !newNodes[index].selected };

    setNodes(newNodes);
  };

  const unselectExistsNodes = (data) => {
    const newData = (data || []).map((x) => {
      const exists = (causes || []).some((y) => y.definition === x.name);

      return {
        ...x,
        exists,
        selected: x.selected && !exists,
      };
    });

    return newData;
  };

  const handlePickFile = (file) => {
    if (file) {
      const fileName = file.name;
      const ex = fileName.split('.').pop();

      if (ex.toLowerCase() === 'json') {
        readFileContent(file, (content) => {
          const data = allPropertiesInJSON(content);

          setNodes(unselectExistsNodes(data));
        });
      } else if (ex.toLowerCase() === 'xml') {
        readFileContent(file, (content) => {
          const data = allTagsInXML(content);
          setNodes(unselectExistsNodes(data));
        });
      }
    }
  };

  if (nodes) {
    return <NodeSelection onSubmit={handleSubmit} data={nodes} onChange={handleChange} />;
  }

  return <MetaFilePicker onSubmit={handlePickFile} />;
}
