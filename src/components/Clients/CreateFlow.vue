<script setup lang="ts">
import type { ClientBulkImportRow } from '@/types/bulkimport.type';
import type { CreateBulkClient, ImportedClient } from '@/types/client.type';
import { useMutation, useQuery } from 'vue-query';
import type { XeroClient } from '@/types/integration.type';

const emit = defineEmits<{
  (e: 'createType', value: 'manual' | 'csv' | 'integration' | 'none'): void;
  (e: 'close'): void;
}>();
const { getQuickbooksUrl, getXeroContacts, getQbContacts } = useIntegrations();
const { openLinkInNewTab } = useUtilityFns();
const { pluralize } = useVueFilters();
const { initToast } = useToasts();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { isPortalUser } = useCurrentUserData();
const { featureSubscribed, isFeatureIntegrated, allOrgIntegrationIds, allIntegrationsIds, loadingOrgIntegrations, loadingIntegrations } = usePermissions(!isPortalUser.value, false, !isPortalUser.value);

const makeAPICall = ref(false);
const OpenClientCreateModal = ref(false);
const isClientBulkAdd = ref(false);
const xeroClients = ref<XeroClient[] | ImportedClient[]>([]);
const quickbookClients = ref<ImportedClient[]>([]);
const rawXeroClients = ref<XeroClient[]>([]);
const openXeroClientImport = ref(false);
const openQuickbookClientImport = ref(false);
const subscribeDialog = ref(false);
const importIntegration = ref();

const { isLoading } = useQuery(
  ['get-integration', makeAPICall],
  () => {
    if (makeAPICall.value) {
      return getQuickbooksUrl();
    }
  },
  {
    onSuccess: (data) => {
      if (data) {
        openLinkInNewTab(data.link as string);
      }
    }
  }
);

const { mutateAsync: createBulk, isLoading: createIsLoading } = useMutation(
  (payload: CreateBulkClient[]) => {
    return useClientCreateBulk(payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Add',
        summary: `${pluralize($tConfig('CLIENT'))} Import`,
        detail: `${pluralize($tConfig('CLIENT'))} Import successfully.`
      });
      emit('close');
    }
  }
);
const { mutateAsync: fetchXeroContacts, isLoading: fetchingXeroContacts }
  = useMutation(
    () => {
      return getXeroContacts();
    },
    {
      onSuccess: (data) => {
        rawXeroClients.value = data;
        xeroClients.value = refactorXeroClient(data);
        openXeroClientImport.value = true;
      }
    }
  );

const {
  mutateAsync: fetchQuickbooksContacts,
  isLoading: fetchingQuickbooksContacts
} = useMutation(
  () => {
    return getQbContacts();
  },
  {
    onSuccess: (data) => {
      quickbookClients.value = data.results;
      openQuickbookClientImport.value = true;
    }
  }
);

async function handleImport(rows: ClientBulkImportRow[]) {
  await createBulk(
    rows.map((e) => {
      return {
        ...e,
        name: e.name.trim(),
        mobile: e.mobile ? e.mobile.trim() : undefined,
        email: e.email || undefined
      };
    })
  );
}

watchEffect(() => {
  if (OpenClientCreateModal.value) {
    emit('createType', 'manual');
  }
  else if (isClientBulkAdd.value) {
    emit('createType', 'csv');
  }
  else if (makeAPICall.value) {
    emit('createType', 'integration');
  }
  else emit('createType', 'none');
});

async function connectWithXero() {
  if (featureSubscribed('client', 'xero_integration') === false) {
    importIntegration.value = 'Xero';
    subscribeDialog.value = true;
    return;
  }
  await fetchXeroContacts();
}

async function connectWithQuickbooks() {
  if (featureSubscribed('client', 'quickbooks_integration') === false) {
    importIntegration.value = 'Quickbooks';
    subscribeDialog.value = true;
    return;
  }
  await fetchQuickbooksContacts();
}

async function prepareForImport(importedClients: ImportedClient[]) {
  await createBulk(createBulkClientPayload(importedClients));
  openXeroClientImport.value = false;
}

async function prepareForImportQuickbook(importedClients: ImportedClient[]) {
  const payload: CreateBulkClient[] = importedClients?.map(
    refactorPayload as (arg0: ImportedClient) => CreateBulkClient
  ) as CreateBulkClient[];
  await createBulk(payload);
  openQuickbookClientImport.value = false;
}

function refactorPayload(client: ImportedClient) {
  return {
    name: client.DisplayName,
    email: client.PrimaryEmailAddr?.Address,
    phone: client.Mobile?.FreeFormNumber,
    address: client.BillAddr
      ? `${client.BillAddr?.Line1 ? `${client.BillAddr?.Line1},` : ''}${
          client.BillAddr?.Line2 ? ` ${client.BillAddr?.Line2},` : ''
        }${client.BillAddr?.City ? ` ${client.BillAddr?.City},` : ''}${
          client.BillAddr?.PostalCode ? ` ${client.BillAddr?.PostalCode}` : ''
        }`
      : undefined,
    city: client.BillAddr?.City,
    zip: client.BillAddr?.PostalCode,
    quickbooksId: client.Id,
    balance: client.Balance?.toString()
  };
}

function refactorXeroClient(data: XeroClient[]) {
  return data.map((client, idx) => {
    return {
      Id: idx.toString(),
      DisplayName: client.Name || `${client.FirstName} ${client.LastName}`,
      PrimaryEmailAddr: {
        Address: client.EmailAddress
      },
      Mobile:
        client.Phones.find(e => e.PhoneType === 'MOBILE')?.PhoneNumber
        || undefined,
      BillAddr:
        client.Addresses.find(e => e.AddressType === 'STREET') || undefined
    };
  }) as ImportedClient[];
}

function createBulkClientPayload(clients: ImportedClient[]) {
  return clients.map((client) => {
    const xeroClient = rawXeroClients.value[
      client.Id as unknown as number
    ] as XeroClient;
    return {
      name: client.DisplayName,
      email: client.PrimaryEmailAddr?.Address,
      mobile: client.Mobile,
      xeroId: xeroClient.ContactID,
      xeroCompanyId: xeroClient.CompanyNumber
    };
  }) as CreateBulkClient[];
}
</script>

<template>
  <div>
    <ClientsCreateForm v-if="OpenClientCreateModal" @close="emit('close')" />
    <CommonBulkImport
      v-else-if="isClientBulkAdd"
      :config="{ columns: ClientImportColumns }"
      :loading="createIsLoading"
      is-back
      import-type="Clients"
      :template-url="`/csv/brightreturn-${$tConfig('CLIENT').toLowerCase()}-import.csv`"
      @close="emit('close')"
      @import="handleImport"
      @back="isClientBulkAdd = false"
    />
    <div v-else class="px-3">
      <CommonLoading v-if="loadingOrgIntegrations || loadingIntegrations" />
      <template v-else>
        <template v-if="isFeatureIntegrated(['quickbooks'], allIntegrationsIds)">
          <div class="flex justify-content-between align-items-center">
            <div class="font-medium text-lg">
              Integrate with QuickBooks Online
              <p class="font-normal text-base mt-1">
                Integrate with QuickBooks online to mass import your {{ `${$tConfig('CLIENT').toLowerCase()}` }}s in less
                than 30 seconds.
              </p>
            </div>
            <Button
              label="Import"
              class="p-button-outlined"
              :loading="fetchingQuickbooksContacts"
              @click="connectWithQuickbooks"
            />
          </div>
          <Divider />
        </template>
        <template v-if="isFeatureIntegrated(['xero'], allIntegrationsIds)">
          <div class="flex justify-content-between align-items-center">
            <div class="font-medium text-lg">
              Integrate with Xero
              <p class="font-normal text-base mt-1">
                Integrate with Xero online to mass import your {{ `${$tConfig('CLIENT').toLowerCase()}` }}s in less than
                30 seconds.
              </p>
            </div>
            <Button
              label="Import"
              class="p-button-outlined"
              :loading="fetchingXeroContacts"
              @click="connectWithXero"
            />
          </div>
          <Divider />
        </template>
        <div class="flex justify-content-between align-items-center">
          <div class="font-medium text-lg">
            Bulk Add {{ `${$tConfig('CLIENT')}` }}s via CSV
            <p class="font-normal text-base mt-1">
              Upload a CSV file to bulk add your {{ `${$tConfig('CLIENT').toLowerCase()}` }}s.
            </p>
          </div>
          <Button
            label="Add via CSV"
            class="p-button-outlined"
            @click="isClientBulkAdd = true"
          />
        </div>
        <Divider />
        <div class="flex justify-content-between align-items-center">
          <div class="font-medium text-lg">
            Manually Enter Information
            <p class="font-normal text-base mt-1">
              Manually enter your {{ `${$tConfig('CLIENT').toLowerCase()}` }} information to get started.
            </p>
          </div>
          <Button
            label="Add Manually"
            class="p-button-outlined"
            @click="OpenClientCreateModal = true"
          />
        </div>
      </template>
    </div>
    <Dialog
      v-model:visible="openXeroClientImport"
      content-class="border-round-bottom-md"
      :modal="true"
      append-to="body"
      :header="`Import ${pluralize($tConfig('CLIENT'))}`"
      :breakpoints="defaultBreakpoints"
      :style="{ width: '80%' }"
    >
      <ClientsImportTable
        :clients="(xeroClients as ImportedClient[])"
        :loading="createIsLoading"
        @clients="prepareForImport"
      />
    </Dialog>
    <Dialog
      v-model:visible="openQuickbookClientImport"
      content-class="border-round-bottom-md"
      :modal="true"
      append-to="body"
      :header="`Import ${pluralize($tConfig('CLIENT'))}`"
      :breakpoints="defaultBreakpoints"
      :style="{ width: '80%' }"
    >
      <ClientsImportTable
        :clients="(quickbookClients as ImportedClient[])"
        :loading="createIsLoading"
        @clients="prepareForImportQuickbook"
      />
    </Dialog>
    <CommonSubscribeDialog
      v-if="subscribeDialog"
      :visible="subscribeDialog"
      :feature="importIntegration"
      @hide="subscribeDialog = false"
    />
  </div>
</template>
