<script setup lang="ts">
import type {
  BroadcastTemplate,
  TemplateMessagePayload
} from '@/types/broadcast.type';

const props = defineProps<{
  messages: TemplateMessagePayload[];
}>();
const emit = defineEmits<{
  (e: 'update', data: BroadcastTemplate): void;
  (e: 'delete'): void;
  (e: 'back'): void;
}>();
const { filters } = useDatatableFilters();
const { isLarge } = useCommonBreakPoints();
const { titleCase } = useVueFilters();

const selectedMessage = ref<TemplateMessagePayload>();
const { messages } = toRefs(props);
const openMessageDeleteModal = ref(false);

function handleDelete(data: TemplateMessagePayload) {
  selectedMessage.value = data;
  openMessageDeleteModal.value = true;
}
</script>

<template>
  <DataTable
    v-model:filters="filters"
    :value="messages"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['state.name']"
    :paginator="true"
    :rows="15"
    :always-show-paginator="false"
    :page-link-size="isLarge ? 5 : 3"
  >
    <template #empty>
      <div class="text-center">
        No record found.
      </div>
    </template>
    <Column field="name" header="Subject" class="w-3">
      <template #body="slotProps">
        <span class="client-name cursor-pointer">{{
          slotProps.data.subject
        }}</span>
      </template>
    </Column>
    <Column field="Description" header="Body" class="w-3">
      <template #body="slotProps">
        <span class="client-name">{{ slotProps.data.body }}</span>
      </template>
    </Column>
    <Column field="Description" header="Channel" class="w-3">
      <template #body="slotProps">
        <span class="client-name">{{ titleCase(slotProps.data.type) }}</span>
      </template>
    </Column>
    <Column class="text-center w-3">
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="slotProps">
        <div class="md:w-full w-6rem">
          <Button
            v-tooltip.bottom="'Edit'"
            icon="pi pi-pencil"
            class="p-button-sm p-button-rounded p-button-primary mr-2"
            @click="emit('update', slotProps.data)"
          />
          <Button
            v-tooltip.bottom="'Delete'"
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger"
            disabled="true"
            @click="handleDelete(slotProps.data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
  <Button
    label="Back"
    class="max-w-max mt-3 p-button-text"
    icon="pi pi-chevron-left"
    @click="emit('back')"
  />
  <CommonConfirmRemoveDialog
    v-if="openMessageDeleteModal"
    :visible="openMessageDeleteModal"
    title="Confirm Delete User"
    @confirm="emit('delete')"
    @hide="openMessageDeleteModal = false"
  >
    Are you sure you want to delete the Message?
  </CommonConfirmRemoveDialog>
</template>

<style lang="scss" scoped></style>
