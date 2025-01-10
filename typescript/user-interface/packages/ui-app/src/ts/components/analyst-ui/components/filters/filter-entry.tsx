import { Icon, Tooltip } from '@blueprintjs/core';
import type { FilterTypes } from '@gms/common-model';
import { getFilterName } from '@gms/common-model/lib/filter/filter-util';
import classNames from 'classnames';
import React from 'react';

import { FilterListEntryHotkeyCycleButton } from './filter-list-icon';
import { FilterTooltipContent } from './filter-tooltip-content';

export interface FilterEntryProps {
  filter: FilterTypes.Filter;
  isActive: boolean;
  isSelected: boolean;
  isWithinHotKeyCycle: boolean;
  handleClick: () => void;
  setIsFilterWithinHotkeyCycle: (isWithinCycle: boolean) => void;
  setSelectedFilter: (filter: FilterTypes.Filter) => void;
  setRef: (ref) => void;
}

function InternalFilterEntry({
  filter,
  isActive,
  isSelected,
  isWithinHotKeyCycle,
  handleClick,
  setIsFilterWithinHotkeyCycle,
  setSelectedFilter,
  setRef
}: FilterEntryProps) {
  const filterName = getFilterName(filter);
  const [, setIsTooltipOpen] = React.useState(false);
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <li
      ref={setRef}
      tabIndex={-1}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
      role="button"
      key={filterName}
      className={classNames({
        'filter-list-entry': true,
        'filter-list-entry--selected': isSelected,
        'filter-list-entry--active': isActive
      })}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedFilter(filter);
        handleClick();
      }}
    >
      <FilterListEntryHotkeyCycleButton
        isWithinHotKeyCycle={isWithinHotKeyCycle}
        setIsFilterWithinHotkeyCycle={setIsFilterWithinHotkeyCycle}
      />
      <Tooltip
        className="filter-list-entry__tooltip-wrapper"
        canEscapeKeyClose
        content={filterName}
        hoverOpenDelay={450}
        minimal
        position="auto-start"
        isOpen={false}
        onInteraction={() => setIsTooltipOpen(true)}
        onClose={() => setIsTooltipOpen(false)}
      >
        <div className="filter-list-entry__title">
          {filterName}
          <Tooltip
            className={classNames('filter-list-entry__info', {
              'filter-list-entry__icon': true
            })}
            canEscapeKeyClose
            content={<FilterTooltipContent name={filterName} filter={filter} />}
            hoverOpenDelay={500}
            minimal
            onOpening={() => setIsTooltipOpen(false)}
            position="auto-start"
          >
            <Icon icon="info-sign" />
          </Tooltip>
        </div>
      </Tooltip>
    </li>
  );
}

export const FilterEntry = React.memo(InternalFilterEntry);
