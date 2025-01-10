export interface PositionPercentRange {
  endPercent: number;
  startPercent: number;
}

export interface MeasureWindowSelectionAreaProps {
  /** The percent start and end of the measure window selection area */
  position: PositionPercentRange | undefined;
  /** If mouse is dragging */
  isDragging: boolean;
  /** Click handler for when the measure window div is clicked */
  onClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
}
