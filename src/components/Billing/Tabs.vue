<script lang="ts" setup>
import type {
  ClientBillingProfile,
  CreateProfileClientPayload,
  CreateProfileDetailsPayload,
  CreateProfilePayload
} from '@/types/client-billing.type';
import type { APIActions } from '@/types/common.type';

import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { Client } from '@/types/client.type';
import { useRouteQuery } from '@vueuse/router';

const props = defineProps<{
  billingId: string;
  routeName: string;
  isBillingPage?: boolean;
}>();
const route = useRoute();
const router = useRouter();

const { initToast } = useToasts();

const { updateBreadcrumb } = useBreadcrumbs();
const { canDo, featureSubscribed } = usePermissions();
const { getOne, update, detachClient, getOneClients, attachClient }
  = useClientBilling();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { pluralize } = useVueFilters();

const queryClient = useQueryClient();

const { activeIndex, activeTabIndex, handleTabChange, tabRef } = useSteps(
  props.routeName
);
const billingProfileIdParam = computed(() => {
  return props.billingId;
});

const addClientsDialog = ref(false);
const detachClientDialog = ref(false);
const showSelectClients = ref<Client[]>([]);
const selectedClientToRemove = ref<Client>();
const clientBillingId = computed(() => {
  return props.billingId;
});
const createProfileDialog = ref(false);
const filters = useRouteQuery('filters');

const { data: clientBillingDetailData } = useQuery(
  ['client-profile-details', clientBillingId],
  () => {
    if (!clientBillingId.value)
      return;
    return getOne(clientBillingId.value as string);
  },
  {
    onSuccess: (data: ClientBillingProfile) => {
      if (!data || props.isBillingPage)
        return;
      updateBreadcrumb({
        breadcrumbs: [
          { label: 'Client Billing', to: { name: 'admin-client-billing' } },
          {
            label: data.name
          }
        ]
      });
    }
  }
);

const { mutateAsync: detachClientbilling } = useMutation(
  (payload: Partial<CreateProfileClientPayload>) =>
    detachClient(clientBillingId.value as string, payload),
  {
    onSuccess: (data) => {
      initToast({
        actionType: 'Remove',
        severity: 'error',
        summary: `'Remove ${$tConfig('CLIENT')}`,
        detail: `${$tConfig('CLIENT')} <strong>${selectedClientToRemove.value?.name}</strong> removed successfully.`
      });
      selectedClientToRemove.value = undefined;
      queryClient.invalidateQueries('clients-details-list');
    }
  }
);

const { mutateAsync: attachClientBilling, isLoading: attachingLoading }
  = useMutation(
    ({ payload, id }: { payload: CreateProfileClientPayload; id: string }) =>
      attachClient(id, payload),
    {
      onSuccess: () => {
        initToast({
          actionType: 'Update',
          severity: 'success',
          summary: 'Success',
          detail: `${$tConfig('CLIENT')} Attached successfully`
        });
        queryClient.invalidateQueries('client-profile-details');
        queryClient.invalidateQueries('clients-details-list');
        addClientsDialog.value = false;
      }
    }
  );

function showToast(type: APIActions) {
  initToast({
    actionType: type,
    title: `${$tConfig('CLIENT')}`,
    actionObj: { ...billingProfileClients.value }
  });
}

const { data: billingProfileClients } = useQuery(
  ['clients-details-list', clientBillingId],
  () => {
    if (!clientBillingId.value)
      return;
    return getOneClients(clientBillingId.value as string);
  },
  {
    onSuccess: (data) => {
      if (data) {
        showSelectClients.value = data.map((client: Client) => ({
          ...client,
          isClientInBilling: true
        })) as Client[];
      }
    }
  }
);

const { isLoading: updateProfileLoading, mutateAsync: UpdateProfile }
  = useMutation(
    ({
      payload,
      id
    }: {
      payload: Partial<CreateProfileDetailsPayload>;
      id: string;
    }) => {
      return update(id, payload);
    },
    {
      onSuccess(data: ClientBillingProfile) {
        initToast({
          actionType: clientBillingDetailData.value ? 'Update' : 'Create',
          title: 'Client Billing',
          actionObj: data as unknown as Record<string, unknown>
        });
        createProfileDialog.value = false;
        queryClient.invalidateQueries('client-profile-details');
        queryClient.invalidateQueries('clients-details-list');
      }
    }
  );

async function handleUpdateDetails(data: CreateProfileDetailsPayload | CreateProfilePayload) {
  await UpdateProfile({
    payload: data as unknown as CreateProfileDetailsPayload,
    id: clientBillingId.value as string
  });
}

function prepareRemoveClient(data: Client) {
  selectedClientToRemove.value = data;
  detachClientDialog.value = true;
}

/* const goToGenerateInvoice = () => {
  // router.push({ name: 'admin-billing-invoices-generate' });
  isInvoiceCreate.value = true;
};

const handleInvoiceCreateBack = () => {
  isInvoiceCreate.value = false;
  selectedInvoiceToEdit.value = undefined;
};

const prepareEditInvoice = (val: ClientBillingInvoice) => {
  selectedInvoiceToEdit.value = val;
  goToGenerateInvoice();
}; */

watchEffect(() => {
  if (activeIndex.value) {
    activeTabIndex.value = +activeIndex.value;
  }
});

function handleTabs(args: any) {
  if (!props.isBillingPage) {
    handleTabChange(args);
    return;
  }
  router.push({
    query: {
      billingId: props.billingId,
      activeIndex: args.index
    }
  });
}

async function handleUpdateProfileBilling(value: Partial<CreateProfileDetailsPayload> | CreateProfilePayload,
  id?: string) {
  await UpdateProfile({
    payload: value as Partial<CreateProfileDetailsPayload>,
    id: id as string
  });
}

async function handleRemoveClient() {
  await detachClientbilling({
    clients: [selectedClientToRemove.value?.id]
  });
}

async function handleUpdateAttach(data: CreateProfileClientPayload) {
  await attachClientBilling({
    id: clientBillingId.value,
    payload: data
  });
}

function handleUpdate(payload: CreateProfileClientPayload) {
  addClientsDialog.value = false;
  showToast('Remove');
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <TabView
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    lazy
    @tab-change="handleTabs"
    @tab-click="handleTabs"
  >
    <TabPanel v-if="!isBillingPage" :header="`${pluralize($tConfig('CLIENT'))}`">
      <div class="flex justify-content-between mb-4">
        <h1 class="text-3xl text-primary">
          Assigned {{ `${pluralize($tConfig('CLIENT'))}` }}
        </h1>
        <Button
          v-if="canDo('client_billing', 'edit')"
          v-tooltip.left="`Add or Remove ${pluralize($tConfig('CLIENT'))}`"
          icon="pi pi-plus"
          class="p-button-sm p-button-rounded"
          @click="addClientsDialog = true"
        />
      </div>

      <ClientsList
        v-if="canDo('clients', 'list')"
        :clients-list="showSelectClients"
        hide-filters
        is-billing-profile
        @delete:client="prepareRemoveClient"
        @create:client="addClientsDialog = true"
      />

      <div v-else class="card">
        <p class="text-center font-medium text-xl">
          You don't have access of the {{ `${pluralize($tConfig('CLIENT'))}` }} list.
        </p>
      </div>
    </TabPanel>
    <TabPanel v-if="!isBillingPage" header="Details">
      <h1 class="text-3xl text-primary">
        Details
      </h1>
      <div v-if="clientBillingDetailData">
        <ClientBillingAddDetailsForm
          :detail-billing="clientBillingDetailData"
          hide-back-button
          btn-text
          :loading="updateProfileLoading"
          @form="handleUpdateDetails"
        />
      </div>
    </TabPanel>
    <TabPanel header="Invoices">
      <Common426
        v-if="featureSubscribed('billing', 'invoice') === false"
        feature="invoices"
      />
      <div v-else>
        <BillingInvoicesList
          v-if="true"
          :billing-profile-id="billingProfileIdParam"
        />
        <p v-else class="text-center font-medium text-xl">
          You don't have access of the Invoices list.
        </p>
      </div>
    </TabPanel>
    <TabPanel header="Payments">
      <Common426
        v-if="featureSubscribed('billing', 'payment') === false"
        feature="payments"
      />
      <CommonPage v-else title="Payments">
        <template #actions>
          <!-- <Button
            v-if="canDo('leave', 'create')"
            class="p-button"
            @click="createLeaveDialog = true"
            label="Apply For Leave"
          /> -->
        </template>
        <div class="card">
          <BillingPaymentsList
            v-if="true"
            data-permission="canDo('payments', 'list')"
            :billing-profile-id="billingProfileIdParam"
          />
          <p v-else class="text-center font-medium text-xl">
            You don't have access of the Payments list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
  </TabView>
  <Dialog
    v-model:visible="createProfileDialog"
    :modal="true"
    append-to="body"
    header="Update Name"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <ClientBillingCreateProfile
      :profile-client="clientBillingDetailData"
      :loading="updateProfileLoading"
      @profile="handleUpdateProfileBilling"
    />
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="detachClientDialog"
    :visible="detachClientDialog"
    :record-to-remove="selectedClientToRemove as Record<string, any>"
    :title="`Remove ${$tConfig('CLIENT')}`"
    class="remove-dialog"
    :is-remove="true"
    @confirm="handleRemoveClient"
    @hide="detachClientDialog = false"
  />
  <Dialog
    v-model:visible="addClientsDialog"
    :modal="true"
    append-to="body"
    :header="`Add or Remove ${pluralize($tConfig('CLIENT'))}`"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
  >
    <ClientBillingAddClientForm
      :loading="attachingLoading"
      :billing-profile-clients="billingProfileClients"
      hide-skip
      @client-form-remove="handleUpdate"
      @client-form="handleUpdateAttach"
    />
  </Dialog>
</template>

<style lang="scss" scoped></style>
