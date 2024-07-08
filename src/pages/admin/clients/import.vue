<script setup lang="ts">
import { useClientCreateBulk } from '@/composables/client';
import router from '@/router';
import type { CreateBulkClient, ImportedClient } from '@/types/client.type';
import { useMutation, useQuery } from 'vue-query';

const { getQuickbooksClients } = useIntegrations();
const { defaultBreakpoints } = useCommonBreakPoints();
const { initToast } = useToasts();
const isDailogOpen = ref(true);
const dailogVisibility = computed({
  get: () => isDailogOpen.value && !getClientsIsLoading.value,
  set: (value) => {
    isDailogOpen.value = value;
  }
});
const { data: clients, isLoading: getClientsIsLoading } = useQuery(
  'get-integration',
  () => {
    return getQuickbooksClients();
  },
  {
    onError: () => {
      router.push({ name: 'admin-clients' });
    }
  }
);

const { mutateAsync: createBulk, isLoading: createIsLoading } = useMutation(
  useClientCreateBulk,
  {
    onSuccess: () => {
      initToast({
        actionType: 'Add',
        summary: 'Clients Import',
        detail: `Clients Import successfully.`
      });
      router.push({ name: 'admin-clients' });
    }
  }
);

async function prepareForImport(importedClients: ImportedClient[]) {
  const payload: CreateBulkClient[] = importedClients?.map(
    refactorPayload as (arg0: ImportedClient) => CreateBulkClient
  ) as CreateBulkClient[];
  await createBulk(payload);
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
</script>

<template>
  <CommonLoading v-if="getClientsIsLoading" />
  <div v-else>
    <CommonPage title="Clients Import">
      <!-- <template #description> Import Clients from QuickBooks Online </template> -->
      <div v-if="!isDailogOpen && !getClientsIsLoading" class="card">
        <ClientsImportTable
          :clients="clients?.results as ImportedClient[]"
          :loading="createIsLoading"
          @clients="prepareForImport"
        />
      </div>
    </CommonPage>
  </div>

  <Dialog
    v-model:visible="dailogVisibility"
    :modal="true"
    append-to="body"
    header="Import Clients"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <div class="px-3">
      <div class="flex justify-content-between align-items-center">
        <div class="font-medium text-lg">
          Import All Clients
          <p class="font-normal text-base mt-1">
            <strong>{{ clients?.results.length }}</strong> clients found. Use
            the import all button to import all clients into the Clients.
          </p>
        </div>
        <Button
          label="Import All"
          class="p-button-outlined"
          :loading="createIsLoading"
          @click="prepareForImport(clients?.results as ImportedClient[])"
        />
      </div>
      <Divider />
      <div class="flex justify-content-between align-items-center">
        <div class="font-medium text-lg">
          Manually Select Clients
          <p class="font-normal text-base mt-1">
            use the Select Clients buttons to individually select the clients
            you want to import into Clients
          </p>
        </div>
        <Button
          label="Select Clients"
          class="p-button-outlined"
          @click="isDailogOpen = false"
        />
      </div>
    </div>
  </Dialog>
</template>

<style lang="scss" scoped></style>
