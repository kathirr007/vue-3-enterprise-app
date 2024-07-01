export interface FilterItem {
  [key: string]: {
    column: string;
    value?: any;
    operator?: FilterOperators;
  };
}

export type FilterOperators =
  | ''
  | 'in'
  | 'between'
  | 'by'
  | 'contains'
  | 'lt'
  | 'equals';
export interface SortByItem {
  [key: string]: {
    column: string;
    value: string;
  };
}
