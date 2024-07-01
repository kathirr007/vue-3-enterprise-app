import type { PaginatedResponse } from '@/types/common.type';
import { useRouteQuery } from '@vueuse/router';
import type {
  DataTablePageEvent,
  DataTableSortEvent,
} from 'primevue/datatable';
import type { FilterItem } from '@/types/filter.type';

interface DatatableUtilOptions {
  keysToExclude?: string[];
}

const { isLarge } = useCommonBreakPoints();
const { isFalsy, filterObjByKeys } = useUtilityFns();

const {
  applyFilter,
  applySort,
  sortData,
  data: filteredData,
} = useFilterColumns();

export function useDataTableUtils(
  options: DatatableUtilOptions = {
    keysToExclude: [],
  }
) {
  const tableRecords = ref<PaginatedResponse<any>>();
  const router = useRouter();
  const route = useRoute();
  const queryPage = useRouteQuery<string>('page');
  const queryLimit = useRouteQuery<string>('limit');
  const sortColumn = useRouteQuery<string>('sortColumn');
  const sortOrder = useRouteQuery<string>('sortOrder');
  const querySortBy = useRouteQuery<string>('sortBy');
  const queryFilters = ref(route.query.filters) as Ref<string | undefined>;
  const activeIndex = useRouteQuery<string>('activeIndex');
  const nestedActiveIndex = useRouteQuery<string>('nestedActiveIndex');
  const filtersRef = ref();
  const isFiltersVisible = ref(false);
  const searchText = ref<string | null>();
  const searchValidationMessage = ref<{ searchText: string }>({
    searchText: '',
  });
  const keysToExclude = ref([...(options.keysToExclude as string[])]);

  const currentPage = computed(() => {
    if (!queryPage.value || queryPage.value === '1') {
      return 1;
    }
    return +queryPage.value;
  });

  const currentLimit = computed(() => {
    if (!queryLimit.value) {
      return 15;
    }
    return +queryLimit.value;
  });

  const firstIndex = computed(() => {
    return (currentPage.value - 1) * currentLimit.value;
  });

  const allFilters = computed(() => {
    return useApplyDefaultFilterData(
      useDecodeFilterData(queryFilters.value as string)
    );
  });

  const allSorts = computed(() => {
    return useApplyDefaultSortByData(
      useDecodeSortData(querySortBy.value as string)
    );
  });

  const tableAttrs = computed(() => {
    return {
      lazy: true,
      autoLayout: true,
      stripedRows: true,
      firstIndex: firstIndex.value,
      first: firstIndex.value,
      paginator: true,
      pageLinkSize: isLarge.value ? 5 : 3,
      sortField: allSorts.value['Sort By'] && allSorts.value['Sort By'].column,
      sortOrder:
        allSorts.value['Sort By'] && allSorts.value['Sort By'].value === 'asc'
          ? 1
          : -1,
      rows: currentLimit.value,
      showCurrentPageReport: true,
      alwaysShowPaginator: !!(
        tableRecords.value?.total && tableRecords.value?.total >= 15
      ),
      paginatorTemplate:
        'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown',
      currentPageReportTemplate: `{first} to {last} of {totalRecords}`,
      rowsPerPageOptions: [15, 30, 50],
    };
  });

  const filtersApplied = computed(() => {
    return queryFilters.value
      ? filterObjByKeys(
          useDecodeFilterData(queryFilters.value),
          keysToExclude.value,
          true
        )
      : {};
  });

  const doesFiltersHasValues = computed(() => {
    return !!Object.values(filtersApplied.value as any)
      .map((item: any) => item.value)
      .filter((value) => !isFalsy(value)).length;
  });

  function handlePageOrLimitChange(event: DataTablePageEvent) {
    router.push({
      query: {
        ...route.query,
        page: event.page + 1,
        limit: event.rows,
        filters: queryFilters.value ? queryFilters.value : undefined,
        sortBy: querySortBy.value ? querySortBy.value : undefined,
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        nestedActiveIndex: nestedActiveIndex.value
          ? nestedActiveIndex.value
          : undefined,
      },
    });
  }

  function handleSortChange(event: DataTableSortEvent) {
    applySort(
      'Sort By',
      event.sortField as string,
      event.sortOrder === 1 ? 'asc' : 'desc'
    );

    const sortBy = useEncodeSortData(sortData);

    router.push({
      query: {
        page: currentPage.value,
        limit: currentLimit.value,
        sortBy,
        filters: queryFilters.value ? queryFilters.value : undefined,
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        nestedActiveIndex: nestedActiveIndex.value
          ? nestedActiveIndex.value
          : undefined,
      },
    });
  }

  function handleTermChange(term: string) {
    applyFilter('Title', term);

    const sortBy = useEncodeSortData(sortData);
    const filters = useEncodeFilterData(filteredData);

    router.push({
      query: {
        page: currentPage.value,
        limit: currentLimit.value,
        sortBy,
        filters,
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        nestedActiveIndex: nestedActiveIndex.value
          ? nestedActiveIndex.value
          : undefined,
      },
    });
  }

  function toggleFilters(reset: boolean) {
    if (reset && filtersRef.value) {
      filtersRef.value.resetFilters();
    } else {
      isFiltersVisible.value = !isFiltersVisible.value;
    }
  }

  const searchTerms = useDebounceFn(
    (props?: any) => {
      if (searchText.value && searchText.value.length < 3) {
        /* context.emit('searchError', {
          message: 'Search text should be atleast 3 characters long',
        }); */
        searchValidationMessage.value = {
          searchText: 'Search term should be atleast 3 characters long',
        };
        return;
      }

      if (filtersRef.value) {
        filtersRef.value.searchText = searchText.value;
        filtersRef.value.applyFilters();
        return;
      }

      if (props?.filterType === 'Clients') {
        applyFilter(
          'Is Active',
          props.isActiveList !== undefined ? `${props.isActiveList}` : undefined
        );
      }

      if (props?.filterType === 'Tasks' && props?.statusId) {
        applyFilter('Type', props.entityType ? [props.entityType] : ['TASK']);
        applyFilter('Status', props.statusId ? [props.statusId] : []);
      } else {
        applyFilter('Type', undefined);
        applyFilter('Status', undefined);
      }

      if (props?.filterType === 'Broadcasts') {
        applyFilter(
          'Broadcast To',
          props?.broadcastType === 'team' ? [true] : [false]
        );
      } else {
        applyFilter('Broadcast To', undefined);
      }
      if (props?.applyFilter) {
        props?.applyFilter(applyFilter);
      }
      applyFilter(
        'SearchText',
        searchText.value ? searchText.value : undefined
      );
      const searchFilters = useEncodeFilterData(filteredData);

      router.push({
        query: {
          page: currentPage.value,
          limit: currentLimit.value,
          sortBy: querySortBy.value ? querySortBy.value : undefined,
          filters: searchFilters,
          activeIndex: activeIndex.value ? activeIndex.value : undefined,
          nestedActiveIndex: nestedActiveIndex.value
            ? nestedActiveIndex.value
            : undefined,
          ...(props?.query ? props.query : {}),
        },
      });
    },
    1000,
    { maxWait: 5000 }
  );

  const dataTableRef = ref();

  const exportToCSV = (data: any, options?: any) => {
    dataTableRef.value.exportCSV(
      options
        ? { ...options, exportSuppressFooterLine: true }
        : { exportSuppressFooterLine: true },
      data
    );
  };

  watchEffect(() => {
    if (doesFiltersHasValues.value) {
      isFiltersVisible.value = true;
    } else if (queryFilters.value) {
      const isValidValue = Object.entries(allFilters.value)
        .map((val: any) => val[1])
        .some((item: FilterItem) => !isFalsy(item.value));
      isFiltersVisible.value = !!isValidValue;
      // isFiltersVisible.value = true;
    }

    if (allFilters.value) {
      searchText.value = allFilters.value['SearchText'].value as string;
    }
  });

  return {
    currentPage,
    currentLimit,
    sortColumn,
    sortOrder,
    firstIndex,
    tableAttrs,
    dataTableRef,
    allFilters,
    filtersRef,
    isFiltersVisible,
    filtersApplied,
    doesFiltersHasValues,
    keysToExclude,
    allSorts,
    queryFilters,
    querySortBy,
    searchText,
    searchValidationMessage,
    queryKeys: [currentPage, currentLimit, queryFilters],
    tableRecords,
    handleSortChange,
    handlePageOrLimitChange,
    handleTermChange,
    toggleFilters,
    searchTerms,
    exportToCSV,
  };
}
