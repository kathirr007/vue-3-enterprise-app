<script lang="ts" setup>
import type {
  ClientBillingProfile,
  CreateProfileClientPayload,
  CreateProfileDetailsPayload,
  CreateProfilePayload
} from '@/types/client-billing.type';
import type { APIActions } from '@/types/common.type';

import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { Attachment } from '@/types/attachment.type';
import type { Client } from '@/types/client.type';

const route = useRoute();
const router = useRouter();
const { initials } = useVueFilters();
const { initToast } = useToasts();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { updateBreadcrumb } = useBreadcrumbs();
const { canDo } = usePermissions();
const { getOne, update, detachClient, attachClient, getOneClients }
  = useClientBilling();
const { getAttachmentUrl } = useAttachments();
const queryClient = useQueryClient();

const { activeIndex, activeTabIndex, handleStep, handleTabChange, tabRef }
  = useSteps('admin-client-billing-id');
const billingProfileIdParam = ref(route.params.id as string);

const addClientsDialog = ref(false);
const detachClientDialog = ref(false);
const showSelectClients = ref<Client[]>([]);
const selectedClientToRemove = ref<Client>();
const clientBillingId = ref<string>(route.params.id as string);
const createProfileDialog = ref(false);

const { data: clientBillingDetailData, isLoading: loadindDetails } = useQuery(
  ['client-profile-details', clientBillingId],
  () => {
    if (!clientBillingId.value)
      return;
    return getOne(clientBillingId.value as string);
  },
  {
    onSuccess: (data: ClientBillingProfile) => {
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
        summary: `Remove ${$tConfig('CLIENT')}`,
        detail: `${$tConfig('CLIENT')} <strong>${selectedClientToRemove.value?.name}</strong> removed successfully.`
      });
      selectedClientToRemove.value = undefined;
      queryClient.invalidateQueries('clients-details-list');
    }
  }
);

function handleUpdate(payload: CreateProfileClientPayload) {
  addClientsDialog.value = false;
  showToast('Remove');
}

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

async function handleUpdateAttach(data: CreateProfileClientPayload) {
  await attachClientBilling({
    id: clientBillingId.value,
    payload: data as unknown as CreateProfileClientPayload
  });
}

const { isLoading: updataProfileLoading, mutateAsync: UpdateProfile }
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
async function handleRemoveClient() {
  await detachClientbilling({
    clients: [selectedClientToRemove.value?.id]
  });
}

function prepareRemoveClient(data: Client) {
  selectedClientToRemove.value = data;
  detachClientDialog.value = true;
}

async function handleUpdateProfileBilling(value: Partial<CreateProfileDetailsPayload> | CreateProfilePayload,
  id?: string) {
  await UpdateProfile({
    payload: value as Partial<CreateProfileDetailsPayload>,
    id: id as string
  });
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
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div>
    <div class="card flex flex-column md:flex-row mb-4 align-items-end">
      <div class="w-full md:w-7 mb-2 md:mb-0">
        <div class="flex align-items-center">
          <Avatar
            class="mr-2 p-avatar-xxl relative"
            size="large"
            shape="circle"
            :class="{ 'bg-primary': !clientBillingDetailData?.logo }"
          >
            <template v-if="clientBillingDetailData?.logo">
              <img
                class="text-sm"
                :src="`${getAttachmentUrl(
                  (clientBillingDetailData?.logo as unknown as Attachment).path,
                )}`"
                style="vertical-align: middle;"
                :alt="`${clientBillingDetailData.name}`"
              >
            </template>
            <template v-else>
              {{ initials(clientBillingDetailData?.name as string) }}
              <div class="edit-profile-pic" />
            </template>
          </Avatar>

          <div class="ml-2 space-y-0.5 flex-1">
            <h1 class="text-3xl text-primary mb-2">
              {{ clientBillingDetailData?.name }}
            </h1>
          </div>
        </div>
      </div>

      <div class="w-full md:w-5 flex justify-content-end gap-2">
        <Button
          v-if="canDo('client_billing', 'edit') && clientBillingDetailData"
          icon="pi pi-pencil"
          class="p-button-sm p-button-rounded"
          @click="createProfileDialog = true"
        />
      </div>
    </div>
    <BillingTabs
      route-name="admin-client-billing-id"
      :billing-id="clientBillingId"
    />
  </div>
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
      :loading="updataProfileLoading"
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
    :header="`Add or Remove ${$tConfig('CLIENT')}`"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
  >
    <ClientBillingAddClientForm
      :loading="attachingLoading"
      :billing-profile-clients="billingProfileClients"
      @client-form-remove="handleUpdate"
      @client-form="handleUpdateAttach"
    />
  </Dialog>
  <!-- <Dialog
    contentClass="border-round-bottom-md"
    modal
    header="Payment Gateway Integration"
    v-model:visible="isInvoiceCreate"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
  >
    <BillingInvoiceGenerate :create="true" />
  </Dialog> -->
</template>
