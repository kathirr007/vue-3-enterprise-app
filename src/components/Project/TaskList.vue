<script setup lang="ts">
import { useQuery } from 'vue-query';

import type { MetaObj } from '@/types/common.type';
import type { Task } from '@/types/tasks.type';

const route = useRoute();
const projectId = ref(route.params.id as string);
const { metaFilter } = useUtilityFns();
const { isLarge } = useCommonBreakPoints();
const emit = defineEmits<{
  (e: 'update:project-task', data: Task): void;
  (e: 'remove:project-delete', data: Task): void;
}>();

const { data: projectDetails, isLoading } = useQuery('project-details', () => {
  return useProjectDetails(projectId.value as string);
});
const { filters, searchText } = useDatatableFilters();
</script>

<template>
  <DataTable
    :value="projectDetails?.entities"
    :loading="isLoading"
    responsiveLayout="scroll"
    breakpoint="768px"
    v-model:filters="filters"
    :globalFilterFields="['name']"
    :paginator="true"
    :rows="15"
    :alwaysShowPaginator="false"
    :page-link-size="isLarge ? 5 : 3"
  >
    <template #header>
      <div class="flex justify-content-end">
        <div class="p-input-icon-left mr-auto">
          <i class="pi pi-search" />
          <InputText
            v-model="searchText"
            placeholder="Search Tasks"
            type="search"
          />
        </div>
      </div>
    </template>
    <template #empty>
      <div class="text-center">No tasks found</div>
    </template>
    <Column field="name" header="Task Name" class="w-4" sortable>
      <template #body="slotProps">
        <span class="client-name">{{
          metaFilter(slotProps.data.meta as MetaObj[], 'title')
        }}</span>
      </template>
    </Column>
    <Column class="text-center w-2">
      <template #header>
        <div class="w-full text-center">Actions</div>
      </template>
      <template #body="slotProps">
        <div class="flex justify-content-center">
          <Button
            icon="pi pi-pencil"
            class="p-button-sm p-button-rounded mr-2"
            @click="emit('update:project-task', slotProps.data)"
          />
          <Button
            type="button"
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="emit('remove:project-delete', slotProps.data)"
          ></Button>
        </div>
      </template>
    </Column>
  </DataTable>
</template>
