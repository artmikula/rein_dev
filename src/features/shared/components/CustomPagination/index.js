import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Pagination, PaginationItem, PaginationLink } from 'reactstrap';

class CustomPagination extends Component {
  getDisplayedPageNums = (page, totalPage) => {
    let minDisplayedPageNum = page - 2;

    if (minDisplayedPageNum + 4 > totalPage) {
      minDisplayedPageNum = totalPage - 4;
    }

    if (minDisplayedPageNum < 1) {
      minDisplayedPageNum = 1;
    }

    const displayedPageNums = [];
    let pageCount = 5;

    while (pageCount > 0 && minDisplayedPageNum <= totalPage) {
      displayedPageNums.push(minDisplayedPageNum);
      pageCount--;
      minDisplayedPageNum++;
    }

    return displayedPageNums;
  };

  render() {
    const { page, totalPage, onChangePage } = this.props;
    const displayedPageNums = this.getDisplayedPageNums(page, totalPage);

    return (
      <Pagination>
        <PaginationItem disabled={page === 1}>
          <PaginationLink first onClick={() => onChangePage(1)} />
        </PaginationItem>
        <PaginationItem disabled={page === 1}>
          <PaginationLink previous onClick={() => onChangePage(page - 1)} />
        </PaginationItem>
        {displayedPageNums.map((displayedPageNum) => {
          return (
            <PaginationItem key={displayedPageNum} active={displayedPageNum === page}>
              <PaginationLink onClick={() => onChangePage(displayedPageNum)}>{displayedPageNum}</PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem disabled={page === totalPage}>
          <PaginationLink next onClick={() => onChangePage(page + 1)} />
        </PaginationItem>
        <PaginationItem disabled={page === totalPage}>
          <PaginationLink last onClick={() => onChangePage(totalPage)} />
        </PaginationItem>
      </Pagination>
    );
  }
}

CustomPagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPage: PropTypes.number.isRequired,
  onChangePage: PropTypes.func.isRequired,
};

export default CustomPagination;
