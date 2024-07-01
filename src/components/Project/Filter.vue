<script setup lang="ts">
import type { EntityObj } from '@/types/common.type';
import type { ProjectStage } from '@/types/service.type';
import dayjs from 'dayjs';
import type { Ref } from 'vue';
import { useQuery } from 'vue-query';

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
  clientId?: string;
}>();

const router = useRouter();

const { clientId: clientIdProp } = toRefs(props);

const { pluralize } = useVueFilters();
const { isPortalUser } = useCurrentUserData();
const { getAllStatuses } = useProjectStatus();
const projectStatusesListFn = () => getAllStatuses();
const clientListFn = () => useClientList();
const usersListFn = () => useUsersListV2({ isUserNameMe: true });
const route = useRoute();
const activeIndex = ref(route.query.activeIndex);
const { allFilters } = useDataTableUtils();
const { tagsList } = useTags();
const tagListFn = () => tagsList('PROJECT', isPortalUser.value);
const { getAll: getStages } = useProjectStages();
const { data: projectTemplates } = useQuery(['project-templates'], () => {
  return useServiceListV2({});
});

const selectedClients = ref<string[]>();
const selectedProjectManager = ref<string[]>();
const selectedDueDate = ref<string[]>();
const selectedStartDate = ref<string[]>();
const selectedTags = ref<string[]>();
const selectedStages = ref<string[]>();
const selectedCountry = ref<string>();
const statesOptions = ref<any[]>();
const selectedStates = ref<string[]>();
const selectedFederal = ref<string>();
const selectedRating = ref<string>();
const stageOptions = ref<ProjectStage[]>();
const selectedServices = ref<string[]>();
const federalOptions = ref([
  { name: 'No', id: 'false' },
  { name: 'Yes', id: 'true' }
]);

const searchText = ref('');

const { isLoading: loadingStatuses } = useQuery(
  ['project-stages'],
  () => {
    if (props.disabledFilters?.includes('Project Stage'))
      return;
    return getStages();
  },
  {
    onSuccess: (data) => {
      if (data)
        stageOptions.value = data.results;
    }
  }
);

useQuery(
  ['countries-list'],
  () => {
    return useCountriesList();
  },
  {
    onSuccess: (data: { country: string }[]) => {
      selectedCountry.value = data.find(
        country => country.country === 'United States'
      )?.country;
    }
  }
);

const { isLoading: loadingStates } = useQuery(
  ['states-list', selectedCountry],
  () => {
    if (!selectedCountry.value)
      return;
    return useCountryStatesList({ country: selectedCountry.value as string });
  },
  {
    enabled: !!selectedCountry,
    onSuccess: (data: Pick<EntityObj, 'id' | 'name'>[]) => {
      // statesOptions.value = [{ id: 'isFederal', name: 'Federal' }, ...data];
      statesOptions.value = [...data];
    }
  }
);

const isStateDisabled = computed(() => !!selectedFederal.value);
const isFederalDisabled = computed(() => !!selectedStates.value?.length);

function hasFilter(filterName: string) {
  return !props.disabledFilters?.includes(filterName);
}

function getSelectedItemsLabel(itemName: string) {
  return `{0} ${itemName} selected`;
}

function applyFilters() {
  const shouldApplyFilters = [
    selectedClients.value,
    selectedStates.value,
    selectedStages.value,
    selectedProjectManager.value,
    selectedStartDate.value,
    selectedDueDate.value,
    searchText.value,
    selectedTags.value,
    selectedFederal.value,
    selectedRating.value,
    selectedServices.value
  ].some(filter => filter?.length);

  if (!shouldApplyFilters) {
    if (props.filters) {
      router.push({
        query: {
          activeIndex: activeIndex.value ? activeIndex.value : undefined,
          isServiceSelected: 'true'
        }
      });
    }
    return;
  }

  // const isFederal = selectedFederal.value === 'true';
  const selectedStatesOptions = selectedStates.value?.filter(
    (state: string) => state !== 'isFederal'
  );
  const { data: filterData, applyFilter, updateDateValue } = useFilterColumns();

  applyFilter(
    'Federal',
    selectedFederal.value ? selectedFederal.value : undefined
  );

  const serviceFilter = useDecodeFilterData(props.filters).Service;
  if (serviceFilter) {
    applyFilter('Service', serviceFilter.value);
  }

  applyFilter(
    'State',
    selectedStatesOptions?.length
      ? [...(selectedStatesOptions as string[])]
      : undefined
  );
  applyFilter(
    'Project Stages',
    selectedStages.value ? [...(selectedStages.value as string[])] : undefined
  );
  applyFilter(
    'Client',
    selectedClients.value ? [...(selectedClients.value as string[])] : undefined
  );
  applyFilter('SearchText', searchText.value);
  applyFilter(
    'Project Manager',
    selectedProjectManager.value
      ? [...(selectedProjectManager.value as string[])]
      : undefined
  );
  applyFilter(
    'Tags',
    selectedTags.value ? [...(selectedTags.value as string[])] : undefined
  );
  if (selectedStartDate.value && selectedStartDate.value[1] === null) {
    updateDateValue(selectedStartDate as Ref<string[]>);
    applyFilter('Start Date', selectedStartDate.value);
  }
  else {
    applyFilter('Start Date', selectedStartDate.value);
  }

  if (selectedDueDate.value && selectedDueDate.value[1] === null) {
    updateDateValue(selectedDueDate as Ref<string[]>);
    applyFilter('Due Date', selectedDueDate.value);
  }
  else {
    applyFilter('Due Date', selectedDueDate.value);
  }

  if (selectedServices.value?.length) {
    applyFilter('Service', selectedServices.value);
  }
  applyFilter(
    'Rating',
    selectedRating.value ? selectedRating.value : undefined
  );

  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        filters: preparedFilters,
        isServiceSelected: 'true'
      }
    });
  }
}

function resetFilters() {
  selectedStates.value = [];
  selectedStages.value = [];
  selectedClients.value = [];
  selectedProjectManager.value = [];
  selectedStartDate.value = [];
  selectedDueDate.value = [];
  selectedTags.value = [];
  selectedServices.value = [];
  searchText.value = '';
  selectedFederal.value = undefined;
  selectedRating.value = undefined;

  applyFilters();
}

defineExpose({
  searchText,
  applyFilters,
  resetFilters
});

watchEffect(() => {
  selectedClients.value = clientIdProp?.value
    ? [clientIdProp.value]
    : allFilters.value.Client.value;
  // const isFederalFilterSelected = allFilters.value['Federal'].value === 'true';
  if (allFilters.value['Project Stages']?.value) {
    selectedStages.value = allFilters.value['Project Stages']?.value;
  }
  selectedFederal.value = allFilters.value.Federal.value;
  selectedRating.value = `${allFilters.value.Rating.value}`;

  /* selectedStates.value = isFederalSelected
    ? allFilters.value['State'].value
      ? ['isFederal', ...allFilters.value['State'].value]
      : ['isFederal']
    : allFilters.value['State'].value; */
  selectedStates.value = allFilters.value.State.value;
  if (allFilters.value['LessThan Date'].value) {
    if (allFilters.value['LessThan Date'].column === 'startDate') {
      selectedStartDate.value = allFilters.value['LessThan Date']?.value?.map(
        (date: string) => dayjs(date).toDate()
      );
    }
    else {
      selectedDueDate.value = allFilters.value['LessThan Date']?.value?.map(
        (date: string) => dayjs(date).toDate()
      );
    }
  }
  selectedTags.value = allFilters.value.Tags?.value;
  selectedProjectManager.value = allFilters.value['Project Manager']?.value;
  if (allFilters.value['Start Date']?.value) {
    selectedStartDate.value = allFilters.value['Start Date']?.value?.map(
      (date: string) => dayjs(date).toDate()
    );
  }
  if (allFilters.value['Due Date']?.value) {
    selectedDueDate.value = allFilters.value['Due Date']?.value?.map(
      (date: string) => dayjs(date).toDate()
    );
  }
  if (allFilters.value.Service?.value) {
    selectedServices.value = allFilters.value.Service?.value;
  }
});
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('Project Stage')">
      <CommonMultiSelector
        v-model="selectedStages"
        :max-selected-labels="1"
        placeholder="Stage"
        option-label="name"
        :selected-items-label="getSelectedItemsLabel('Stage')"
        :options="stageOptions"
      />
    </div>
    <div v-if="hasFilter('Service')">
      <CommonMultiSelector
        v-model="selectedServices"
        :max-selected-labels="1"
        placeholder="Project Templates"
        option-label="name"
        :selected-items-label="getSelectedItemsLabel('Service')"
        :options="projectTemplates?.results"
      />
    </div>
    <div v-if="hasFilter('Federal')">
      <Dropdown
        v-model="selectedFederal"
        placeholder="Is Federal"
        option-label="name"
        option-value="id"
        :selected-items-label="getSelectedItemsLabel('States')"
        :options="federalOptions"
        :is-loading="loadingStates"
        :disabled="isFederalDisabled"
      />
    </div>
    <div v-if="hasFilter('State')">
      <CommonMultiSelector
        v-model="selectedStates"
        :max-selected-labels="1"
        placeholder="Select States"
        :selected-items-label="getSelectedItemsLabel('States')"
        :options="statesOptions"
        :is-loading="loadingStates"
        :disabled="isStateDisabled"
      />
    </div>
    <div v-if="hasFilter('Client')">
      <CommonMultiSelector
        v-model="selectedClients"
        :max-selected-labels="1"
        :placeholder="`${pluralize($tConfig('CLIENT'))}`"
        :selected-items-label="getSelectedItemsLabel(`${pluralize($tConfig('CLIENT'))}`)"
        :query-fn="(clientListFn as unknown as () => any[])"
        query-key="clients-list"
      />
    </div>
    <div v-if="hasFilter('Project Manager')">
      <CommonMultiSelector
        v-model="selectedProjectManager"
        placeholder="Project Manager"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Project Managers')"
        :query-fn="(usersListFn as unknown as () => any[])"
        query-key="users-list"
      />
    </div>
    <div v-if="hasFilter('Tag')">
      <CommonMultiSelector
        v-model="selectedTags"
        placeholder="Tag"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Tag')"
        :query-fn="(tagListFn as unknown as () => any[])"
        query-key="tags-list"
      />
    </div>
    <div v-if="hasFilter('Start Date')">
      <Calendar
        v-model="selectedStartDate"
        class="w-full"
        placeholder="Start Date"
        selection-mode="range"
        date-format="dd M yy"
        hide-on-range-selection
        show-button-bar
      />
    </div>
    <div v-if="hasFilter('Due Date')">
      <Calendar
        v-model="selectedDueDate"
        class="w-full"
        placeholder="Due Date"
        selection-mode="range"
        date-format="dd M yy"
        hide-on-range-selection
        show-button-bar
      />
    </div>
    <div v-if="hasFilter('Rating')">
      <Dropdown
        v-model="selectedRating"
        placeholder="Rating"
        :options="['1', '2', '3', '4', '5']"
      />
    </div>
    <Button
      label="Apply"
      class="w-full sm:w-auto"
      @click="applyFilters"
    />
  </div>
</template>

<style lang="scss" scoped>
.scroll-wrapper {
  overflow: auto hidden;
  overscroll-behavior: contain auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
}
</style>
