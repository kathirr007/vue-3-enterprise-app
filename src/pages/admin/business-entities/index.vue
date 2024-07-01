<script setup lang="ts">
import type { BusinessEntity } from '@/types/business-entity.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import { useGetClientsWithBusinessEntity } from '@/composables/business-entity';
import type { Ref } from 'vue';

const isDialogVisible = ref(false);
const selectedBusinessEntity = ref<BusinessEntity>();
const deleteBusinessDialog = ref(false);
const actionType = ref();

const queryClient = useQueryClient();
const { initToast } = useToasts();
const { pluralize } = useVueFilters();
const { canDo } = usePermissions();

function prepareForUpdate(data: BusinessEntity) {
  selectedBusinessEntity.value = data;
  isDialogVisible.value = true;
}

function prepareForRemove(data: BusinessEntity) {
  selectedBusinessEntity.value = data;
  deleteBusinessDialog.value = true;
  queryClient.invalidateQueries('business-entity-client');
}
function handleOperation(dialog: Ref<boolean>, toastFn: () => void) {
  dialog.value = false;
  if (toastFn && typeof toastFn === 'function') {
    toastFn();
  }
  selectedBusinessEntity.value = undefined;
  queryClient.invalidateQueries('business-list');
}
function handleSuccess(data: BusinessEntity) {
  isDialogVisible.value = false;
  if (selectedBusinessEntity.value) {
    initToast({
      actionType: 'Update',
      severity: 'success',
      summary: `Update ${$tConfig('BUSINESS_ENTITY')}`,
      actionObj: data,
      title: `${$tConfig('BUSINESS_ENTITY')}`,
      detail: `<strong>${data.name}</strong> has been updated successfully.`
    });
  }
  else {
    initToast({
      actionType: 'Create',
      severity: 'success',
      summary: `Create ${$tConfig('BUSINESS_ENTITY')}`,
      actionObj: data,
      title: `${$tConfig('BUSINESS_ENTITY')}`,
      detail: `<strong>${data.name}</strong> has been created successfully.`
    });
  }
  selectedBusinessEntity.value = undefined;

  queryClient.invalidateQueries('business-list');
}
function closeConfirmRemoveDialog() {
  deleteBusinessDialog.value = false;
}
function showToast() {
  initToast({
    actionType: actionType.value,
    title: `${$tConfig('BUSINESS_ENTITY')}`,
    actionObj: { ...selectedBusinessEntity.value }
  });
}
function handleRemove() {
  actionType.value = 'Delete';
  handleOperation(deleteBusinessDialog, showToast);
}

const { data: selectedClientEntity } = useQuery(
  'business-entity-client',
  () => {
    if (!selectedBusinessEntity.value)
      return;
    return useGetClientsWithBusinessEntity(
      selectedBusinessEntity.value?.id as string
    );
  }
);

const isConnected = computed(() => {
  if (selectedClientEntity.value) {
    return selectedClientEntity.value?.length !== 0;
  }
  return false;
});

const { mutateAsync: removeBusinessEntity } = useMutation(
  (id: string) => useBusinessEntityDelete(id),
  {
    onSuccess: () => handleRemove()
  }
);
function openCreateBusinessEntityForm() {
  selectedBusinessEntity.value = undefined;
  isDialogVisible.value = true;
}

const modalTitle = computed(() => {
  if (selectedBusinessEntity.value) {
    return `Edit ${$tConfig('BUSINESS_ENTITY')}`;
  }
  else {
    return `Create ${$tConfig('BUSINESS_ENTITY')}`;
  }
});
const { defaultBreakpoints, styles } = useCommonBreakPoints();
async function deleteBusinessEntity() {
  if (selectedBusinessEntity.value !== undefined) {
    await removeBusinessEntity(selectedBusinessEntity.value.id);
  }
}
</script>

<template>
  <CommonPage :title="`${$tConfig('BUSINESS_ENTITY')}`">
    <template #actions>
      <Button
        v-if="canDo('business_entities', 'create')"
        v-tooltip.left="`Create ${$tConfig('BUSINESS_ENTITY')}`"
        icon="pi pi-plus"
        class="p-button-rounded"
        @click="openCreateBusinessEntityForm"
      />
    </template>
    <Dialog
      v-model:visible="isDialogVisible"
      content-class="border-round-bottom-md"
      :modal="true"
      append-to="body"
      :header="modalTitle"
      :breakpoints="defaultBreakpoints"
      :style="styles"
    >
      <BusinessEntityCreateForm
        :business-entity="selectedBusinessEntity"
        @success="handleSuccess"
      />
    </Dialog>
    <CommonConfirmRemoveDialog
      v-if="selectedBusinessEntity && deleteBusinessDialog"
      :visible="deleteBusinessDialog"
      :record-to-remove="selectedBusinessEntity as Record<string, any>"
      :title="`Remove ${$tConfig('BUSINESS_ENTITY')}`"
      class="remove-dialog"
      :hide-buttons="isConnected"
      :is-remove="!isConnected"
      @confirm="deleteBusinessEntity"
      @hide="closeConfirmRemoveDialog"
    >
      <div v-if="selectedClientEntity && selectedClientEntity.length > 0">
        There {{ selectedClientEntity.length > 1 ? 'are' : 'is' }}
        <strong>{{ selectedClientEntity.length }}</strong>
        {{ selectedClientEntity.length > 1 ? `${$tConfig('CLIENT').toLowerCase()}s` : `${$tConfig('CLIENT').toLowerCase()}` }} connected
        to <strong>{{ selectedBusinessEntity.name }}</strong>. To remove <strong>{{ selectedBusinessEntity.name }}</strong>, Please contact Support Team/Admin.
      </div>
    </CommonConfirmRemoveDialog>
    <BusinessEntityList
      v-if="canDo('business_entities', 'list')"
      @update:business-entities="prepareForUpdate"
      @delete:designation="prepareForRemove"
    />
    <div v-else class="card">
      <p class="text-center font-medium text-xl">
        You don't have access of the {{ `${pluralize($tConfig('BUSINESS_ENTITY'))}` }} list.
      </p>
    </div>
  </CommonPage>
</template>
