export interface TextAreaProps {
  defaultValue: string;
  title: string;
  maxChar?: number;
  disabled?: boolean;
  /** If true, fill the entire width of the parent container */
  fillWidth?: boolean;

  /** data field for testing */
  'data-cy'?: string;

  onMaybeValue(value: any);
}
