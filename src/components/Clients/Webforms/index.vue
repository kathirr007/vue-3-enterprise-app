<script setup lang="ts">
import type { Webform, WebformType } from '@/types/webforms.type';
import { useRouteQuery } from '@vueuse/router';

const props = defineProps<{
  webformType: WebformType;
}>();

const disabledTooltip = inject<string>('disabledTooltip');
const canDoActions = inject<boolean>('canDoActions');
const clientDetails = inject<any>('clientDetails', () => null);

const route = useRoute();
const router = useRouter();
const isQuickStart = useRouteQuery<string>('quickstart');
const { handleTooltip } = useTooltip();
const { defaultBreakpoints } = useCommonBreakPoints();
const { titleCase } = useVueFilters();
const { canDo } = usePermissions();
const { isPortalUser } = useCurrentUserData();

const isWebformCreateDialog = ref(false);
const isWebformCreate = ref(route.query.isWebformCreate === 'true');
const isWebformTemplate = ref(false);
const isWebformUpdate = ref(route.query.isUpdateWebform === 'true');
const isWebformView = ref(route.query.isViewWebform === 'true');
const isEsignWebform = ref(route.query.isESignWebform === 'true');
const selectedWebformId = ref(route.query.webformId as string);
const selectedWebform = ref<Webform>();

/* const { data: requestLimits } = useQuery('request-limit', () => {
  return getResourceLimits({ resource: ResourceType['webform request'] });
});

const { data: contractLimits } = useQuery('contract-limit', () => {
  return getResourceLimits({ resource: ResourceType['webform contract'] });
});

const requestResource = computed(() => {
  const limitComputed = requestLimits.value?.[0].limit === -1 ? 0 : requestLimits.value?.[0].limit;
  const usageComputed = requestLimits.value?.[0].orgSubscriptionResourceUsages && requestLimits.value?.[0].orgSubscriptionResourceUsages.length > 0 ? requestLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
  return { limit: limitComputed, usage: usageComputed };
});

const contractResource = computed(() => {
  const limitComputed = contractLimits.value?.[0].limit === -1 ? 0 : contractLimits.value?.[0].limit;
  const usageComputed = contractLimits.value?.[0].orgSubscriptionResourceUsages && contractLimits.value?.[0].orgSubscriptionResourceUsages.length > 0 ? contractLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
  return { limit: limitComputed, usage: usageComputed };
}); */

const { resourceUsage: requestResource, isLoading: loadingRequestsLimit } = useUsageLimit({
  isPortalUser: isPortalUser.value,
  queryKey: 'request-limit',
  resource: 'webform request'
});

const { resourceUsage: contractResource, isLoading: loadingContractsLimit } = useUsageLimit({
  isPortalUser: isPortalUser.value,
  queryKey: 'contract-limit',
  resource: 'webform contract'
});

const selectedResource = computed(() => props.webformType === 'ORGANIZER' ? requestResource.value : contractResource.value);

const hideWebformsList = computed(
  () =>
    isWebformCreate.value
    || isWebformTemplate.value
    || isWebformUpdate.value
    || isEsignWebform.value
    || isWebformView.value
);

function handleFromTemplate() {
  isWebformCreateDialog.value = false;
  isWebformTemplate.value = true;
}
function handleCreateManual() {
  isWebformCreateDialog.value = false;
  isWebformCreate.value = true;
}

function closeCreateWebform() {
  isWebformCreate.value = false;
  isWebformTemplate.value = false;
  isWebformUpdate.value = false;
  isWebformView.value = false;
  const {
    isUpdateWebform,
    webformId,
    isESignWebform,
    isWebformCreate: isCreateWebform,
    ...restQueries
  } = route.query;
  router.push({
    query: { ...restQueries }
  });
}

function handleWebformSelection(data: Webform,
  eventType: 'update' | 'view' | 'esign') {
  selectedWebform.value = data;
  switch (eventType) {
    case 'update':
      if (
        ['APPROVED', 'ESIGN_REQUESTED', 'PARTIALLY_SIGNED', 'SIGNED'].includes(
          data.status as string
        )
      ) {
        router.push({
          query: {
            ...route.query,
            isESignWebform: 'true',
            webformId: data.id,
            signReqId: data.signatureRequest
              ? data.signatureRequest[0]?.id
              : undefined
          }
        });
      }
      else {
        router.push({
          query: {
            ...route.query,
            isUpdateWebform: 'true',
            webformId: data.id
          }
        });
      }
      break;
    case 'esign':
      router.push({
        query: { ...route.query, isESignWebform: 'true', webformId: data.id }
      });
      break;
    case 'view':
      isWebformView.value = true;
      break;

    default:
      break;
  }
}

function handleCloseWebformCreateDialog() {
  isWebformCreateDialog.value = false;
  /* const {
    quickstart,
    ...restQueries
  } = route.query;
  router.push({
    query: { ...restQueries }
  }); */
}

onBeforeMount(() => {
  if (isQuickStart.value && canDo('webform', 'create')) {
    isWebformCreateDialog.value = true;
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div class="flex justify-content-between mb-4">
    <div>
      <h2 class="text-3xl text-primary">
        {{
          isEsignWebform
            ? 'Request eSignature'
            : isWebformCreate || isWebformTemplate
              ? `Create ${titleCase(
                webformType === 'ORGANIZER' ? 'Request' : webformType,
              )}`
              : webformType === 'ORGANIZER'
                ? 'Requests'
                : 'Contracts'
        }}
      </h2>
    </div>
    <div v-if="canDo('webform', 'create') && !hideWebformsList">
      <div
        v-tooltip.left="`${selectedResource.limit && (selectedResource.usage >= selectedResource.limit) ? `Can't create more than available limit ${selectedResource.limit}` : selectedResource.limit && (selectedResource.usage >= selectedResource.limit) ? `Available limit of ${selectedResource.limit} requests already created` : handleTooltip(
          !!canDoActions,
          `${`Create new ${titleCase(
            (webformType === 'ORGANIZER' ? 'Request' : webformType) as string,
          )}`}`,
          disabledTooltip,
        )}`
        "
        style="height: 2.357rem;"
      >
        <Button
          icon="pi pi-plus"
          class="p-button-rounded"
          :disabled="!canDoActions || (selectedResource.limit && (selectedResource.usage >= selectedResource.limit))"
          @click="isWebformCreateDialog = true"
        />
      </div>
    </div>
  </div>
  <template v-if="hideWebformsList">
    <ClientsWebformsCreate
      v-if="isWebformCreate || isWebformTemplate"
      :webform-type="webformType"
      :is-template="isWebformTemplate"
      :client-id="clientDetails?.id"
      is-from-client
      @modal-close="closeCreateWebform"
    />
    <ClientsWebformsUpdate
      v-if="isWebformUpdate || isEsignWebform"
      :webform-type="webformType"
      :webform-id="selectedWebformId"
      @modal-close="closeCreateWebform"
    />
    <CommonVueFormWrapper
      v-if="isWebformView"
      :webform="selectedWebform"
      hide-primary-button
      disable-form
      @back="closeCreateWebform"
    />
  </template>
  <template v-else>
    <ClientsWebformsList
      v-if="canDo('webform', 'list')"
      :webform-type="webformType"
      @select:webform="handleWebformSelection($event, 'update')"
      @view:webform="handleWebformSelection($event, 'view')"
      @esign:webform="handleWebformSelection($event, 'esign')"
    />
    <div v-else class="card">
      <p class="text-center font-medium text-xl">
        You don't have access of the
        {{ titleCase(webformType === 'ORGANIZER' ? 'Request' : webformType) }}
        list.
      </p>
    </div>
  </template>
  <Dialog
    v-model:visible="isWebformCreateDialog"
    :modal="true"
    append-to="body"
    :header="`Create ${titleCase(
      webformType === 'ORGANIZER' ? 'Request' : webformType,
    )}`"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    @hide="handleCloseWebformCreateDialog"
  >
    <div class="px-3">
      <div class="flex justify-content-between align-items-center">
        <div class="font-medium text-lg flex-1">
          Create
          {{ titleCase(webformType === 'ORGANIZER' ? 'Request' : webformType) }}
          using Template
          <p class="font-normal text-base mt-1">
            Create a new
            {{
              titleCase(webformType === 'ORGANIZER' ? 'Request' : webformType)
            }}
            using template and send it to your client to fill form{{ webformType === 'ORGANIZER' ? '' : ' or e-sign' }}.
          </p>
        </div>
        <Button
          label="Use Template"
          class="p-button-outlined"
          @click="handleFromTemplate"
        />
      </div>
      <Divider />
      <div class="flex justify-content-between align-items-center">
        <div class="font-medium text-lg flex-1">
          Create
          {{ titleCase(webformType === 'ORGANIZER' ? 'Request' : webformType) }}
          Manually
          <p class="font-normal text-base mt-1">
            Create a new
            {{
              titleCase(webformType === 'ORGANIZER' ? 'Request' : webformType)
            }}
            from scratch and send it to your client to fill form{{ webformType === 'ORGANIZER' ? '' : ' or e-sign' }}.
          </p>
        </div>
        <Button
          label="Create New"
          class="p-button-outlined"
          @click="handleCreateManual"
        />
      </div>
    </div>
  </Dialog>
</template>

<style lang="scss" scoped></style>
