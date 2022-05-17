import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { withRouter, Link } from 'react-router-dom';
import projectService from 'features/project/services/projectService';
import workService from 'features/project/work/services/workService';
import ProjectList, { defaultSortObj } from 'features/shared/components/ProjectList';
import toLocalTime from 'features/shared/lib/utils';
import { SORT_DIRECTION } from 'features/shared/constants';
import Language from 'features/shared/languages/Language';
import ProjectLayout from './components/ProjectLayout';

const defaultSort = `${defaultSortObj.column},${defaultSortObj.direction}`;

class ProjectListPage extends Component {
  constructor(props) {
    super(props);

    this.state = { projects: [], totalPage: 1 };
  }

  async componentDidMount() {
    this._getData();
  }

  async componentDidUpdate(prevProps) {
    const preLocation = prevProps.location;
    const { location } = this.props;
    const prevPage = this._getPage(preLocation);
    const currentPage = this._getPage(location);
    const prevFilter = this._getFilter(preLocation);
    const currentFilter = this._getFilter(location);
    const prevSort = this._getSort(preLocation);
    const currentSort = this._getSort(location);

    if (prevPage !== currentPage || prevFilter !== currentFilter || prevSort !== currentSort) {
      this._getData();
    }
  }

  _getData = async () => {
    const { location, history } = this.props;
    const page = this._getPage(location);
    const filter = this._getFilter(location);
    const sort = this._getSort(location);
    let _page = page;

    if (_page < 1) {
      _page = 1;
      history.push(`/projects?page=${_page}&filter=${filter}&sort=${sort}`);

      return;
    }

    const data = await projectService.listAsync(page, 5, filter, sort);
    const totalPage = parseInt((data.totalRow - 1) / data.pageSize + 1, 10);

    if (page > totalPage) {
      let _page = totalPage;

      if (_page < 1) {
        _page = 1;
      }

      history.push(`/projects?page=${_page}&filter=${filter}&sort=${sort}`);

      return;
    }

    this.setState({ projects: data.items, totalPage });
  };

  _getPage = (location) => {
    const query = new URLSearchParams(location.search);
    let page = 1;

    if (query.get('page') && !Number.isNaN(query.get('page'))) {
      page = parseInt(query.get('page'), 10);
    }

    return page;
  };

  _getFilter = (location) => {
    const query = new URLSearchParams(location.search);
    return query.get('filter') ?? '';
  };

  _getSort = (location) => {
    const query = new URLSearchParams(location.search);
    return query.get('sort') ?? defaultSort;
  };

  _handleChangePage = (page) => {
    const { history, location } = this.props;
    const filter = this._getFilter(location);
    const sort = this._getSort(location);

    history.push(`/projects?page=${page}&filter=${filter}&sort=${sort}`);
  };

  _handleSearch = async (filter) => {
    const { history, location } = this.props;
    const sort = this._getSort(location);

    history.push(`/projects?page=${1}&filter=${filter}&sort=${sort}`);
  };

  _handleSort = (sortObject) => {
    const { history, location } = this.props;
    const page = this._getPage(location);
    const filter = this._getFilter(location);

    history.push(`/projects?page=${page}&filter=${filter}&sort=${sortObject.column},${sortObject.direction}`);
  };

  _getSortObject = (sort) => {
    let [column, direction] = sort.split(',');

    if (column !== 'name' && column !== 'createdDate' && column !== 'lastModifiedDate') {
      column = 'lastModifiedDate';
    }

    if (direction !== SORT_DIRECTION.ASC && direction !== SORT_DIRECTION.DESC) {
      direction = SORT_DIRECTION.DESC;
    }

    return { column, direction };
  };

  _goToWorkPage = async (projectId) => {
    const { history } = this.props;
    const data = await workService.listAsync(projectId, 1, 1);

    if (data?.items?.length > 0) {
      history.push(`/project/${projectId}/work/${data.items[0].id}`);
    }
  };

  render() {
    const { projects, totalPage } = this.state;
    const { location } = this.props;
    const currentPage = this._getPage(location);
    const sort = this._getSortObject(this._getSort(location));
    const filter = this._getFilter(location);

    const columnSchema = [
      {
        headerName: Language.get('projectname'),
        key: 'name',
        sortable: true,
        // eslint-disable-next-line react/prop-types
        onRender: ({ id, name }) => (
          <Link className="align-middle text-primary" onClick={() => this._goToWorkPage(id)} to="#">
            {name}
          </Link>
        ),
      },
      {
        headerName: Language.get('createddate'),
        key: 'createdDate',
        format: (value) => toLocalTime(value) || null,
        sortable: true,
      },
      {
        headerName: Language.get('lastmodifieddate'),
        key: 'lastModifiedDate',
        format: (value) => toLocalTime(value) || null,
        sortable: true,
      },
      {
        headerName: '',
        key: 'action',
      },
    ];

    return (
      <ProjectLayout>
        <Container>
          <div className="mt-5">
            <ProjectList
              columns={columnSchema}
              pagingOptions={{ page: currentPage, totalPage, onChangePage: this._handleChangePage }}
              sort={sort}
              filter={filter}
              data={projects}
              onSort={this._handleSort}
              onSearch={this._handleSearch}
              onEditName={this._getData}
              onDelete={this._getData}
            />
          </div>
        </Container>
      </ProjectLayout>
    );
  }
}

export default withRouter(ProjectListPage);
