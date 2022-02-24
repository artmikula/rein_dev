import projectService from 'features/project/services/projectService';
import ProjectList, { defaultSortObj } from 'features/shared/components/ProjectList';
import { SORT_DIRECTION } from 'features/shared/constants';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Container } from 'reactstrap';
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
    const { location } = this.props;
    const page = this._getPage(location);
    const filter = this._getFilter(location);
    const sort = this._getSort(location);
    const data = await projectService.listAsync(page, 5, filter, sort);
    const totalPage = parseInt((data.totalRow - 1) / data.pageSize + 1, 10);

    this.setState({ projects: data.items, totalPage });
  };

  _getPage = (location) => {
    const query = new URLSearchParams(location.search);
    let page = 1;

    if (query.get('page') && !Number.isNaN(query.get('page'))) {
      const { totalPage } = this.state;
      page = parseInt(query.get('page'), 10);

      if (page > totalPage) {
        page = totalPage;
      }

      if (page === 0) {
        page = 1;
      }
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

  render() {
    const { projects, totalPage } = this.state;
    const { location } = this.props;
    const currentPage = this._getPage(location);
    const sort = this._getSortObject(this._getSort(location));
    const filter = this._getFilter(location);

    return (
      <ProjectLayout>
        <Container>
          <div className="mt-5">
            <ProjectList
              totalPage={totalPage}
              page={currentPage}
              sort={sort}
              filter={filter}
              data={projects}
              onSort={this._handleSort}
              onSearch={this._handleSearch}
              onChangePage={this._handleChangePage}
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
