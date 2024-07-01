<script setup lang="ts">
import type {
  Client,
  CommonClientState,
  HandleStepFunc
} from '@/types/client.type';
import { useRouteQuery } from '@vueuse/router';
import type { Ref } from 'vue';
import { useQuery, useQueryClient } from 'vue-query';

const props = defineProps<{
  client?: Client;
}>();

const emit = defineEmits<{
  (event: 'title', title: string, subTitle: string): void;
}>();

const handleStep = inject<HandleStepFunc>('handleStep', () => {});
const stateId = useRouteQuery<string>('stateId');
const federal = useRouteQuery<string>('isFederal') as Ref<
  'true' | 'false' | null
>;
const isWithoutStateQuery = useRouteQuery<string>('isWithoutState') as Ref<
  'true' | 'false' | null
>;
const queryClient = useQueryClient();
const route = useRoute();
const { pluralize } = useVueFilters();

const { client } = toRefs(props);
const clientId = ref(route.params.id as string);
const selectedState = ref();
const isFederal = ref(false);
const isWithoutState = ref(false);
const isStateWatched = ref(false);
const titles = {
  default:
    'Assign Project Templates to corresponding State, in order to Automate Project Creation & Scheduling.',
  select: `Great, let's automate the ${$tConfig('CLIENT').toLowerCase()}'s work now.`,
  table:
    'Please choose the project frequency and select the due date accordingly. Then, specify the number of days for the project schedule date to receive an email for scheduling the project.'
};
// const isClientStates = computed(() => {
//   return (client.value?.clientStates as ClientState[])
//     ? (client.value?.clientStates as ClientState[]).length > 0
//     : 'loading';
// });

const { data: states, isLoading: statesIsLoading } = useQuery(
  'client-states-list-automation',
  () => {
    return useClientStates(clientId.value as string, true);
  }
);

const { data: clientFederalServices, isLoading: federalIsLoading } = useQuery(
  'client-federal-services-list',
  () => {
    return useClientServices({ id: clientId.value as string, isFederal: true });
  }
);

const { data: withoutStateServices, isLoading: withoutStatesIsLoading }
  = useQuery('client-without-state-automation', () => {
    return useClientServices({
      id: clientId.value as string,
      isWithoutState: true
    });
  });

// watchers to run only once on mounted when the API calls are completed
watch(
  () => [states.value, clientFederalServices.value, route],
  (val) => {
    if (
      !isStateWatched.value
      && Array.isArray(val[0])
      && Array.isArray(val[1])
    ) {
      if (stateId.value) {
        selectedState.value = states.value?.find((s) => {
          return s.id === stateId.value;
        });
      }
      isFederal.value = federal.value === 'true';
      isWithoutState.value = isWithoutStateQuery.value === 'true';
      if (isFederal.value) {
        selectedState.value = {
          name: 'Federal'
        };
        return;
      }
      if (isWithoutState.value) {
        selectedState.value = {
          name: 'Automation'
        };
        return;
      }

      isStateWatched.value = true;
    }
  },
  { immediate: true, deep: true }
);

const isReview = computed(() => {
  return (
    (isFederal.value
      ? !!(
          clientFederalServices.value && clientFederalServices?.value.length > 0
        )
      : selectedState.value?.serviceCount > 0)
      || (isWithoutState.value
        ? !!(withoutStateServices.value && withoutStateServices?.value.length > 0)
        : selectedState.value?.serviceCount > 0)
  );
});

async function handleRefresh(backToList?: boolean) {
  if (backToList) {
    if (isFederal.value) {
      await queryClient.invalidateQueries('client-federal-services-list');
    }
    else {
      await queryClient.invalidateQueries('client-states-list-automation');
    }
    handleStep('Automation', { nestedActiveIndex: 1 });
    handleTitle('default');
    isFederal.value = false;
    return;
  }
  if (isFederal.value) {
    await queryClient.invalidateQueries('client-federal-services-list');
    if (
      clientFederalServices.value
      && clientFederalServices?.value.length === 0
    ) {
      handleStep('Automation', { nestedActiveIndex: 1 });
      handleTitle('default');
      isFederal.value = false;
    }
  }
  else {
    await queryClient.invalidateQueries('client-states-list-automation');
    if (selectedState.value.serviceCount === 0) {
      handleStep('Automation', { nestedActiveIndex: 1 });
      handleTitle('default');
      isFederal.value = false;
    }
  }
}

function handleDetails(state: Partial<CommonClientState>, federal: boolean) {
  selectedState.value = state;
  handleStep('Automation', {
    nestedActiveIndex: 1,
    stateId: state.id,
    isFederal: `${federal}`
  });
  handleTitle(isReview.value ? 'table' : 'select');
}

function automateWithoutState(state: { name: string },
  isWithoutState: boolean) {
  selectedState.value = state;
  handleStep('Automation', {
    nestedActiveIndex: 1,
    isWithoutState: `${isWithoutState}`
  });
  handleTitle(isReview.value ? 'table' : 'select');
}

function handleTitle(title: 'select' | 'table' | 'default') {
  emit(
    'title',
    selectedState.value
      ? `${isReview.value ? 'Review' : 'Automat'}ing ${
          isWithoutState.value && !isReview.value
            ? ''
            : selectedState.value.name
        }`
      : 'Automation',
    titles[title]
  );
}

// watchers to run only once on mounted when the API calls are completed
watch(
  () => [states.value, clientFederalServices.value, route],
  (val) => {
    if (Array.isArray(val[0]) && Array.isArray(val[1])) {
      if (stateId.value) {
        selectedState.value = states.value?.find((s) => {
          return s.id === stateId.value;
        });
      }
      isFederal.value = federal.value === 'true';
      if (isFederal.value) {
        selectedState.value = {
          name: 'Federal'
        };
        handleTitle(isReview.value ? 'table' : 'select');
        return;
      }
      handleTitle(isReview.value ? 'table' : 'select');
      isStateWatched.value = true;
    }
  },
  { immediate: true, deep: true }
);
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div v-if="!selectedState" class="mx-4">
    <CommonLoading
      v-if="federalIsLoading || statesIsLoading || withoutStatesIsLoading"
    />
    <div v-else>
      <div class="mb-4">
        <div class="mb-2 font-medium text-lg">
          Automate (Recommended)
        </div>
        <ClientsWithoutStatesList
          :id="client?.id ? client?.id : ''"
          :without-state-services="withoutStateServices || []"
          @start-automate="automateWithoutState"
        />
        <div class="mb-2 font-medium text-lg">
          Automate work for Federal
        </div>
        <ClientsFederalList
          :id="client?.id || ''"
          :client-services="clientFederalServices"
          @details="handleDetails"
        />
      </div>
      <div class="mb-2">
        <span class="font-medium text-lg">Automate work for multiple states</span>
        <span class="ml-2">(If you would like to setup work automation with separate deadlines
          for different states)</span>
      </div>
      <ClientsStatesList
        v-if="states?.length"
        :id="client?.id ? client?.id : ''"
        :states="states ? states : []"
        @details="handleDetails"
      />
      <div>
        <div v-if="!states?.length" class="text-gray-500 text-md">
          No {{ `${pluralize($tConfig('CLIENT').toLowerCase())}` }} states found, please add {{ `${$tConfig('CLIENT').toLowerCase()}` }} states from
          <a
            class="cursor-pointer"
            aria-label="go to states tab"
            @click.prevent="handleStep('Automation', { nestedActiveIndex: 2 })"
          >here</a>.
        </div>
      </div>
    </div>
  </div>
  <div v-if="selectedState">
    <div class="mb-4 mt-5">
      <ClientsAddUpdateServiceForm
        :is-without-state="isWithoutState"
        :federal="isFederal"
        :state="selectedState"
        :client-name="client?.name"
        :review="!!isReview"
        @refresh="handleRefresh"
        @title="handleTitle"
      />
    </div>
  </div>
</template>
