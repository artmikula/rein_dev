import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'reactstrap';

import Language from 'features/shared/languages/Language';

function TableHeader(props) {
  const { filterRows, onChangeCheckbox, checked, rows, columns } = props;
  return (
    <thead className="text-primary">
      <tr>
        <td style={{ position: 'relative', minWidth: 140 }}>
          {typeof filterRows !== 'undefined'
            ? filterRows.length > 0 && (
                <Input type="checkbox" className="input-checkbox" onChange={onChangeCheckbox} checked={checked} />
              )
            : rows.length > 0 && (
                <Input type="checkbox" className="input-checkbox" onChange={onChangeCheckbox} checked={checked} />
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
  checked: PropTypes.bool.isRequired,
  rows: PropTypes.oneOfType([PropTypes.array]).isRequired,
  columns: PropTypes.oneOfType([PropTypes.array]).isRequired,
  filterRows: PropTypes.oneOfType([PropTypes.array]),
};

TableHeader.defaultProps = { filterRows: undefined };

export default React.memo(TableHeader);
