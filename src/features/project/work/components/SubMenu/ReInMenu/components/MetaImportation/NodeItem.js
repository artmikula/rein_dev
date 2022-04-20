import React from 'react';

export default function NodeItem({ data, onDoubleClick }) {
  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('text', data.name);
  };

  const handleDoubleClick = () => onDoubleClick(data);

  return (
    <div className="meta-node py-1 px-2" draggable onDoubleClick={handleDoubleClick} onDragStart={handleDragStart}>
      {data.name}
    </div>
  );
}
