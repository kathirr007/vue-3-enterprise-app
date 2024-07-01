<script setup lang="ts">
import type { APIActions } from '@/types/common.type';
import type { FromEmail } from '@/types/fromemail.type';

const props = defineProps<{
  listData?: any;
  isLoading?: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:fromEmail', value: { data: FromEmail; action: APIActions }): void;
  (e: 'delete:fromEmail', value: { data: FromEmail; action: APIActions }): void;
}>();

const { tableAttrs } = useDataTableUtils();
const { dateToDateTime } = useVueFilters();
</script>

<template>
  <DataTable
    :value="props.listData"
    data-key="id"
    :loading="props.isLoading"
    v-bind="tableAttrs"
  >
    <Column header="Name" field="name"></Column>
    <Column header="Email" field="email"></Column>
    <Column header="Status">
      <template #body="{ data }">{{
        data.isVerified ? 'Verified' : 'Pending'
      }}</template>
    </Column>
    <Column header="Created At">
      <template #body="{ data }: { data: FromEmail }">
        {{
          `${dateToDateTime(data.createdAt).date} ${
            dateToDateTime(data.createdAt).time
          }`
        }}
      </template>
    </Column>
    <Column header="Updated At">
      <template #body="{ data }: { data: FromEmail }">
        {{
          `${dateToDateTime(data.updatedAt).date} ${
            dateToDateTime(data.updatedAt).time
          }`
        }}
      </template></Column
    >
    <Column class="w-2 text-center">
      <template #header>
        <div class="w-full text-center">Actions</div>
      </template>
      <template #body="slotProps">
        <Button
          icon="pi pi-pencil"
          class="p-button-sm p-button-rounded p-button-primary mr-2"
          @click="
            emit('update:fromEmail', {
              data: slotProps.data,
              action: 'Update',
            })
          "
        />
        <Button
          icon="pi pi-trash"
          class="p-button-sm p-button-rounded p-button-danger"
          @click="
            emit('delete:fromEmail', {
              data: slotProps.data,
              action: 'Remove',
            })
          "
        /> </template
    ></Column>
    <template #empty>
      <div class="text-center">No Email found</div>
    </template>
  </DataTable>
</template>
