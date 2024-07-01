<script lang="ts" setup>
import TabView from 'primevue/tabview';
import { useRouteParams, useRouteQuery } from '@vueuse/router';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

import type { APIActions } from '@/types/common.type';
import type {
  ClientGroup,
  ClientGroupRemovePayload,
} from '@/types/client-group';
import type { Client } from '@/types/client.type';

const route = useRoute();
const clientGroupId = ref(route.params.id as string);
const queryClient = useQueryClient();
const router = useRouter();
const { getOne, remove, removeClient } = useClientGroups();
const { canDo } = usePermissions();
const { initToast } = useToasts();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const addClientsDialog = ref(false);
const removeClientGroupDialog = ref(false);
const removeClientGroupClientDialog = ref(false);
const selectedClientToRemove = ref<Client>();
const clientGroupClients = ref<Client[]>([]);
const isCreateRoute = useRouteQuery<string>('create');

const { updateBreadcrumb } = useBreadcrumbs();
const { activeIndex, activeTabIndex, handleTabChange, tabRef } = useSteps(
  'admin-client-groups-id'
);

const connectedUsers = computed(() => {
  if (clientGroupDetails.value) {
    return clientGroupDetails.value.clients;
  }
  return false;
});

const showToast = (type: APIActions) => {
  initToast({
    actionType: type,
    title: 'Client Group',
    actionObj: { ...clientGroupDetails.value },
  });
};
const handleUpdate = (payload: ClientGroup) => {
  addClientsDialog.value = false;
  // queryClient.invalidateQueries('client-group-details');
  showToast('Update');
};

const handleRemoveClient = async () => {
  await removeClientGroupClient({
    id: clientGroupDetails.value?.id as string,
    payload: {
      clientId: selectedClientToRemove.value?.id as string,
    },
  });
  queryClient.invalidateQueries('client-group-details');
};

const hendleRemoveClientGroup = async () => {
  await removeClientGroup(clientGroupDetails.value?.id as string);
};

const prepareRemoveClient = (data: Client) => {
  selectedClientToRemove.value = data;
  removeClientGroupClientDialog.value = true;
};

const { data: clientGroupDetails } = useQuery(
  ['client-group-details'],
  () => {
    if (!clientGroupId.value) return;
    return getOne(clientGroupId.value as string);
  },
  {
    onSuccess: (data: ClientGroup) => {
      if (data) {
        clientGroupClients.value = data.clients?.map((client: Client) => ({
          ...client,
          ['isClientInGroup']: true,
        })) as Client[];
        updateBreadcrumb({
          breadcrumbs: [
            { label: 'Client Groups', to: { name: 'admin-client-groups' } },
            { label: data.name },
          ],
        });
      }
    },
  }
);

const { mutateAsync: removeClientGroup } = useMutation(
  (id: string) => remove(id),
  {
    onSuccess: () => {
      initToast({
        actionType: 'Delete',
        title: 'Client Group',
        detail: `Client group <strong>${clientGroupDetails.value?.name}</strong> has been deleted successfully.`,
      });
      router.push({ name: 'admin-client-groups' });
    },
  }
);
const { mutateAsync: removeClientGroupClient } = useMutation(
  ({ id, payload }: { id: string; payload?: ClientGroupRemovePayload }) =>
    removeClient(id, payload),
  {
    onSuccess: (data: ClientGroup) => {
      if (data) {
        initToast({
          actionType: 'Delete',
          severity: 'error',
          summary: 'Delete Client',
          detail: `Client <strong>${selectedClientToRemove.value?.name}</strong> deleted from <strong>${clientGroupDetails.value?.name}</strong>`,
        });
        selectedClientToRemove.value = undefined;
      }
    },
  }
);

watchEffect(() => {
  if (activeIndex.value) {
    activeTabIndex.value = +activeIndex.value;
  }
});

onMounted(() => {
  if (isCreateRoute.value !== null) {
    addClientsDialog.value = true;
  }
});
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>
<template>
  <div>
    <div class="flex flex-column md:flex-row card align-items-end">
      <div class="w-full md:w-7 mb-2 md:mb-0">
        <div class="flex align-items-center">
          <div class="ml-2 space-y-0.5 flex-1">
            <h1 class="text-3xl text-primary mb-2">
              {{ clientGroupDetails?.name }}
            </h1>
            <div class="flex flex-column md:flex-row text-base mb-2">
              <span>
                No of Clients:
                <strong>{{ clientGroupDetails?.clients?.length }}</strong>
              </span>
            </div>
            <div class="flex flex-column md:flex-row text-base mb-2">
              <span>
                Description:
                <strong>{{ clientGroupDetails?.description }}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full md:w-5 flex justify-content-end">
        <Button
          v-if="canDo('client_groups', 'create')"
          icon="pi pi-plus"
          class="p-button-sm p-button-rounded"
          @click="addClientsDialog = true"
          v-tooltip.top="'Add or Remove Clients'"
        />
        <Button
          v-if="canDo('client_groups', 'delete')"
          icon="pi pi-trash"
          class="p-button-sm p-button-danger p-button-rounded p-button-icon-only ml-2"
          @click="removeClientGroupDialog = true"
          v-tooltip.top="'Delete'"
          :aria-label="'Delete Client Group'"
        />
      </div>
    </div>
    <div>
      <TabView
        ref="tabRef"
        v-model:activeIndex="activeTabIndex"
        @tab-change="handleTabChange"
      >
        <TabPanel header="Clients">
          <ClientsList
            :clientsList="clientGroupClients"
            hideFilters
            @delete:client="prepareRemoveClient"
            @create:client="addClientsDialog = true"
          />
        </TabPanel>
      </TabView>
    </div>
  </div>
  <CommonConfirmRemoveDialog
    v-if="removeClientGroupDialog"
    :visible="removeClientGroupDialog"
    :recordToRemove="clientGroupDetails as Record<string, any>"
    title="Delete Client Group"
    class="remove-dialog"
    :isRemove="true"
    @confirm="hendleRemoveClientGroup"
  >
    <div v-if="connectedUsers && connectedUsers.length > 0">
      There {{ connectedUsers.length > 1 ? 'are' : 'is' }}
      <strong>{{ connectedUsers.length }}</strong>
      {{ connectedUsers.length > 1 ? 'clients' : 'client' }} in
      <strong>{{ clientGroupDetails?.name }}</strong
      >. Would you like to delete <strong>{{ clientGroupDetails?.name }}</strong
      >?
    </div>
  </CommonConfirmRemoveDialog>
  <CommonConfirmRemoveDialog
    v-if="removeClientGroupClientDialog"
    :visible="removeClientGroupClientDialog"
    :recordToRemove="selectedClientToRemove as Record<string, any>"
    title="Delete Client"
    class="remove-dialog"
    :isRemove="true"
    @confirm="handleRemoveClient"
    @hide="removeClientGroupClientDialog = false"
  />
  <Dialog
    :modal="true"
    appendTo="body"
    :header="`Add or Remove Clients`"
    v-model:visible="addClientsDialog"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    :contentClass="'border-round-bottom-md'"
  >
    <ClientGroupsCreateUpdateForm
      :addClients="true"
      @addClients="handleUpdate"
      @removeClients="handleUpdate"
      :clientGroup="clientGroupDetails"
    ></ClientGroupsCreateUpdateForm>
  </Dialog>
</template>
