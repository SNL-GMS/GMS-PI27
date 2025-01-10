export interface YAxisProps {
  /** The height in percentage */
  heightInPercentage: number | undefined;

  /** Max amplitude as a number */
  maxAmplitude: number | undefined;

  /** Min amplitude as a number */
  minAmplitude: number | undefined;

  /** the y axis ticks */
  yAxisTicks?: number[];
}

export interface YAxisState {}
