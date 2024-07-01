<script setup lang="ts">
import type { Client } from '@/types/client.type';
import { useMutation, useQueryClient } from 'vue-query';
import type { Ref } from 'vue';
import { useToasts } from '@/composables/toasts';
import { useClientRemoval } from '@/composables/client';

const { activeTabIndex, tabRef, handleTabChange } = useSteps('admin-clients');
const OpenClientCreateModal = ref(false);
const deleteClientDialog = ref(false);
const actionType = ref();
const isClientCSVImport = ref(false);

const { pluralize } = useVueFilters();
const { canDo } = usePermissions();
const { defaultBreakpoints } = useCommonBreakPoints();
const { isPortalUser } = useCurrentUserData();
const toasts = useToasts();
const queryClient = useQueryClient();
const {
  clientCounts,
  clientProjectsMessage,
  clientUsersMessage,
  isClientConnected,
  selectedClient
} = useClientRemoval();

/* const { data: clientLimits } = useQuery('client-limit', () => {
  return getResourceLimits({ resource: ResourceType.client });
});

const clientResource = computed(() => {
  const limitComputed = clientLimits.value?.[0].limit === -1 ? 0 : clientLimits.value?.[0].limit;
  const usageComputed = clientLimits.value?.[0].orgSubscriptionResourceUsages.length ? clientLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
  return { limit: limitComputed, usage: usageComputed };
}); */

const { resourceUsage: clientResource } = useUsageLimit({
  isPortalUser: isPortalUser.value,
  queryKey: 'client-limit',
  resource: 'client'
});

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
    severity: actionType.value === 'Remove' ? 'error' : 'success',
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
  actionType.value = 'Remove';
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

function handleCreateType(type: 'csv' | 'manual' | 'integration' | 'none') {
  if (type === 'csv') {
    isClientCSVImport.value = true;
  }
  else {
    isClientCSVImport.value = false;
  }
}
</script>

<template>
  <TabView ref="tabRef" v-model:activeIndex="activeTabIndex" lazy @tab-change="handleTabChange">
    <TabPanel header="Active">
      <CommonPage :title="`Active ${$tConfig('CLIENT')} List`">
        <template #actions>
          <span
            v-tooltip.left="`${clientResource.limit && (clientResource.usage >= clientResource.limit) ? `Can't create more than available limit ${clientResource.limit}` : clientResource.limit && (clientResource.usage >= clientResource.limit) ? `Available limit of ${clientResource.limit} ${pluralize($tConfig('CLIENT').toLowerCase())} already created` : `Add ${$tConfig('CLIENT')}`}`"
            class="inline-block"
          >
            <Button
              v-if="canDo('clients', 'create')" icon="pi pi-plus" class="p-button-sm p-button-rounded"
              :disabled="clientResource.limit && (clientResource.usage >= clientResource.limit)"
              @click="OpenClientCreateModal = true"
            />
          </span>
        </template>
        <CommonConfirmRemoveDialog
          v-if="selectedClient && deleteClientDialog" :visible="deleteClientDialog"
          :record-to-remove="selectedClient" :is-remove="!isClientConnected" :title="`Remove ${$tConfig('CLIENT')}`"
          :hide-buttons="isClientConnected" class="remove-dialog" @confirm="deleteClient" @hide="closeConfirmRemoveDialog"
        >
          <div v-if="isClientConnected">
            There
            <span v-if="clientCounts.users !== 0" v-html="clientUsersMessage" />
            <span v-if="clientCounts.projects !== 0" v-html="clientProjectsMessage" />
            connected to <strong>{{ selectedClient.name }}</strong>. To delete <strong>{{ selectedClient.name }}</strong>,
            please contact support Team/Admin.
          </div>
        </CommonConfirmRemoveDialog>
        <ClientsList
          v-if="canDo('clients', 'list')"
          :is-active-list="true"
          :is-closed-list="false"
          @delete:client="dataForRemove"
        />
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the {{ `${$tConfig('CLIENT')}` }}s list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
    <TabPanel header="Disabled">
      <CommonPage :title="`Disabled ${$tConfig('CLIENT')} List`">
        <CommonConfirmRemoveDialog
          v-if="selectedClient && deleteClientDialog" :visible="deleteClientDialog"
          :record-to-remove="selectedClient" :is-remove="!isClientConnected" :title="`Remove ${$tConfig('CLIENT')}`"
          :hide-buttons="isClientConnected" class="remove-dialog" @confirm="deleteClient" @hide="closeConfirmRemoveDialog"
        >
          <div v-if="isClientConnected">
            There
            <span v-if="clientCounts.users !== 0" v-html="clientUsersMessage" />
            <span v-if="clientCounts.projects !== 0" v-html="clientProjectsMessage" />
            connected to <strong>{{ selectedClient.name }}</strong>. To delete <strong>{{ selectedClient.name }}</strong>,
            please contact support Team/Admin.
          </div>
        </CommonConfirmRemoveDialog>
        <ClientsList v-if="canDo('clients', 'list')" :is-active-list="false" @delete:client="dataForRemove" />
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the {{ `${$tConfig('CLIENT')}` }}s list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
    <TabPanel
      v-if="orgType === 'LAWYER'"
      header="Closed"
    >
      <CommonPage title="Closed Cases List">
        <CommonConfirmRemoveDialog
          v-if="selectedClient && deleteClientDialog"
          :visible="deleteClientDialog"
          :record-to-remove="selectedClient"
          :is-remove="!isClientConnected"
          title="Delete Case"
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
        <ClientsList
          v-if="canDo('clients', 'list')"
          :is-closed-list="true"
          @delete:client="dataForRemove"
        />
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Cases list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
  </TabView>
  <Dialog
    v-model:visible="OpenClientCreateModal" :modal="true" append-to="body"
    :header="`${isClientCSVImport ? 'Import' : 'Create'} ${$tConfig('CLIENT')}(s)`" :breakpoints="defaultBreakpoints"
    :style="{ width: isClientCSVImport ? '40vw' : '60vw' }" content-class="border-round-bottom-md"
  >
    <ClientsCreateFlow @close="handleClose" @create-type="handleCreateType" />
  </Dialog>
</template>
