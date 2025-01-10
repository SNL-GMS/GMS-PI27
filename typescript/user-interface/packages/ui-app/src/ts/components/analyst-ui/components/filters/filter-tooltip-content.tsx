import { H6 } from '@blueprintjs/core';
import { type FilterTypes, FilterUtil } from '@gms/common-model';
import { LabelValue } from '@gms/ui-core-components';
import classNames from 'classnames';
import React from 'react';

const filterTooltipContainer = 'filter-list-tooltip__container';

interface FilterTooltipTableEntryProps {
  children?: React.ReactNode;
  label: string;
  value: string | number | boolean;
  monospace?: boolean;
}

function FilterTooltipTableEntry({
  children = null,
  label,
  monospace,
  value
}: FilterTooltipTableEntryProps) {
  if (value == null || label == null) {
    return null;
  }
  return (
    <>
      <LabelValue
        label={label}
        value={
          <span className={classNames({ monospace: typeof value === 'number' || monospace })}>
            {value.toString()}
          </span>
        }
        tooltip={value.toString()}
        containerClass={filterTooltipContainer}
      />
      {children != null && <section className="filter-list-tooltip__group">{children}</section>}
    </>
  );
}

/**
 * The type of the props for the {@link FilterTooltipContent} component
 */
export interface FilterTooltipContentProps {
  name: string;
  filter: FilterTypes.Filter;
}

/**
 * The contents of the filter tooltip. Shows the details about the filter that are known
 */
export function FilterTooltipContent({ name, filter }: FilterTooltipContentProps) {
  return (
    <div className="filter-tooltip-content">
      <H6>{name}</H6>
      <FilterTooltipTableEntry
        key="Type"
        label="Type"
        monospace
        value={filter.filterDefinition?.filterDescription.filterType}
      />
      <FilterTooltipTableEntry
        key="Comments"
        label="Comments"
        value={filter.filterDefinition?.comments}
      >
        {FilterUtil.isCascadeFilterDescription(filter.filterDefinition?.filterDescription) &&
          filter.filterDefinition?.filterDescription.filterDescriptions.map(
            (cfd: FilterTypes.FilterDescription, index: number) => (
              <FilterTooltipTableEntry
                // this is an ordered list, so the index is meaningful as an ID
                key={`FD Comments ${index + 1}`}
                label={`Filter ${index + 1}`}
                value={cfd.comments}
              />
            )
          )}
      </FilterTooltipTableEntry>
      <FilterTooltipTableEntry
        key="Pass band type"
        label="Pass band type"
        monospace
        value={
          FilterUtil.isLinearFilterDescription(filter.filterDefinition?.filterDescription)
            ? filter.filterDefinition?.filterDescription.passBandType
            : undefined
        }
      />
      <FilterTooltipTableEntry
        key="Low frequency"
        label="Low frequency"
        value={
          FilterUtil.isLinearFilterDescription(filter.filterDefinition?.filterDescription)
            ? filter.filterDefinition?.filterDescription.lowFrequencyHz
            : undefined
        }
      />
      <FilterTooltipTableEntry
        key="High frequency"
        label="High frequency"
        value={
          FilterUtil.isLinearFilterDescription(filter.filterDefinition?.filterDescription)
            ? filter.filterDefinition?.filterDescription.highFrequencyHz
            : undefined
        }
      />
      <FilterTooltipTableEntry
        key="Causal"
        label="Causal"
        monospace
        value={filter.filterDefinition?.filterDescription.causal}
      />
      <FilterTooltipTableEntry
        key="Order"
        label="Order"
        value={
          FilterUtil.isLinearFilterDescription(filter.filterDefinition?.filterDescription)
            ? filter.filterDefinition?.filterDescription.order
            : undefined
        }
      />
      <FilterTooltipTableEntry
        key="Zero phase"
        label="Zero Phase"
        monospace
        value={
          FilterUtil.isLinearFilterDescription(filter.filterDefinition?.filterDescription)
            ? filter.filterDefinition?.filterDescription.zeroPhase
            : undefined
        }
      />
    </div>
  );
}
