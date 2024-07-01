<script setup lang="ts">
import type { Client } from '@/types/client.type';
import { useMutation, useQueryClient } from 'vue-query';
import type { Ref } from 'vue';
import { useToasts } from '@/composables/toasts';
import { useClientRemoval } from '@/composables/client';

const OpenClientCreateModal = ref(false);
const deleteClientDialog = ref(false);
const actionType = ref();

const { defaultBreakpoints } = useCommonBreakPoints();
const toasts = useToasts();
const queryClient = useQueryClient();
const {
  clientCounts,
  clientProjectsMessage,
  clientUsersMessage,
  isClientConnected,
  selectedClient
} = useClientRemoval();

function handleOperation(dialog: Ref<boolean>, toastFn: () => void) {
  dialog.value = false;
  if (toastFn && typeof toastFn === 'function') {
    toastFn();
  }
  selectedClient.value = undefined;
  queryClient.invalidateQueries('client-list');
}

function showToast() {
  toasts.showToast({
    severity: actionType.value === 'Delete' ? 'error' : 'success',
    summary: `${actionType.value} ${$tConfig('CLIENT')}`,
    detail: `${$tConfig('CLIENT')} <strong>${selectedClient.value
      ?.name}</strong> ${actionType.value.toLowerCase()}d successfully`
  });
}

function dataForRemove(data: Client) {
  selectedClient.value = data;
  deleteClientDialog.value = true;
}
function handleRemove() {
  actionType.value = 'Delete';
  handleOperation(deleteClientDialog, showToast);
}
function closeConfirmRemoveDialog() {
  deleteClientDialog.value = false;
}

const { mutateAsync: removeClient } = useMutation(
  (id: string) => useClientRemove(id),
  {
    onSuccess: () => handleRemove()
  }
);

function deleteClient() {
  if (selectedClient.value !== undefined) {
    removeClient(selectedClient.value.id);
  }
}
function handleClose() {
  OpenClientCreateModal.value = false;
  queryClient.invalidateQueries('client-list');
}
</script>

<template>
  <CommonPage title="Reports">
    <CommonConfirmRemoveDialog
      v-if="selectedClient && deleteClientDialog"
      :visible="deleteClientDialog"
      :record-to-remove="selectedClient"
      :is-remove="!isClientConnected"
      :title="`Delete ${$tConfig('CLIENT')}`"
      :hide-buttons="isClientConnected"
      class="remove-dialog"
      @confirm="deleteClient"
      @hide="closeConfirmRemoveDialog"
    >
      <div v-if="isClientConnected">
        There
        <span v-if="clientCounts.users !== 0" v-html="clientUsersMessage" />
        <span
          v-if="clientCounts.projects !== 0"
          v-html="clientProjectsMessage"
        />
        connected to <strong>{{ selectedClient.name }}</strong>. To delete <strong>{{ selectedClient.name }}</strong>, please contact support Team/Admin.
      </div>
    </CommonConfirmRemoveDialog>
    <div>
      <ReportsList @delete:client="dataForRemove" />
    </div>
  </CommonPage>
  <Dialog
    v-model:visible="OpenClientCreateModal"
    :modal="true"
    append-to="body"
    :header="`Create ${$tConfig('CLIENT')}`"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <ClientsCreateForm @close="handleClose" />
  </Dialog>
</template>
