import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'reactstrap';

import Language from 'features/shared/languages/Language';

// TODO: refactor this
function TableHeader(props) {
  const { onChangeCheckbox, rows, columns, isCheckAll } = props;

  return (
    <thead className="text-primary">
      <tr>
        <td style={{ position: 'relative', minWidth: 140 }}>
          {rows.length > 0 && (
            <Input type="checkbox" className="input-checkbox" onChange={onChangeCheckbox} checked={isCheckAll} />
          )}
          <span className="font-weight-500" style={{ lineHeight: '21px' }}>
            {Language.get('name')}
          </span>
        </td>
        {columns.map((column, colIndex) => (
          <td key={colIndex} title={column.title} style={{ cursor: column.title ? 'pointer' : 'default' }}>
            {column.headerName}
          </td>
        ))}
      </tr>
    </thead>
  );
}

TableHeader.propTypes = {
  onChangeCheckbox: PropTypes.func.isRequired,
  isCheckAll: PropTypes.bool.isRequired,
  rows: PropTypes.oneOfType([PropTypes.array]).isRequired,
  columns: PropTypes.oneOfType([PropTypes.array]).isRequired,
};

export default React.memo(TableHeader);
