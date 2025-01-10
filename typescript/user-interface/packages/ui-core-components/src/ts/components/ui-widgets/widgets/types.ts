export interface WidgetProps {
  type: WidgetInputType;
  defaultValue: any;
  params?: any;
  isValid?: boolean;

  /** data field for testing */
  dataCy?: string;

  onMaybeValue(maybeValue: any | undefined);
  onValidStatus?(isValid: boolean);
}
export interface WidgetState {
  isValid: boolean;
  value: any;
}

export interface TextAreaState extends Omit<WidgetState, 'isValid'> {
  maxChar: number | undefined;
  charsLeft: number | undefined;
  isValid?: boolean;
}
export interface WidgetData {
  type: WidgetInputType;
  defaultValue: any;
  params?: any;
}
export enum WidgetInputType {
  DropDown = 'DropDown',
  TextArea = 'TextArea',
  FilterableOptionList = 'FilterableOptionList'
}
export interface FilterableOptionListParams {
  options: string[];
  priorityOptions?: string[];
  defaultFilter?: string;
}
export interface DropDownParams {
  dropDownItems: any;
}
export interface TimePickerParams {
  maxValueMs: number;
  minValueMs: number;
}
