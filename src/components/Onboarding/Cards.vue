<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type {
  IntegrationId,
  OrgIntegration,
  OrgIntegrationStep
} from '@/types/integrations.type';

const props = defineProps<{
  integrations: any[];
  integrationsLoading?: boolean;
  cardsInRow?: number;
  isCardSmall?: boolean;
  disableCard?: boolean;
}>();
const emit = defineEmits<{
  (e: 'cardClick', integrations: any): void;
}>();

// const { markStepCompleteForOrgIntegration, getOrgIntegrations } =
//   useIntegrations();
const { markAsStepComplete, getAll: getOrgIntegrations } = useOrgIntegrations();
const { defaultBreakpoints } = useCommonBreakPoints();
const queryClient = useQueryClient();
const router = useRouter();
const { initToast } = useToasts();
const { getQueryParams } = useUtilityFns();

// const gridColumnStyle = computed(() => {
//   return `repeat(${
//     props.cardsInRow || props.integrations.length <= 2
//       ? props.cardsInRow
//       : props.integrations.length > 2 && props.integrations.length < 6
//       ? props.integrations.length
//       : 6
//   }, 1fr)`;
// });
const isChecked = ref(true);
const isIntegrationVideoOpen = ref(false);
const selectedIntegrationStep = ref<OrgIntegrationStep>();
const selectedIntegration = ref<OrgIntegration>();

// dependencies
const { data: orgIntegrations, isLoading: orgIntegrationsLoading } = useQuery(
  'org-integrations',
  () => {
    return getOrgIntegrations();
  }
);

function isIntegrationStepsCompleted(stepId: IntegrationId) {
  if (
    Array.isArray(orgIntegrations.value)
    && orgIntegrations.value.length > 0
  ) {
    const orgIntegration = orgIntegrations.value.find(
      orgIntegration => orgIntegration.integration.id === stepId
    );
    return orgIntegration && orgIntegration.isCompleted;
  }
  return false;
}

function invalidateOrgIntegrations() {
  queryClient.invalidateQueries('org-integrations');
  queryClient.invalidateQueries('pending-org-integrations');
}

const {
  mutateAsync: handleIntegrationStepMutation,
  isLoading: completingStep
} = useMutation(
  'stepComplete',
  async ({
    id,
    orgIntegrationStepId,
    payload
  }: {
    id: string;
    orgIntegrationStepId: string;
    payload: { status: number };
  }) => {
    return markAsStepComplete({ id, orgIntegrationStepId, payload });
  },
  {
    onSuccess: () => {
      if (selectedIntegrationStep.value?.step.name === 'Watch Video') {
        isIntegrationVideoOpen.value = true;
      }
      else {
        initToast({
          actionType: 'Update',
          summary: 'Getting Started Step',
          detail: `<strong>${selectedIntegrationStep.value?.step.name}</strong> step completed successfully.`
        });
        const routeQueryParams = getQueryParams(
          selectedIntegrationStep.value?.step.route as string
        );
        router.replace({
          path: `${selectedIntegrationStep.value?.step.route}`,
          query: { ...routeQueryParams }
        });
        invalidateOrgIntegrations();
      }
    }
  }
);

async function handleIntegrationSteps({
  integration,
  integrationStep
}: {
  integrationStep: OrgIntegrationStep;
  integration: OrgIntegration;
}) {
  selectedIntegration.value = integration;
  selectedIntegrationStep.value = integrationStep;

  await handleIntegrationStepMutation({
    id: integration.id,
    orgIntegrationStepId: integrationStep.id,
    payload: {
      status:
        integrationStep.status === 0 || integrationStep.status === 2 ? 2 : 0
    }
  });
}

function isIntegrationDisabled(orgIntegration: any) {
  const id = orgIntegration.integration.id;
  return (
    /* ((id === 'WORK' || id === 'DOCUMENTS') &&
      !isIntegrationStepsCompleted('CLIENT')) || */
    ((id === 'DATA_EXTRACTION' || id === 'SMART_FOLDER' || id === 'ESIGN')
    && !isIntegrationStepsCompleted('DOCUMENTS'))
    || ((id === 'CLIENT_BILLING' || id === 'BRIGHTDESK')
    && !isIntegrationStepsCompleted('WORK'))
    || (id === 'GALLERY' && !isIntegrationStepsCompleted('BROADCASTS'))
  );
}

function getTooltipContent(orgIntegration: any) {
  const id = orgIntegration.integration.id;
  /* if (
    (id === 'WORK' || id === 'DOCUMENTS') &&
    !isIntegrationStepsCompleted('CLIENT')
  ) {
    return `Please setup Client in order to setup ${orgIntegration.integration.name}`;
  } else  */
  if (
    (id === 'DATA_EXTRACTION' || id === 'SMART_FOLDER' || id === 'ESIGN')
    && !isIntegrationStepsCompleted('DOCUMENTS')
  ) {
    return `Please setup Document Management in order to setup ${orgIntegration.integration.name}`;
  }
  else if (
    (id === 'CLIENT_BILLING' || id === 'BRIGHTDESK')
    && !isIntegrationStepsCompleted('WORK')
  ) {
    return `Please setup Work Management in order to setup ${orgIntegration.integration.name}`;
  }
  else if (id === 'GALLERY' && !isIntegrationStepsCompleted('BROADCASTS')) {
    return `Please setup Broadcast in order to setup ${orgIntegration.integration.name}`;
  }
  else {
    return '';
  }
}

function handleIntegrationVideoClose() {
  isIntegrationVideoOpen.value = false;
  invalidateOrgIntegrations();
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
        v-tooltip="getTooltipContent(integration)"
        :class="{
          'disabled-card': isIntegrationDisabled(integration),
        }"
        class="card overview-box widget-radius mb-0 border-gray-200 border-2"
      >
        <CommonLoading v-if="integrationsLoading" />
        <div v-else class="overview-info w-full flex flex-column">
          <h5 class="text-xl font-semibold text-center">
            {{ integration.integration.name }}
          </h5>
          <span class="text-center font-normal mb-4">
            {{ integration.integration.description }}
          </span>
          <div
            v-for="(
              integrationStep, stepIndex
            ) in integration.OrgIntegrationStep"
            :key="stepIndex"
            class="py-1"
          >
            <div class="flex justify-content-between">
              <span
                class="text-md font-semibold transition transition-all transition-duration-400"
                :class="[
                  {
                    'cursor-pointer hover:underline hover:text-primary':
                      !isIntegrationDisabled(integration),
                  },
                  {
                    'pointer-events-none':
                      integrationStep.status === 2
                      || integrationStep.status === 1,
                  },
                ]"
                role="link"
                tabindex="0"
                @click="
                  !isIntegrationDisabled(integration)
                    && handleIntegrationSteps({ integration, integrationStep })
                "
              >{{ integrationStep.step.name }}</span>
              <i
                v-if="
                  completingStep
                    && selectedIntegrationStep?.id === integrationStep.id
                "
                class="pi pi-spin pi-spinner"
              />
              <template v-else>
                <span
                  v-if="integrationStep.status === 0"
                  class="text-red-500 font-semibold"
                >
                  Pending
                </span>
                <Checkbox
                  v-else-if="integrationStep.status === 2"
                  v-model="isChecked"
                  disabled
                  :binary="true"
                  :input-class="['bg-green-500', 'border-green-500']"
                />
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <Dialog
    v-model:visible="isIntegrationVideoOpen"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '75vw' }"
    content-class="border-round-bottom-md"
    :header="selectedIntegration?.integration.name"
    @hide="handleIntegrationVideoClose"
  >
    <template #header>
      <h3 class="text-center w-full">
        {{ selectedIntegration?.integration.name }}
        <small class="block text-lg">
          {{ selectedIntegration?.integration.description }}
        </small>
      </h3>
    </template>
    <div class="video-container">
      <iframe
        width="560"
        height="315"
        :src="selectedIntegrationStep?.step.route"
        :title="selectedIntegrationStep?.step.name"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      />
    </div>
  </Dialog>
</template>

<style scoped lang="scss">
.grid-container {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  grid-gap: 1rem;

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
  }

  @media screen and (width >= 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media screen and (width >= 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.disabled-card {
  cursor: not-allowed;
  opacity: 0.6;
  // pointer-events: none;
}

/*
@media (max-width: 1536px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
} */
</style>
