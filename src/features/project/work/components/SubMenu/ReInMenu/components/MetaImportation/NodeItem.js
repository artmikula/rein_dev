import React from 'react';

export default function NodeItem({ data, onDoubleClick }) {
  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('text', data.name);
  };

  const handleDoubleClick = () => onDoubleClick(data);

  const getClassName = () => {
    let className = 'meta-node py-1 px-2';

    if (data.exists) {
      className += ' warning';
    }

    return className;
  };

  return (
    <div className={getClassName()} draggable onDoubleClick={handleDoubleClick} onDragStart={handleDragStart}>
      {data.name}
    </div>
  );
}
