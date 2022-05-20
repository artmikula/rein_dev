/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Button, InputGroup, Input } from 'reactstrap';
import { CustomList } from 'features/shared/components';
import Language from 'features/shared/languages/Language';
import toLocalTime from 'features/shared/lib/utils';
import workService from 'features/project/work/services/workService';

const workFormSchema = (name) => ({
  formTitle: Language.get('renamework'),
  submitBtnName: Language.get('save'),
  cancelBtnName: Language.get('cancel'),
  formSchema: [
    {
      inputProps: {
        label: Language.get('name'),
        id: 'name',
        name: 'name',
        placeholder: '',
        type: 'text',
        required: true,
        maxLength: 256,
      },
      initialValue: name,
      fieldError: false,
      helperText: '',
    },
  ],
});

function WorkList({ projectId }) {
  const [works, setWorks] = useState([]);
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPage: 1,
  });

  const _getData = async () => {
    const { page } = pagination;
    const data = await workService.listAsync(projectId, page, 5, filter);
    const _totalPage = parseInt((data.totalRow - 1) / data.pageSize + 1, 10);
    let _page = page;

    if (_page > _totalPage) {
      _page = _totalPage;
    }

    if (_page === 0) {
      _page = 1;
    }

    setPagination({ page: _page, totalPage: _totalPage });
    setWorks(data?.items);
  };

  React.useEffect(() => {
    _getData();
  }, [pagination.page, filter]);

  const _onChangePage = (page) => setPagination((state) => ({ ...state, page }));

  const _onSearch = async () => {
    const filter = document.getElementById('search-work-box').value;

    setFilter(filter);
  };

  const _onPressEnter = (e) => {
    if (e.which === 13) {
      _onSearch();
    }
  };

  const _onEdit = async (selectedId, formValues, { setErrors, setSubmitting }) => {
    const result = await workService.updateAsync(projectId, selectedId, formValues);

    setSubmitting(false);
    if (result.error) {
      const { Name } = result.error.response.data;
      const errorMessage = Name.join(' ');
      setErrors({
        _summary_: errorMessage,
      });
      return false;
    }
    _getData();
    return true;
  };

  const _onDelete = async (selectedId) => {
    await workService.deleteAsync(projectId, selectedId);
    _getData();
  };

  const columns = [
    {
      headerName: Language.get('work'),
      key: 'name',
      // eslint-disable-next-line react/prop-types
      onRender: ({ id, name }) => <Link to={`/project/${projectId}/work/${id}`}>{name}</Link>,
    },
    {
      headerName: Language.get('createddate'),
      key: 'createdDate',
      format: (value) => toLocalTime(value) || null,
    },
    {
      headerName: Language.get('lastmodifieddate'),
      key: 'lastModifiedDate',
      format: (value) => toLocalTime(value) || null,
    },
    {
      headerName: '',
      key: 'action',
    },
  ];

  return (
    <div className="px-3 py-2">
      <div className="d-flex justify-content-end">
        <InputGroup style={{ width: '100%', maxWidth: '350px', margin: '10px' }}>
          <Input
            id="search-work-box"
            defaultValue={filter}
            placeholder={Language.get('worksearchplaceholder')}
            onKeyPress={_onPressEnter}
          />
          <Button style={{ height: '36.39px', marginLeft: '8px' }} color="primary" onClick={_onSearch}>
            <i className="bi bi-search" />
          </Button>
        </InputGroup>
      </div>

      <CustomList
        columns={columns}
        pagingOptions={{ ...pagination, onChangePage: _onChangePage }}
        formSchema={workFormSchema}
        data={works}
        onEdit={_onEdit}
        onDelete={_onDelete}
      />
    </div>
  );
}

WorkList.propTypes = {
  projectId: PropTypes.string.isRequired,
};

export default WorkList;
