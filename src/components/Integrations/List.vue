<script setup lang="ts">
import type {
  CreateOrgIntegrationPayload,
  Integration,
  IntegrationId,
  IntegrationsData
} from '@/types/integrations.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import Nango from '@nangohq/frontend';

const { $eventBus } = useMittEventBus();
const { getIntegrations, getQuickbooksUrl, getOrgIntegration }
  = useIntegrations();
const { create: createOrgIntegration, getAll: getOrgIntegrations }
  = useOrgIntegrations();
const { initials } = useVueFilters();
const { openLinkInNewTab } = useUtilityFns();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { initToast } = useToasts();
const router = useRouter();
const queryClient = useQueryClient();
const { featureSubscribed } = usePermissions();

const makeAPICall = ref(false);
const isCalendlyIntegrationModal = ref(false);
const isPaypalIntegrationModal = ref(false);
const isStripeIntegrationModal = ref(false);
const isXeroOrQuickbooks = ref(false);
const integrationId = ref();
const xeroHost = ref();
const xeroPubKey = ref();
const qbHost = ref();
const qbPubkKey = ref();
const isIntegratedDialog = ref(false);
const selectedIntegrationModule = ref<Integration>();
const subscribeDialog = ref(false);
const integratedFeature = ref();

function getIntegrationTooltip(id: Integration['id']) {
  switch (id) {
    case 'CALENDLY':
      return `Calendly integration streamlines meeting scheduling through BrightReturn's client portal.`;
    case 'XERO':
      return `Integrate Xero, import clients, and fetch invoices seamlessly.`;
    case 'QUICKBOOKS':
      return `Integrate Quickbooks, import clients, and create invoices seamlessly.`;
    case 'PAYPAL':
      return `Integrate Paypal to make seamless payments.`;

    default:
      return 'Integrate external resources';
  }
}

let nango: Nango;

const {
  data: integrationsList,
  isLoading: loadingIntegrationsList,
  isFetching: fetchingIntegrationsList
} = useQuery(
  ['all-integrations'],
  () => {
    return getIntegrations();
  },
  {
    onSuccess: (data: IntegrationsData) => {
      const xeroData = data.allIntegrations.find(
        (item: Integration) => item.name === 'Xero'
      );
      xeroHost.value = xeroData?.data?.host;
      xeroPubKey.value = xeroData?.data?.publicKey;
      const quickbooksData = data.allIntegrations.find(
        (item: Integration) => item.name === 'QuickBooks Online'
      );
      qbHost.value = quickbooksData?.data?.host;
      qbPubkKey.value = quickbooksData?.data?.publicKey;
    }
  }
);

const { isLoading: integrationIsloading } = useQuery(
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

function integrateQuickBooks(data: any) {
  if (data) {
    if (qbHost.value && qbPubkKey.value) {
      nango = new Nango({
        host: qbHost.value,
        publicKey: qbPubkKey.value
      });
    }
    nango
      .auth(integrationId.value, data.id)
      .then((result: any) => {
        // do something
      })
      .catch((err: { message: string; type: string }) => {
        // handle error
        console.log(err);
      });
    integrationId.value = undefined;
  }
}

function integrateXero(data: any) {
  if (data) {
    if (qbHost.value && qbPubkKey.value) {
      nango = new Nango({
        host: qbHost.value,
        publicKey: qbPubkKey.value
      });
    }
    nango
      .auth(integrationId.value, data.id)
      .then((result: any) => {
        // do something
      })
      .catch((err: { message: string; type: string }) => {
        // handle error
        console.log(err);
      });
    integrationId.value = undefined;
  }
}

const {
  data: integrationData,
  isLoading: loadingIntegration,
  isFetching: fetchingIntegration
} = useQuery(
  'get-integration-cred',
  async () => {
    return getOrgIntegration(integrationId.value as IntegrationId);
  },
  {
    onSuccess: async (data) => {
      if (data?.isCompleted) {
        isIntegratedDialog.value = true;
      }
      else {
        if (integrationId.value === 'QUICKBOOKS')
          await integrateQuickBooks(data);
        else if (integrationId.value === 'XERO')
          await integrateXero(data);
      }
      isXeroOrQuickbooks.value = false;
    },
    onError: (err) => {
      console.log(err);
      isXeroOrQuickbooks.value = false;
    },
    enabled: isXeroOrQuickbooks
  }
);

const { mutateAsync: createIntegration, isLoading: creatingOrgIntegration }
  = useMutation(
    (payload: CreateOrgIntegrationPayload) => {
      return createOrgIntegration(payload);
    },
    {
      onSuccess: (data) => {
        if (data) {
          if (!selectedIntegrationModule.value?.isExternal) {
            initToast({
              actionType: 'Create',
              summary: `Create Organization Integration`,
              detail: `${selectedIntegrationModule.value?.name} created successfully.`
            });
            // router.go(0);
            $eventBus.emit(
              'added-new-integration',
              selectedIntegrationModule.value
            );
            queryClient.invalidateQueries('all-integrations');
          }
        }
      }
    }
  );

async function handleOrgIntegrationCreate() {
  const payload = {
    integrationIds: [selectedIntegrationModule.value?.id as string]
  };

  await createIntegration(payload);
}

function handleIntegration(integration: Integration) {
  selectedIntegrationModule.value = integration;
  integrationId.value = integration.id;
  switch (integration.id) {
    case 'QUICKBOOKS':
      if (featureSubscribed('client', 'quickbooks_integration') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = integration.id;
      }
      else {
        isXeroOrQuickbooks.value = true;
      }
      break;
    case 'XERO':
      if (featureSubscribed('client', 'xero_integration') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = integration.id;
      }
      else {
        isXeroOrQuickbooks.value = true;
      }
      break;
    case 'CALENDLY':
      isCalendlyIntegrationModal.value = true;
      break;
    case 'PAYPAL':
      if (featureSubscribed('billing', 'paypal_integration') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = integration.id;
      }
      else {
        isPaypalIntegrationModal.value = true;
      }
      break;
    case 'STRIPE':
      if (featureSubscribed('billing', 'stripe_integration') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = integration.id;
      }
      else {
        isStripeIntegrationModal.value = true;
      }
      break;
    case 'BRIGHTDESK':
      if (featureSubscribed('help_desk', 'inbox') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = 'brightdesk';
      }
      else {
        handleOrgIntegrationCreate();
      }
      break;
    case 'CLIENT_BILLING':
      if (featureSubscribed('billing', 'billing_profile') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = 'client billing';
      }
      else {
        handleOrgIntegrationCreate();
      }
      break;
    case 'CLIENT_PORTAL':
      if (featureSubscribed('client_portal', 'dashboard') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = 'client portal';
      }
      else {
        handleOrgIntegrationCreate();
      }
      break;
    case 'SMART_FOLDER':
      if (featureSubscribed('smart_folder', 'custom_smart_folder') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = 'smart folder';
      }
      else {
        handleOrgIntegrationCreate();
      }
      break;
    case 'DATA_EXTRACTION':
      if (featureSubscribed('data_extraction', 'auto_extraction') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = 'data extraction';
      }
      else {
        handleOrgIntegrationCreate();
      }
      break;
    case 'ESIGN':
      if (featureSubscribed('esignature', 'esign') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = 'esignature';
      }
      else {
        handleOrgIntegrationCreate();
      }
      break;
    case 'HRMS':
      if (featureSubscribed('hrms', 'leaves') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = 'hrms';
      }
      else {
        handleOrgIntegrationCreate();
      }
      break;
    case 'DOCUMENTS':
      if (featureSubscribed('document_managment', 'documents') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = 'documents';
      }
      else {
        handleOrgIntegrationCreate();
      }
      break;
    case 'BROADCASTS':
      if (featureSubscribed('bulk_email', 'email_to_client') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = 'bulk email';
      }
      else {
        handleOrgIntegrationCreate();
      }
      break;
    case 'WORK':
      if (featureSubscribed('work', 'task') === false) {
        subscribeDialog.value = true;
        integratedFeature.value = 'work';
      }
      else {
        handleOrgIntegrationCreate();
      }
      break;
    default:
      handleOrgIntegrationCreate();
      break;
  }
}

async function handleSelect(value: Integration) {
  handleIntegration(value);
}

const BRIntegrations = computed(() => {
  if (!integrationsList.value?.allIntegrations)
    return [];

  return integrationsList?.value.allIntegrations.filter(
    integration => integration.isExternal === false
  );
});

const recommendedIntegrations = computed(() => {
  if (!integrationsList.value?.recommendedIntegrations)
    return [];

  return integrationsList.value.recommendedIntegrations;
});

const externalIntegrations = computed(() => {
  if (integrationsList.value) {
    return integrationsList?.value?.allIntegrations.filter(
      integration => integration.isExternal === true
    );
  }
  return [];
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonLoading v-if="loadingIntegrationsList || fetchingIntegrationsList" />
  <div v-else v-bind="$attrs">
    <div v-if="!integrationsList?.allIntegrations?.length">
      <p>No Integrations found.</p>
    </div>
    <div v-else class="">
      <div v-if="recommendedIntegrations?.length" class="mb-4">
        <h4 class="text-primary">
          Recommended
        </h4>
        <Divider class="mt-2 mb-3" />
        <IntegrationsListItems
          :integrations="recommendedIntegrations"
          :integration-loading="creatingOrgIntegration"
          is-button
          can-call-integrations
          @select="handleSelect"
        />
      </div>
      <div v-if="BRIntegrations?.length" class="mb-4">
        <h4 class="text-primary">
          BrightReturn Apps
        </h4>
        <Divider class="mt-2 mb-3" />
        <IntegrationsListItems
          :integrations="BRIntegrations"
          :integration-loading="creatingOrgIntegration"
          is-button
          can-call-integrations
          @select="handleSelect"
        />
      </div>
      <div v-if="externalIntegrations?.length">
        <h4 class="text-primary">
          Other Apps
        </h4>
        <Divider class="mt-2 mb-3" />
        <IntegrationsListItems
          :integrations="externalIntegrations"
          :integration-loading="
            creatingOrgIntegration || loadingIntegration || fetchingIntegration
          "
          is-button
          can-call-integrations
          @select="handleSelect"
        />
      </div>
      <!-- <div
        v-for="integration in integrationsList.allIntegrations"
        :key="integration.id"
        class="flex flex-column justify-content-center card align-items-center w-full h-full row-gap-2"
      >
        <h2 class="text-center text-3xl">
          {{ integration.name }}
          <i
            class="pi pi-info-circle ml-1 cursor-pointer"
            v-tooltip.top="getIntegrationTooltip(integration.id)"
          ></i>

          <small
            v-if="integration.description"
            class="block text-sm font-normal font-italic"
          >
            {{ integration.description }}
          </small>
        </h2>
        <Avatar shape="circle" size="xlarge">
          <template v-if="integration.picture">
            <img
              class="text-sm"
              :src="integration.picture"
              :style="{
                'vertical-align': 'middle',
              }"
              :alt="`${integration.name}`"
              :class="{
                'custom-calendly':
                  integration.picture.split('/').pop() === 'calendly.png'
                    ? true
                    : false,
              }"
            />
          </template>
          <span v-else>
            {{ `${initials(integration.name)}` }}
          </span>
        </Avatar>
        <Button
          class="block font-medium text-lg w-7rem"
          label="Start"
          @click="handleIntegration(integration)"
          :loading="
            creatingOrgIntegration &&
            selectedIntegrationModule?.id === integration.id
          "
        />
      </div> -->
    </div>
  </div>
  <Dialog
    v-model:visible="isCalendlyIntegrationModal"
    content-class="border-round-bottom-md"
    :modal="true"
    append-to="body"
    header="Calendly Integration"
    :breakpoints="defaultBreakpoints"
    :style="styles"
  >
    <IntegrationsCalendlyForm
      @success="
        isCalendlyIntegrationModal = false;
        queryClient.invalidateQueries('all-integrations');
      "
    />
  </Dialog>
  <Dialog
    v-model:visible="isPaypalIntegrationModal"
    content-class="border-round-bottom-md"
    :modal="true"
    append-to="body"
    header="Paypal Integration"
    :breakpoints="defaultBreakpoints"
    :style="styles"
  >
    <IntegrationsPaypalForm
      @success="
        isPaypalIntegrationModal = false;
        queryClient.invalidateQueries('all-integrations');
      "
    />
  </Dialog>
  <Dialog
    v-model:visible="isStripeIntegrationModal"
    content-class="border-round-bottom-md"
    :modal="true"
    append-to="body"
    header="Stripe Integration"
    :breakpoints="defaultBreakpoints"
    :style="styles"
  >
    <IntegrationsStripeForm
      @success="
        isStripeIntegrationModal = false;
        queryClient.invalidateQueries('all-integrations');
      "
    />
  </Dialog>
  <Dialog
    v-model:visible="isIntegratedDialog"
    :modal="true"
    append-to="body"
    header="Update/Remove Integration"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
  >
    <div class="flex flex-column justify-content-center align-items-center">
      <span>
        To update/remove the integration please contact support at
        <a class="font-medium underline" href="mailto:help@brightreturn.com.com">help@brightreturn.com</a>.
      </span>
    </div>
  </Dialog>
  <CommonSubscribeDialog
    v-if="subscribeDialog"
    :visible="subscribeDialog"
    :feature="integratedFeature"
    @hide="subscribeDialog = false"
  />
</template>

<style lang="scss" scoped>
:deep(*) {
  .p-divider.p-divider-horizontal::before {
    border-top: solid 1px $primaryColor;
  }
}

.p-avatar {
  width: 80px !important;
  height: 80px !important;
  aspect-ratio: 1/1;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, 300px);
  // grid-template-rows: repeat(300px);
  grid-gap: 2rem;
  justify-content: center;

  @media screen and (width >= 768px) {
    justify-content: start;
  }
}

.custom-calendly {
  background-color: #fff !important;
  border-radius: 0 !important;
}
</style>
