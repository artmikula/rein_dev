import Language from 'features/shared/languages/Language';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { DropdownItem, Input } from 'reactstrap';

export default function SearchComponent({
  recentTitle,
  placeholder,
  onSearch,
  recentData,
  searchData,
  renderItem,
  getItemKey,
}) {
  const [searchValue, setSearchValue] = useState('');

  const _handleSearchChange = (e) => {
    const { value } = e.target;
    setSearchValue(value);
    if (value.length >= 3) {
      onSearch(value);
    }
  };

  const listTitle = searchValue.length > 0 ? 'Search results' : recentTitle;

  const _listContent = () => {
    let list = [];
    if (searchValue.length > 0) {
      list = searchData;
    } else if (recentData.length > 0) {
      list = recentData;
    }
    return list.map((result) => (
      <DropdownItem className="px-3 py-2" key={getItemKey(result)}>
        {renderItem(result)}
      </DropdownItem>
    ));
  };

  return (
    <div className="w-100 d-flex flex-column h-100">
      <div className="px-3 py-2">
        <Input
          value={searchValue}
          onChange={_handleSearchChange}
          placeholder={placeholder}
          className="search-input flex-grow-1 my-1 w-100"
        />
      </div>
      {recentTitle && typeof renderItem === 'function' && (
        <>
          <p className="font-weight-bold text-secondary h6 px-3 pb-1 m-0 small">{listTitle}</p>
          <div className="flex-grow-1 overflow-hidden">
            <div className="overflow-auto recents h-100 pb-1">{_listContent()}</div>
          </div>
        </>
      )}
    </div>
  );
}

SearchComponent.propTypes = {
  onSearch: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
  getItemKey: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  recentTitle: PropTypes.string,
  recentData: PropTypes.arrayOf(PropTypes.shape({})),
  searchData: PropTypes.arrayOf(PropTypes.shape({})),
};

SearchComponent.defaultProps = {
  placeholder: Language.get('search'),
  recentTitle: Language.get('recents'),
  recentData: [],
  searchData: [],
};
