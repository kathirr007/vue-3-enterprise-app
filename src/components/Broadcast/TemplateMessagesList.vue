<script setup lang="ts">
import type {
  BroadcastTemplate,
  TemplateMessagePayload,
} from '@/types/broadcast.type';
const { filters } = useDatatableFilters();
const { isLarge } = useCommonBreakPoints();
const { titleCase } = useVueFilters();

const emit = defineEmits<{
  (e: 'update', data: BroadcastTemplate): void;
  (e: 'delete'): void;
  (e: 'back'): void;
}>();
const selectedMessage = ref<TemplateMessagePayload>();
const props = defineProps<{
  messages: TemplateMessagePayload[];
}>();
const { messages } = toRefs(props);
const openMessageDeleteModal = ref(false);

const handleDelete = (data: TemplateMessagePayload) => {
  selectedMessage.value = data;
  openMessageDeleteModal.value = true;
};
</script>

<template>
  <DataTable
    :value="messages"
    responsiveLayout="scroll"
    breakpoint="768px"
    v-model:filters="filters"
    :globalFilterFields="['state.name']"
    :paginator="true"
    :rows="15"
    :alwaysShowPaginator="false"
    :page-link-size="isLarge ? 5 : 3"
  >
    <template #empty>
      <div class="text-center">No record found.</div>
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
        <div class="w-full text-center">Actions</div>
      </template>
      <template #body="slotProps">
        <div class="md:w-full w-6rem">
          <Button
            icon="pi pi-pencil"
            class="p-button-sm p-button-rounded p-button-primary mr-2"
            @click="emit('update', slotProps.data)"
            v-tooltip.bottom="'Edit'"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="handleDelete(slotProps.data)"
            v-tooltip.bottom="'Delete'"
            disabled="true"
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
  ></Button>
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
