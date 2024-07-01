<script setup lang="ts">
import type {
  ClientGroup,
  ClientGroupRemovePayload
} from '@/types/client-group';
import { useMutation, useQueryClient } from 'vue-query';
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
const { canDo } = usePermissions();

function gotoCreateContact() {
  router.push({ name: 'admin-contacts-create' });
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
  <CommonPage :title="`${$tConfig('CONTACT')}s`">
    <template #actions>
      <Button
        v-if="canDo('contacts', 'create')"
        v-tooltip.left="`Add ${$tConfig('CONTACT')}`"
        icon="pi pi-plus"
        class="p-button-rounded"
        @click="gotoCreateContact"
      />
    </template>

    <ContactsList v-if="canDo('contacts', 'list')" />
    <div v-else class="card">
      <p class="text-center font-medium text-xl">
        You don't have access of the {{ `${$tConfig('CONTACT')}` }}s list.
      </p>
    </div>
  </CommonPage>
</template>
