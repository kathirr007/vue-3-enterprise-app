import type {
  FilterItem,
  FilterOperators,
  SortByItem
} from '@/types/filter.type';
import dayjs from 'dayjs';
import { FilterMatchMode } from 'primevue/api';
import type { DataTableFilterMeta } from 'primevue/datatable';
import type { Ref } from 'vue';

export function useDatatableFilters() {
  const searchText = ref<string | null>();

  const filters = reactive<DataTableFilterMeta>({
    global: {
      value: searchText,
      matchMode: FilterMatchMode.CONTAINS
    }
  });

  return {
    filters,
    searchText
  };
}

export function useEncodeFilterData(data: FilterItem) {
  const encodedData: [string, string, FilterOperators, string[]][] = [];
  Object.keys(data).forEach((oneKey) => {
    if (data[oneKey] && data[oneKey].value !== undefined) {
      encodedData.push([
        oneKey,
        data[oneKey].column,
        data[oneKey].operator as FilterOperators,
        data[oneKey].value
      ]);
    }
  });
  return window.btoa(JSON.stringify(encodedData));
}
export function useEncodeSortData(data: SortByItem) {
  const encodedData: [string, string, string][] = [];
  Object.keys(data).forEach((oneKey) => {
    if (data[oneKey] && data[oneKey].value && data[oneKey].value.length > 0) {
      encodedData.push([oneKey, data[oneKey].column, data[oneKey].value]);
    }
  });
  return window.btoa(JSON.stringify(encodedData));
}

export function useDecodeFilterData(filter?: string) {
  if (!filter) {
    return {};
  }
  let data: [
    string,
    string,
    'in' | 'between' | 'by' | 'contains' | 'equals',
    string[]
  ][] = [];
  try {
    const decodedString = window.atob(filter);
    data = JSON.parse(decodedString) as [
      string,
      string,
      'in' | 'between' | 'by' | 'contains' | 'equals',
      string[]
    ][];
  }
  catch (err) {
    console.error(err);
  }
  const decodedData: FilterItem = {};
  data?.forEach((oneData) => {
    decodedData[oneData[0]] = {
      column: oneData[1],
      operator: oneData[2],
      value: oneData[3]
    };
  });
  return decodedData;
}
export function useDecodeSortData(filter?: string) {
  if (!filter) {
    return {};
  }
  let data: [string, string, string][] = [];
  try {
    const decodedString = window.atob(filter);
    data = JSON.parse(decodedString) as [string, string, string][];
  }
  catch (err) {
    console.error(err);
  }
  const decodedData: SortByItem = {};
  data?.forEach((oneData) => {
    decodedData[oneData[0]] = {
      column: oneData[1],
      value: oneData[2]
    };
  });
  return decodedData;
}

export function useFilterColumns() {
  const data: FilterItem = useApplyDefaultFilterData();
  const sortData: SortByItem = useApplyDefaultSortByData();

  function applyFilter(filterName: string, value: any) {
    data[filterName].value = value;
    return data;
  }

  function updateDateValue(field: Ref<string[]>) {
    const startDate = dayjs(field.value[0]).startOf('day').toISOString();
    const endDate = dayjs(field.value[0]).endOf('day').toISOString();
    field.value = [field.value[0], field.value[0]];
  }

  function applyDynamicFilter(
    filterName: string,
    filterField: string,
    value: any
  ) {
    data[filterName].value = value;
    data[filterName].column = filterField;
    return data;
  }

  function applySort(sortName: string, sortField: string, value: any) {
    sortData[sortName].value = value;
    sortData[sortName].column = sortField;
  }

  return {
    data,
    sortData,
    applyFilter,
    applyDynamicFilter,
    applySort,
    updateDateValue
  };
}

export function useApplyDefaultFilterData(data?: FilterItem) {
  return {
    'SearchText': {
      column: 'term',
      value: undefined,
      operator: 'contains'
    },
    'Client': {
      column: 'clientId',
      value: undefined,
      operator: 'in'
    },
    'Type': {
      column: 'type',
      value: undefined,
      operator: 'in'
    },
    'Status': {
      column: 'entityStatusId',
      value: undefined,
      operator: 'in'
    },
    'Channel': {
      column: 'channel',
      value: undefined,
      operator: 'equals'
    },
    'Project Status': {
      column: 'statusId',
      value: undefined,
      operator: 'in'
    },
    'Rating': {
      column: 'rating',
      value: undefined,
      operator: 'equals'
    },
    'Project Stages': {
      column: 'pipelineStageId',
      value: undefined,
      operator: 'in'
    },
    'Priority': {
      column: 'entityPriorityId',
      value: undefined,
      operator: 'in'
    },
    'Reported By': {
      column: 'createdUserId',
      value: undefined,
      operator: 'in'
    },
    'Assigned To': {
      column: 'assignees',
      value: undefined,
      operator: 'in'
    },
    'Tags': {
      column: 'tags',
      value: undefined,
      operator: 'in'
    },
    'Project Manager': {
      column: 'projectManagerId',
      value: undefined,
      operator: 'in'
    },
    'Reporting Manager': {
      column: 'manager',
      value: undefined,
      operator: 'in'
    },
    'Project Name': {
      column: 'projectId',
      value: undefined,
      operator: 'in'
    },
    'Start Date': {
      column: 'startDate',
      value: undefined,
      operator: 'between'
    },
    'Due Date': {
      column: 'dueDate',
      value: undefined,
      operator: 'between'
    },
    'LessThan Date': {
      column: 'dueDate',
      value: undefined,
      operator: 'lt'
    },
    'Services': {
      column: 'clientGroupComplianceId',
      value: undefined,
      operator: 'in'
    },
    'Designation': {
      column: 'designation',
      value: undefined,
      operator: 'in'
    },
    'Business Entity': {
      column: 'businessEntity',
      value: undefined,
      operator: 'in'
    },
    'Date Range': {
      column: 'scheduleDate',
      value: undefined,
      operator: 'between'
    },
    'Broadcast To': {
      column: 'isInternal',
      value: undefined,
      operator: 'in'
    },
    'Is Active': {
      column: 'isActive',
      value: undefined,
      operator: 'equals'
    },
    'Is Closed': {
      column: 'isClosed',
      value: undefined,
      operator: 'equals'
    },
    'Clients': {
      column: 'clients',
      value: undefined,
      operator: 'by'
    },
    'Invoice Date': {
      column: 'invoiceDate',
      value: undefined,
      operator: 'between'
    },
    'Is Status': {
      column: 'status',
      value: undefined,
      operator: 'in'
    },
    'FeedbackStatus': {
      column: 'status',
      value: undefined,
      operator: 'equals'
    },
    'Year': {
      column: 'year',
      value: undefined,
      operator: 'in'
    },
    'userId': {
      column: 'userId',
      value: undefined,
      operator: 'in'
    },
    'Checked In Date': {
      column: 'checkIn',
      value: undefined,
      operator: 'between'
    },
    'Date': {
      column: 'date',
      value: undefined,
      operator: 'between'
    },
    'leaveTypeId': {
      column: 'typeId',
      value: undefined,
      operator: 'in'
    },
    'Tag': {
      column: 'tag',
      value: undefined,
      operator: 'by'
    },
    'Task': {
      column: 'entityId',
      value: undefined,
      operator: 'in'
    },
    'Created By': {
      column: 'createdById',
      value: undefined,
      operator: 'in'
    },
    'Is Billing Enabled': {
      column: 'isBillingEnabled',
      value: undefined,
      operator: 'equals'
    },
    'resource': {
      column: 'resource',
      value: undefined,
      operator: 'in'
    },
    'Event': {
      column: 'event',
      value: undefined,
      operator: 'in'
    },
    'CreatedAt': {
      column: 'createdAt',
      value: undefined,
      operator: 'between'
    },
    'State': {
      column: 'stateId',
      value: undefined,
      operator: 'in'
    },
    'Federal': {
      column: 'isFederal',
      value: undefined,
      operator: 'equals'
    },
    'AssignedBy': {
      column: 'assignedById',
      value: undefined,
      operator: 'in'
    },
    'Doc Sign Status': {
      column: 'status',
      value: undefined,
      operator: 'in'
    },
    'Service': {
      column: 'serviceId',
      value: undefined,
      operator: 'in'
    },
    'PaymentStatus': {
      column: 'status',
      value: undefined,
      operator: 'in'
    },
    'Mode': {
      column: 'source',
      value: undefined,
      operator: 'in'
    },
    'ClientIds': {
      column: 'id',
      value: undefined,
      operator: 'in'
    },
    ...data
  } as FilterItem;
}
export function useApplyDefaultSortByData(data?: SortByItem) {
  return {
    'Sort By': {
      column: '',
      value: ''
    },
    ...data
  } as SortByItem;
}
