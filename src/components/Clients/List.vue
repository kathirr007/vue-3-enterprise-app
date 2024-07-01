<script setup lang="ts">
import type {
  Client,
  Contract,
  ShareContractPayload
} from '@/types/client.type';
import { shareContractSchema } from '@/types/client.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { SchemaForm } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import StarRating from 'vue-star-rating';

const props = withDefaults(
  defineProps<{
    userId?: string;
    isActiveList?: boolean;
    isClosedList?: boolean;
    clientsList?: Client[];
    hideFilters?: boolean;
    disabledFilters?: string[];
    isBillingProfile?: boolean;
    isContactList?: boolean;
  }>(),
  { disabledFilters: () => [], hideFilters: false, isActiveList: undefined, isClosedList: undefined }
);
const emit = defineEmits<{
  (e: 'delete:client', data: Client): void;
  (e: 'create:client'): void;
}>();

const { filters, searchText: staticSearchText } = useDatatableFilters();
const { useShareContract } = useEngagementLetter();
const { initToast } = useToasts();
const { metaFilter, isFalsy, filterObjByKeys } = useUtilityFns();
const { defaultBreakpoints } = useCommonBreakPoints();
const { canDo } = usePermissions();
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,
  toggleFilters,
  tableAttrs,
  queryKeys,
  filtersRef,
  isFiltersVisible,
  queryFilters,
  querySortBy,
  tableRecords,
  doesFiltersHasValues
} = useDataTableUtils({
  keysToExclude: ['Is Active', 'Is Closed']
});
const queryClient = useQueryClient();
const { ratingOptions } = useFeedback();

const appMenuControls = allMenuControls;

const selectedContract = ref<Contract>();
const selectedClient = ref<Client>();
const generateEngagementLetterDialog = ref(false);
const shareDialog = ref(false);
const clients = ref<Client[]>([]);

const { data: filterData, applyFilter } = useFilterColumns();

const initialFilters = computed(() => {
  applyFilter(
    'Is Active',
    props.isActiveList !== undefined ? `${props.isActiveList}` : undefined
  );
  applyFilter(
    'Is Closed',
    props.isClosedList !== undefined ? `${props.isClosedList}` : undefined
  );

  const initialFiltersString = useEncodeFilterData(filterData);
  return initialFiltersString;
});

// const initialFilters = useEncodeFilterData(filterData);
const {
  isLoading: loadingClients,
  isFetching: fetchingClients,
  data: clientData
} = useQuery(
  ['client-list', props.userId, ...queryKeys],
  async () => {
    if (props.clientsList)
      return props.clientsList;
    if (!props.userId) {
      return useClientListV2({
        page: currentPage.value,
        limit: currentLimit.value,
        filters: queryFilters.value ? queryFilters.value : initialFilters.value,
        sortBy: querySortBy.value
      });
    }
    if (props.userId) {
      const filtersJSON = useDecodeFilterData(queryFilters.value);
      const filterKeys = Object.keys(filtersJSON);
      if ((filterKeys as string[]).includes('Client'))
        return;
      return useUserSingleClientV2({
        id: props.userId as string,
        page: currentPage.value,
        limit: currentLimit.value,
        filters: queryFilters.value ? queryFilters.value : initialFilters.value,
        sortBy: querySortBy.value
      });
    }
  },
  {
    onSuccess: (data: any) => {
      clients.value = data.results ? data.results : data;
      tableRecords.value = data;
    }
  }
);
const { getAttachmentUrl } = useAttachments();
const formData = shallowRef<SchemaForm>({
  fields: [
    {
      as: InputText,
      name: 'email',
      label: 'Email',
      type: 'text',
      placeholder: 'Enter Email',
      required: true
    }
  ],
  btnText: 'Share',
  validationSchema: shareContractSchema,
  initialValues: {}
});

function handleSuccess() {
  generateEngagementLetterDialog.value = false;
  queryClient.invalidateQueries('client-list');
  selectedContract.value = undefined;
}

const { mutateAsync: shareContract } = useMutation(
  (payload: ShareContractPayload) => {
    return useShareContract(
      selectedClient.value?.id as string,
      selectedContract.value?.id as string,
      payload
    );
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Contract Document Update',
        detail: `${
          selectedContract?.value?.status === 'GENERATED_LINK'
            ? 'Link'
            : 'Document'
        } has been shared successfully`
      });
      shareDialog.value = false;
      queryClient.invalidateQueries('client-list');
    }
  }
);
function handleDownload(data: Contract) {
  const mappedAttachments = data.attachments?.map((attachment) => {
    return {
      ...attachment,
      url: getAttachmentUrl(attachment.path),
      updatedAt: new Date(attachment.updatedAt).getTime()
    };
  });
  const sortedAttachments = mappedAttachments?.sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.href = sortedAttachments?.[0].url;
  a.download = sortedAttachments[0].name;
  a.click();
}

function handleShare(data: Record<string, any>) {
  const payload = { ...data };
  payload.isDocument
    = selectedContract.value?.status !== 'GENERATED_LINK';
  payload.link
    = selectedContract.value?.status !== 'GENERATED_LINK'
      ? getAttachmentUrl(`${selectedContract.value?.attachments[0].path}`)
      : `${window.location.origin}/contracts/${selectedContract.value?.id}`;

  shareContract(payload as unknown as ShareContractPayload);
}
// const clientName = computed(() => {
//   if (clientData.value) {
//     return clientData.value?.map((el: Client) => el?.name);
//   } else {
//     return clientData?.value;
//   }
// });
// const businessEntityValue = computed(() => {
//   if (clientData.value) {
//     return clientData.value?.map((el: Client) => el.businessEntity);
//   } else {
//     return clientData.value;
//   }
// });

function handleStatusOperations(data: Client) {
  const contracts = data.contracts;
  const showGenerate = contracts?.length > 0 && contracts[0].status === 'OPEN';
  const showDownload
    = contracts?.length > 0
    && (contracts[0].status === 'ATTACHED'
    || contracts[0].status === 'GENERATED_DOCUMENT'
    || contracts[0].status === 'SIGNED');
  const showShare = () => {
    return {
      value: contracts?.length > 0 && contracts[0].status !== 'OPEN',
      tooltip:
        `Share${
        contracts.length > 0
          ? contracts[0].status === 'GENERATED_LINK'
            ? ' Link'
            : ' Document'
          : ''}`
    };
  };
  return { showGenerate, showDownload, showShare };
}
</script>

<template>
  <DataTable
    v-bind="{ ...tableAttrs, lazy: !clientsList?.length }"
    v-model:filters="filters"
    :value="clientsList || clients"
    :total-records="clientsList?.length || clientData?.total"
    :loading="loadingClients || fetchingClients"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['name', 'businessEntity.name', 'email']"
    sort-mode="single"
    @page="!clientsList?.length && handlePageOrLimitChange($event)"
    @sort="!clientsList?.length && handleSortChange($event)"
  >
    <template #header>
      <div class="flex justify-content-end">
        <div v-if="clientsList" class="p-input-icon-left mr-auto">
          <i class="pi pi-search" />
          <InputText
            v-model="staticSearchText"
            aria-label="Search List"
            :placeholder="`Search ${$tConfig('CLIENT')}s`"
            type="search"
          />
        </div>
        <CommonListSearchInput
          v-else
          v-bind="{
            listProps: { ...props, filterType: 'Clients' },
            placeholder: `Search ${$tConfig('CLIENT')}s`,
          }"
        />

        <Button
          v-if="!hideFilters"
          type="button"
          :icon="doesFiltersHasValues ? 'pi pi-filter-slash' : 'pi pi-filter'"
          class="p-button-icon-only p-button-rounded"
          :class="[{ 'p-button-danger': doesFiltersHasValues }]"
          @click="toggleFilters(!!doesFiltersHasValues)"
        />
      </div>
      <div v-if="isFiltersVisible && !hideFilters" class="my-2">
        <ClientsFilter
          ref="filtersRef"
          :filters="queryFilters"
          :disabled-filters="disabledFilters"
          :is-active-list="isActiveList"
          :is-closed-list="isClosedList"
        />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No {{ `${$tConfig('CLIENT').toLowerCase()}` }} record found.
      </div>
    </template>
    <Column header="Name" class="w-3">
      <template #body="{ data }">
        <router-link
          :to="{ name: 'admin-clients-id', params: { id: data.id } }"
          class="flex align-items-center font-medium text-gray-900 cursor-pointer hover:text-gray-600"
          :class="{ 'pointer-events-none': !canDo('clients', 'single') }"
        >
          <Avatar
            v-if="
              data?.businessEntity
                && data?.businessEntity?.name === 'Individual'
            "
            class="mr-2 bg-primary text-2xl line-height-3"
            size="large"
            shape="circle"
            icon="pi
          pi-user"
          />
          <Avatar
            v-else
            class="mr-2 bg-primary text-2xl line-height-3"
            size="large"
            shape="circle"
            icon="pi
          pi-building"
          />
          <div class="flex flex-column flex-1">
            <span class="client-name">{{ data.name }}</span>
          </div>
        </router-link>
      </template>
      <!-- <template #filter="{ filterModel }">
        <div class="mb-3 font-bold">Client</div>
        <MultiSelect
          v-model="filterModel.value"
          :options="clientName"
          class="p-column-filter"
        >
          <template #option="data">
            <div class="p-multiselect-representative-option">
              <Avatar
                class="mr-2"
                size="large"
                shape="circle"
                icon="pi
          pi-user"
                :class="'bg-primary text-2xl line-height-3'"
              />

              <span class="image-text">{{ data.option }}</span>
            </div>
          </template>
        </MultiSelect>
      </template> -->
    </Column>
    <Column :header="`${$tConfig('BUSINESS_ENTITY')}`">
      <template #body="{ data }">
        {{ data?.businessEntity?.name || `No ${$tConfig('BUSINESS_ENTITY')} Available` }}
      </template>
    </Column>
    <Column header="Contact">
      <template #body="{ data }">
        <div class="flex flex-column gap-1">
          <div
            v-if="metaFilter(data.meta, 'email')"
            class="flex align-items-center break-all"
          >
            <a
              :href="`mailto:${metaFilter(data.meta, 'email')}`"
              class="flex align-items-center"
              :aria-label="metaFilter(data.meta, 'email')"
            >
              <!-- <Icon icon="fa6-solid:envelope" class="text-xl mr-2"/> -->
              {{ metaFilter(data.meta, 'email') }}
            </a>
          </div>
          <div v-else>
            {{ 'No Email Added' }}
          </div>
          <div
            v-if="
              metaFilter(data.meta, 'mobile') || metaFilter(data.meta, 'phone')
            "
            class="flex align-items-center break-all"
          >
            <div
              v-if="metaFilter(data.meta, 'mobile')"
              class="flex align-items-center"
            >
              <a
                :href="`tel:${metaFilter(data.meta, 'mobile')}`"
                class="flex align-items-center"
                :aria-label="metaFilter(data.meta, 'mobile')"
              >
                <!-- <Icon
                  class="text-xl mr-2"
                  icon="fa6-solid:mobile-screen-button"
                /> -->
                {{ metaFilter(data.meta, 'mobile') }}
              </a>
            </div>
            <div
              v-else-if="metaFilter(data.meta, 'phone')"
              class="flex align-items-center"
            >
              <a
                :href="`tel:${metaFilter(data.meta, 'phone')}`"
                class="flex align-items-center"
                :aria-label="metaFilter(data.meta, 'phone')"
              >
                <!-- <Icon icon="fa6-solid:phone" class="text-xl mr-2"/> -->
                {{ metaFilter(data.meta, 'phone') }}
              </a>
            </div>
          </div>
          <div v-else>
            {{ 'No Mobile or Phone Added' }}
          </div>
        </div>
      </template>
    </Column>
    <Column header="Rating" field="rating" class="text-center">
      <template #body="{ data }">
        <StarRating
          class="justify-content-center" :rating="(data.rating || 0)" v-bind="{ ...ratingOptions }"
        />
      </template>
    </Column>
    <Column
      header="Active Projects"
      class="text-center"
      sortable
      :sort-field="clientsList ? '_count.projects' : 'projects'"
    >
      <template #body="{ data }">
        <div class="text-center">
          {{ data._count?.projects }}
        </div>
      </template>
    </Column>
    <Column header="Scheduled Projects" class="text-center">
      <template #body="{ data }">
        <div class="text-center">
          {{ data.projects?.length }}
        </div>
      </template>
    </Column>
    <Column
      v-if="
        clientsList
          && !(isBillingProfile || isContactList)
          && canDo('client_groups', ['edit', 'create'])
      "
      class="text-center w-2"
    >
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="{ data }">
        <div class="md:w-full w-6rem">
          <Button
            v-if="canDo('client_groups', 'delete')"
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger mr-2"
            @click="emit('delete:client', data)"
          />
          <Button
            v-if="canDo('client_groups', 'create')"
            icon="pi pi-plus"
            class="p-button-sm p-button-rounded"
            @click="emit('create:client')"
          />
        </div>
      </template>
    </Column>
    <Column
      v-if="
        clientsList
          && isBillingProfile
          && canDo('client_billing', ['edit', 'create'])
      "
      class="text-center w-2"
    >
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="{ data }">
        <div class="md:w-full w-6rem">
          <Button
            v-if="canDo('client_billing', 'delete')"
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger mr-2"
            @click="emit('delete:client', data)"
          />
        </div>
      </template>
    </Column>
    <Column v-if="clientsList && isContactList" class="text-center w-2">
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="{ data }">
        <div class="md:w-full w-6rem">
          <Button
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger mr-2"
            @click="emit('delete:client', data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>

  <Dialog
    v-model:visible="generateEngagementLetterDialog"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '50vw' }"
    content-class="border-round-bottom-md"
    :header="`Generate ${selectedContract?.name}`"
  >
    <ClientsGenerateEngagementLetterForm
      :selected-contract="selectedContract?.id as string"
      :client="selectedClient"
      @success="handleSuccess"
    />
  </Dialog>
  <Dialog
    v-model:visible="shareDialog"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '50vw' }"
    content-class="border-round-bottom-md"
    :header="`Share ${selectedContract?.name} ${
      selectedContract?.status === 'GENERATED_LINK' ? 'Link' : 'Document'
    }`"
  >
    <CommonSchemaForm :data="formData" @submit="handleShare" />
  </Dialog>
</template>
