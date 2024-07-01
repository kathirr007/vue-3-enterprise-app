<script setup lang="ts">
import type {
  ClientGroup,
  ClientGroupRemovePayload
} from '@/types/client-group';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { Ref } from 'vue';

const dialogHeader = ref('Create client group');
const isDialogVisible = ref(false);
const removeClientGroupDialog = ref(false);
const actionType = ref();
const selectedClientGroup = ref<ClientGroup>();

const router = useRouter();
const { initToast } = useToasts();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const queryClient = useQueryClient();
const { getAllV2 } = useClientGroups();
const { currentPage, currentLimit, queryKeys, queryFilters, querySortBy }
  = useDataTableUtils();
const { canDo, featureSubscribed } = usePermissions();

const { isLoading: loadingClientGroups, data: clientGroups } = useQuery(
  ['client-groups-list', ...queryKeys],
  () => {
    return getAllV2({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value,
      sortBy: querySortBy.value
    });
  }
);

function prepareForCreate() {
  dialogHeader.value = 'Create Client Group';
  selectedClientGroup.value = undefined;
  isDialogVisible.value = true;
}

function prepareForUpdate(data: ClientGroup) {
  dialogHeader.value = 'Update Client Group';
  selectedClientGroup.value = data;
  isDialogVisible.value = true;
}

function prepareForRemove(data: ClientGroup) {
  selectedClientGroup.value = data;
  removeClientGroupDialog.value = true;
}

function handleOperation(dialog: Ref<boolean>, toastFn: () => void) {
  dialog.value = false;
  if (toastFn && typeof toastFn === 'function') {
    toastFn();
  }
  selectedClientGroup.value = undefined;
  queryClient.invalidateQueries('client-groups-list');
}

function showToast() {
  initToast({
    actionType: actionType.value,
    title: 'Client Group',
    actionObj: { ...selectedClientGroup.value }
  });
}

function handleCreate(data: ClientGroup) {
  router.push({
    name: 'admin-client-groups-id',
    params: { id: data.id },
    query: { create: 'true' }
  });
}
function handleUpdate(data: ClientGroup) {
  actionType.value = 'Update';
  selectedClientGroup.value = data;
  handleOperation(isDialogVisible, showToast);
}

function handleRemove() {
  actionType.value = 'Delete';
  handleOperation(removeClientGroupDialog, showToast);
}

const connectedUsers = computed(() => {
  if (selectedClientGroup.value) {
    return selectedClientGroup.value._count?.clients;
  }
  return false;
});

const { mutateAsync: removeClientGroup } = useMutation(
  ({ id, payload }: { id: string; payload?: ClientGroupRemovePayload }) =>
    useClientGroupRemove(id, payload),
  {
    onSuccess: () => handleRemove()
  }
);

function handleRemoveClientGroup(val?: Record<string, any>) {
  removeClientGroup({
    id: val?.id as string,
    payload: val as unknown as ClientGroupRemovePayload
  });
}
</script>

<template>
  <Common426
    v-if="featureSubscribed('client', 'client_group') === false"
    feature="client groups"
  />
  <CommonPage v-else title="Client Groups">
    <template #actions>
      <Button
        v-if="canDo('client_groups', 'create')"
        icon="pi pi-plus"
        class="p-button-rounded"
        @click="prepareForCreate"
      />
    </template>
    <Dialog
      v-model:visible="isDialogVisible"
      :modal="true"
      append-to="body"
      :header="dialogHeader"
      :breakpoints="defaultBreakpoints"
      :style="styles"
      content-class="border-round-bottom-md"
    >
      <ClientGroupsCreateUpdateForm
        :client-group="selectedClientGroup"
        @success="handleCreate"
        @update="handleUpdate"
      />
    </Dialog>
    <CommonConfirmRemoveDialog
      v-if="selectedClientGroup && removeClientGroupDialog"
      :visible="removeClientGroupDialog"
      :record-to-remove="selectedClientGroup as Record<string, any>"
      title="Delete Client Group"
      class="remove-dialog"
      :is-remove="true"
      @confirm="handleRemoveClientGroup"
      @hide="removeClientGroupDialog = false"
    >
      <div v-if="connectedUsers">
        There {{ connectedUsers > 1 ? 'are' : 'is' }}
        <strong>{{ connectedUsers }}</strong>
        {{ connectedUsers > 1 ? 'clients' : 'client' }} in
        <strong>{{ selectedClientGroup.name }}</strong>. Would you like to delete
        <strong>{{ selectedClientGroup.name }}</strong>?
      </div>
    </CommonConfirmRemoveDialog>
    <ClientGroupsList
      v-if="canDo('client_groups', 'list')"
      :client-groups="clientGroups"
      :loading-client-groups="loadingClientGroups"
      @update:client-group="prepareForUpdate"
      @delete:client-group="prepareForRemove"
    />
    <div v-else class="card">
      <p class="text-center font-medium text-xl">
        You don't have access of the Client Groups list.
      </p>
    </div>
  </CommonPage>
</template>
