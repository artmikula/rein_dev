import { allPropertiesInJSON, allTagsInXML, readFileContent } from 'features/project/work/biz/Template';
import React, { useState } from 'react';
import MetaFilePicker from './MetaFilePicker';
import NodeSelection from './NodeSelection';
import './style.scss';

export default function MetaImportation({ onSubmit }) {
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

  const handlePickFile = (file) => {
    if (file) {
      const fileName = file.name;
      const ex = fileName.split('.').pop();

      if (ex.toLowerCase() === 'json') {
        readFileContent(file, (content) => {
          const data = allPropertiesInJSON(content);
          setNodes(data);
        });
      } else if (ex.toLowerCase() === 'xml') {
        readFileContent(file, (content) => {
          const data = allTagsInXML(content);
          setNodes(data);
        });
      }
    }
  };

  if (nodes) {
    return <NodeSelection onSubmit={handleSubmit} data={nodes} onChange={handleChange} />;
  }

  return <MetaFilePicker onSubmit={handlePickFile} />;
}
