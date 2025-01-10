import type { Intent } from '@blueprintjs/core';
import type { ChannelTypes, FacetedTypes } from '@gms/common-model';
import React from 'react';

import { StringMultiSelect } from './string-multi-select';

const defaultBuildChannelTag = (
  channel: ChannelTypes.Channel | FacetedTypes.EntityReference<'name', ChannelTypes.Channel>
) => channel.name;

/**
 * The type of the props for the {@link ChannelSelector} component
 */
export interface ChannelSelectorProps {
  buildChannelTag?: (channel: ChannelTypes.Channel) => string;
  validChannels:
    | ChannelTypes.Channel[]
    | FacetedTypes.EntityReference<'name', ChannelTypes.Channel>[];
  selectedChannels:
    | ChannelTypes.Channel[]
    | FacetedTypes.EntityReference<'name', ChannelTypes.Channel>[];
  disabled?: boolean;
  placeholder?: string;
  intent?:
    | Intent
    | ((
        value: ChannelTypes.Channel | FacetedTypes.EntityReference<'name', ChannelTypes.Channel>,
        index: number
      ) => Intent);
  onChange: (
    selection: ChannelTypes.Channel[] | FacetedTypes.EntityReference<'name', ChannelTypes.Channel>[]
  ) => void;
}

/**
 * A multi-select input for channels
 */
export function ChannelSelector({
  buildChannelTag = defaultBuildChannelTag,
  selectedChannels,
  validChannels,
  disabled,
  placeholder,
  intent,
  onChange
}: ChannelSelectorProps) {
  const handleIntent = React.useCallback(
    (value: string, index: number): Intent => {
      return typeof intent === 'function'
        ? intent(
            validChannels.find(chan => chan.name === value),
            index
          )
        : intent;
    },
    [intent, validChannels]
  );
  return (
    <StringMultiSelect
      disabled={disabled}
      intent={handleIntent}
      placeholder={placeholder ?? 'No channels selected'}
      values={React.useMemo(
        () => validChannels?.map(buildChannelTag),
        [buildChannelTag, validChannels]
      )}
      selected={React.useMemo(
        () => selectedChannels?.map(buildChannelTag),
        [buildChannelTag, selectedChannels]
      )}
      onChange={React.useCallback(
        selection => {
          const selectableChannels = Array.from(new Set([...validChannels, ...selectedChannels]));
          onChange(
            selectableChannels?.filter(c => selection.find(selected => selected.includes(c.name)))
          );
        },
        [onChange, selectedChannels, validChannels]
      )}
    />
  );
}
