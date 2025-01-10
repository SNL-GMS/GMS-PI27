import { Radio, RadioGroup } from '@blueprintjs/core';
import type { FilterTypes } from '@gms/common-model';
import { FkTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-util';
import React from 'react';

const logger = UILogger.create('FK_RENDERING_FOOTER', process.env.FK_RENDERING_FOOTER);

export interface FkRenderingFooterProps {
  /**
   * Unit to be displayed, {@link FkTypes.FkUnits.FSTAT FSTAT} or
   * {@link FkTypes.FkUnits.POWER POWER}.
   */
  selectedFkUnit: FkTypes.FkUnits;
  /**  Fequency band applied when the FK spectra was computed */
  fkFrequencyRange: FkTypes.FkFrequencyRange;
  /** Prefilter applied when the FK spectra was computed */
  preFilter: FilterTypes.FilterDefinition | undefined;
  /** Setter function for the FK unit */
  setSelectedFkUnit: (fkUnit: FkTypes.FkUnits) => void;
}

export function FkRenderingFooter({
  selectedFkUnit,
  preFilter,
  fkFrequencyRange,
  setSelectedFkUnit
}: FkRenderingFooterProps) {
  const handleRadioChange = React.useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      switch (event.currentTarget.value) {
        case FkTypes.FkUnits.FSTAT:
        case FkTypes.FkUnits.POWER:
          setSelectedFkUnit(event.currentTarget.value);
          break;
        default:
          logger.error(`Invalid FK Unit ${event.currentTarget.value} selected`);
      }
    },
    [setSelectedFkUnit]
  );
  const fkBand = `${fkFrequencyRange?.lowFrequencyHz} - ${fkFrequencyRange?.highFrequencyHz} Hz`;

  return (
    <div className="fk-rendering-footer">
      <RadioGroup
        className="fk-rendering-footer__radio"
        onChange={handleRadioChange}
        inline
        selectedValue={selectedFkUnit}
      >
        <Radio label="Fstat" value={FkTypes.FkUnits.FSTAT} />
        <Radio label="Power" value={FkTypes.FkUnits.POWER} />
      </RadioGroup>
      <div className="fk-rendering-footer__info">
        <span className="fk-rendering-footer__info-prefilter" title={preFilter?.name ?? undefined}>
          Prefilter: {preFilter?.name ?? 'N/A'}
        </span>
        <span className="fk-rendering-footer__info-fk-band" title={fkBand}>
          FK Band: {fkBand}
        </span>
      </div>
    </div>
  );
}
