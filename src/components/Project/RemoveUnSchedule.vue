<script setup lang="ts">
import MultiSelect from 'primevue/multiselect';
import type { UnPlannedProject } from '@/types/project.type';
import type { SchemaForm } from '@/types/schemaform.type';
import { ProjectUnScheduledSchemaPayload } from '@/types/project.type';

const props = defineProps<{
  unPlannedClient: UnPlannedProject[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'submit', payload: string[]): void;
}>();

const selectedClient = ref();
const openActionDailog = ref<boolean>(false);

const formData = shallowRef<SchemaForm>({
  fields: [
    {
      as: MultiSelect,
      type: 'multiSelect',
      name: 'clients',
      label: 'Select Client(s)',
      optionLabel: 'client',
      optionValue: 'unScheduledProjectId',
      placeholder: 'Select Client',
      formGridClass: 'col-120. md:col-12',
      display: 'chip',
      required: true
    }
  ],
  validationSchema: ProjectUnScheduledSchemaPayload,
  btnText: 'Submit'
});

const { findFormIndex, updateOptions } = useSchemaForm(formData);
const clientsIndex = findFormIndex('clients');

watchEffect(async () => {
  if (props.unPlannedClient) {
    updateOptions(props.unPlannedClient, clientsIndex);
  }
});
async function onSubmit(values: Record<string, unknown>) {
  openActionDailog.value = true;
  selectedClient.value = values;
}
function handleAction() {
  if (selectedClient.value) {
    const payload = selectedClient.value.clients;
    emit('submit', payload);
  }
}
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :primary-btn-loading="loading"
    @submit="onSubmit"
  />
  <CommonConfirmRemoveDialog
    v-if="openActionDailog"
    :visible="openActionDailog"
    title="Confirm Delete"
    @confirm="handleAction"
    @hide="openActionDailog = false"
  >
    <div>
      <div>
        All selected
        <strong>{{ selectedClient?.clients.length }}</strong> client(s) will be
        deleted from unscheduled project.
      </div>
      Would you like to delete the selected client(s)?
    </div>
  </CommonConfirmRemoveDialog>
</template>
