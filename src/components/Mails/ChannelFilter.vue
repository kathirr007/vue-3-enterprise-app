<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
}>();
const channelOptions = ref([
  { name: 'Email', value: 'EMAIL' },
  { name: 'Support', value: 'SUPPORT' }
]);

const { allFilters } = useDataTableUtils();
const activeIndex = useRouteQuery<string>('activeIndex');
const router = useRouter();

const selectedChannel = ref<string>();

function hasFilter(filterName: string) {
  return !props.disabledFilters?.includes(filterName);
}

function applyFilters() {
  const shouldApplyFilters = [selectedChannel.value].some(
    filter => filter?.length
  );

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
  applyFilter('Channel', selectedChannel.value ? selectedChannel.value : undefined);
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
  selectedChannel.value = '';
  applyFilters();
}

function getSelectedItemsLabel(itemName: string) {
  return `{0} ${itemName} selected`;
}

defineExpose({
  applyFilters,
  resetFilters
});

watchEffect(() => {
  selectedChannel.value = allFilters.value.Channel?.value;
});
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('Channel')">
      <Dropdown
        v-model="selectedChannel"
        placeholder="Select Channel"
        option-label="name"
        option-value="value"
        :options="channelOptions"
        show-clear
        :selected-items-label="getSelectedItemsLabel(`Channels`)"
      />
    </div>
    <Button label="Apply" class="w-full sm:w-auto" @click="applyFilters" />
  </div>
</template>
