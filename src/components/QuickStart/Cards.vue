<script setup lang="ts">
import { useQuery, useQueryClient } from 'vue-query';
import type {
  Integration,
  IntegrationStep, QuickStartIntegration
} from '@/types/integrations.type';

const props = defineProps<{
  integrations?: QuickStartIntegration[];
  integrationsLoading?: boolean;
  cardsInRow?: number;
  isCardSmall?: boolean;
  disableCard?: boolean;
  quickstart?: boolean;
}>();
const emit = defineEmits<{
  (e: 'cardClick', integrations: any): void;
}>();

const { defaultBreakpoints, styles } = useCommonBreakPoints();
const queryClient = useQueryClient();
const router = useRouter();
const { initToast } = useToasts();
const { getQueryParams } = useUtilityFns();
const { replaceClient } = useVueFilters();
const { getIntegrations } = useIntegrations();
const { canAccessAllMenu } = usePermissions();

const isChecked = ref(true);
const isIntegrationVideoOpen = ref(false);
const openWebformDialog = ref(false);
const openCreateInvoiceDialog = ref(false);
const selectedIntegrationStep = ref<IntegrationStep>();
const selectedIntegration = ref<QuickStartIntegration>();

const {
  data: integrationsData,
  isLoading: loadingIntegrations,
  isFetching: fetchingIntegrations
} = useQuery(
  'all-integrations',
  () => {
    return getIntegrations();
  }
);

const recommendedIntegrations = computed(() => {
  return integrationsData.value?.recommendedIntegrations.map((item: Integration) => item.name);
});

async function handleIntegrationSteps({ integration, integrationStep }: { integration: QuickStartIntegration; integrationStep: IntegrationStep }) {
  selectedIntegration.value = integration;
  selectedIntegrationStep.value = integrationStep;
  if (selectedIntegrationStep.value.name === 'Watch Video') {
    isIntegrationVideoOpen.value = true;
  }
  else if (integration.id === 'REQUEST_AND_CONTRACT') {
    openWebformDialog.value = true;
  }
  else if (selectedIntegrationStep.value.name === 'Create your first invoice') {
    openCreateInvoiceDialog.value = true;
  }
  else {
    const routeQueryParams = getQueryParams(
      selectedIntegrationStep.value?.route as string
    );
    router.replace({
      path: `${selectedIntegrationStep.value?.route}`,
      query: { ...routeQueryParams }
    });
  }
}

function handleIntegrationVideoClose() {
  isIntegrationVideoOpen.value = false;
}

function handleIntegrate() {
  router.push({ name: 'admin-integrations' });
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div class="grid-container">
    <template v-for="(integration, index) in integrations" :key="index">
      <div
        class="card p-3 overview-box widget-radius mb-0 border-gray-200 border-2"
      >
        <CommonLoading v-if="integrationsLoading" />
        <div v-else class="overview-info w-full flex flex-column">
          <h5 class="text-xl font-semibold text-center">
            <span class="inline-block border-primary  py-2 px-3 card__title">{{ integration.id === 'CLIENT' ? replaceClient(integration.name as string) : integration.name }}</span>
          </h5>
          <span class="text-center font-normal mb-4 flex-1">
            {{ integration.id === 'CLIENT' ? replaceClient(integration.description as string) : integration.description }}
          </span>
          <div
            v-for="(
              integrationStep, index
            ) in integration.steps" :key="index" class="py-1"
          >
            <div class="flex justify-content-between">
              <!-- <span
                class="text-md font-semibold transition transition-all transition-duration-400 cursor-pointer hover:underline hover:text-primary"
                role="link"
                tabindex="0"
                @click="
                  handleIntegrationSteps({ integration, integrationStep })
                "
              >
                {{ integration.id === 'CLIENT' ? replaceClient(integrationStep.name as string) : integrationStep.name }}
              </span> -->
              <Button
                class="text-md font-semibold"
                role="link"
                tabindex="0"
                :label="integration.id === 'CLIENT' ? replaceClient(integrationStep.name as string) : integrationStep.name"
                @click="
                  handleIntegrationSteps({ integration, integrationStep })
                "
              />
            </div>
          </div>
        </div>
      </div>
    </template>
    <div
      class="card overview-box widget-radius mb-0 border-gray-200 border-2"
    >
      <div class="overview-info w-full flex flex-column">
        <h5 class="text-xl font-semibold text-center">
          <span class="inline-block border-primary  py-2 px-3 card__title">Integrate more apps</span>
        </h5>
        <span class="text-center font-normal mb-4 flex-1">
          Enhance efficiency by integrating additional apps<template v-if="recommendedIntegrations?.length">, such as <strong>{{ recommendedIntegrations?.map((item:string) => item).join(', ') }}</strong></template><template v-else>.</template>
        </span>
        <div class="flex justify-content-between">
          <div v-if="canAccessAllMenu" role="link" tabindex="0" class="w-full mt-2 flex align-items-center justify-content-end underline text-primary cursor-pointer font-medium" @click="handleIntegrate">
            Integrate more apps
          </div>
        </div>
      </div>
    </div>
  </div>

  <Dialog
    v-model:visible="isIntegrationVideoOpen" :modal="true" append-to="body" :breakpoints="defaultBreakpoints"
    :style="{ width: '75vw' }" content-class="border-round-bottom-md" :header="selectedIntegration?.name"
    @hide="handleIntegrationVideoClose"
  >
    <template #header>
      <h3 class="text-center w-full">
        {{ selectedIntegration?.name }}
        <small class="block text-lg">
          {{ selectedIntegration?.description }}
        </small>
      </h3>
    </template>
    <div class="video-container">
      <iframe
        width="560" height="315" :src="selectedIntegrationStep?.route"
        :title="selectedIntegrationStep?.name" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      />
    </div>
  </Dialog>

  <Dialog
    v-model:visible="openWebformDialog"
    :modal="true"
    append-to="body"
    header="Raise request to client"
    :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="openWebformDialog = false"
  >
    <WebformsSelectWebform @modal-close="openWebformDialog = false" />
  </Dialog>
  <Dialog
    v-model:visible="openCreateInvoiceDialog"
    :modal="true"
    append-to="body"
    header="Select Billing Profile"
    :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="openCreateInvoiceDialog = false"
  >
    <BillingSelectBillingProfile @modal-close="openCreateInvoiceDialog = false" />
  </Dialog>
</template>

<style scoped lang="scss">
.grid-container {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  grid-gap: 1rem;

  @media screen and (width >= 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media screen and (width >= 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  .card {
    &:last-child {
      margin-bottom: auto;
    }

    &.clickable {
      &:hover {
        h6 {
          text-decoration: underline;
        }
      }
    }

    &.small-card {
      padding: 1rem;
    }

    &__title {
      color: white;
      background-color: $primaryLightColor;
    }
  }
}
</style>
