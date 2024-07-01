<script setup lang="ts">
import type { PaginatedResponse } from '@/types/common.type';
import { useQuery } from 'vue-query';

const props = withDefaults(
  defineProps<{
    queryFn?: () =>
      | any[]
      | (() => any[])
      | (() => Promise<PaginatedResponse<any>>)
      | (() => Promise<any[]>);
    options?: any[];
    queryKey?: string;
    optionLabel?: string;
    optionValue?: string;
    isLoading?: boolean;
  }>(),
  {
    optionLabel: 'name',
    optionValue: 'id',
    options: () => [],
  }
);

const queryKey = `${props.queryKey ? props.queryKey : 'options-query-key'}`;

const { data: optionsData, isLoading } = useQuery(
  [queryKey],
  () => {
    return props.queryFn ? props.queryFn() : props.options ? props.options : [];
  },
  {
    onSuccess: (data: any) => {
      data.results ? data.results : data;
    },
  }
);
</script>

<template>
  <MultiSelect
    :options="
      props.options.length
        ? props.options
        : optionsData && optionsData.results
        ? optionsData.results
        : optionsData || []
    "
    :loading="props.isLoading || isLoading"
    :optionLabel="props.optionLabel"
    :optionValue="props.optionValue"
    dataKey="id"
    clearable
    filter
    :virtualScrollerOptions="{ itemSize: 30 }"
  >
    <template #optiongroup="slotProps">
      <div class="flex align-items-center">
        <div>{{ slotProps.option.label }}</div>
      </div>
    </template>
  </MultiSelect>
</template>
