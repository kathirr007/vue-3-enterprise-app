<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';

const props = withDefaults(
  defineProps<{
    disabledFilters?: string[];
    filters?: string;
    isActiveList?: boolean;
    isClosedList?: boolean;
  }>(),
  {
    isActiveList: undefined,
    isClosedList: undefined
  }
);

const router = useRouter();

const activeIndex = useRouteQuery<string>('activeIndex');
const { isPortalUser } = useCurrentUserData();
const { allFilters } = useDataTableUtils();
const { tagsList } = useTags();

const tagListFn = () => tagsList('CLIENT', isPortalUser.value);
const businessEntityListFn = () => useBusinessEntityListV2({});
const selectedBusinessEntity = ref<string[]>();
const selectedTags = ref<string[]>();
const selectedRating = ref<string>();

const searchText = ref('');

defineExpose({
  searchText,
  applyFilters,
  resetFilters
});

function hasFilter(filterName: string) {
  return !props.disabledFilters?.includes(filterName);
}

function getSelectedItemsLabel(itemName: string) {
  return `{0} ${itemName} selected`;
}

function applyFilters() {
  const shouldApplyFilters = [
    selectedBusinessEntity.value,
    searchText.value,
    selectedTags.value,
    selectedRating.value
  ].some(filter => filter?.length);

  if (!shouldApplyFilters) {
    if (props.filters) {
      router.push({
        query: {
          activeIndex: activeIndex.value ? activeIndex.value : undefined
        }
      });
    }
    return;
  }

  const { data: filterData, applyFilter } = useFilterColumns();
  applyFilter(
    'Is Active',
    props.isActiveList !== undefined ? `${props.isActiveList}` : undefined
  );
  applyFilter(
    'Is Closed',
    props.isClosedList !== undefined ? `${props.isClosedList}` : undefined
  );
  applyFilter('SearchText', searchText.value);
  applyFilter(
    'Tags',
    selectedTags.value ? [...(selectedTags.value as string[])] : undefined
  );
  applyFilter(
    'Business Entity',
    selectedBusinessEntity.value
      ? [...(selectedBusinessEntity.value as string[])]
      : undefined
  );
  applyFilter(
    'Rating',
    selectedRating.value ? selectedRating.value : undefined
  );

  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        filters: preparedFilters
      }
    });
  }
}

function resetFilters() {
  selectedBusinessEntity.value = [];
  selectedTags.value = [];
  searchText.value = '';
  selectedRating.value = undefined;
  applyFilters();
}

watchEffect(() => {
  selectedBusinessEntity.value = allFilters.value['Business Entity'].value;
  selectedTags.value = allFilters.value.Tags?.value;
  selectedRating.value = `${allFilters.value.Rating.value}`;
});
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('BusinessEntity')">
      <CommonMultiSelector
        v-model="selectedBusinessEntity"
        :placeholder="`${$tConfig('BUSINESS_ENTITY')}`"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel(`${$tConfig('BUSINESS_ENTITY')}`)"
        :query-fn="(businessEntityListFn as unknown as () => any[])"
        query-key="business-entities-list"
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
