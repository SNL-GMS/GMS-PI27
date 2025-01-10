import type { IHeaderParams } from 'ag-grid-community';
import React from 'react';

function InternalDirtyDotHeaderComponent(headerParams: IHeaderParams) {
  const { column, progressSort } = headerParams;
  const [sort, setSort] = React.useState<'asc' | 'desc' | undefined>(column.getSort());

  /**
   * Change sort order. Rotates through 'asc', 'desc', and inactive.
   */
  const handleOnClick = React.useCallback(() => {
    progressSort();
  }, [progressSort]);

  /**
   * Update the interal sort state.
   */
  const onSortChanged = React.useCallback(() => {
    setSort(column.getSort());
  }, [column]);

  /**
   * Update the internal sort state when sort within the table has changed
   */
  React.useEffect(() => {
    column.addEventListener('sortChanged', onSortChanged);
  }, [column, onSortChanged]);

  return (
    <div
      role="presentation"
      onClick={handleOnClick}
      className={`ag-cell-label-container ag-header-cell-sorted-${sort ?? 'none'}`}
    >
      <div className="ag-header-cell-label">
        <span className="ag-header-cell-text">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22.627"
            height="22.628"
            viewBox="0 0 22.627 22.628"
          >
            <path
              id="Unsaved"
              className="cls-1"
              d="M400.253-4231.333H383.961a1,1,0,0,1-1-1v-16.292l-1.96-1.96,1.414-1.414,21.213,21.213-1.414,1.415Zm-14.293-9v8h13.292l-9-9H386.96A1,1,0,0,0,385.96-4240.333Zm17,6.29-3-3v-3.292a1,1,0,0,0-1-1h-3.293l-3-3h5.293v-7h1a.99.99,0,0,1,.71.291l3,3a.992.992,0,0,1,.29.709v13.293Zm-6-11.29h-3v-5h3v5h0Zm-9-3.709-2.291-2.292h2.293v2.293Z"
              transform="translate(-381 4252)"
            />
          </svg>
        </span>
        <span className="ag-header-icon ag-header-label-icon">
          {sort && <span className={`ag-icon ag-icon-${sort}`} role="presentation" />}
        </span>
      </div>
    </div>
  );
}

/**
 * Custom AG Grid HeaderComponent that displays an "Unsaved Changes" icon (a crossed-out floppy disk).
 * Can handle sort functionality as well.
 */
export const DirtyDotHeaderComponent = React.memo(InternalDirtyDotHeaderComponent);
