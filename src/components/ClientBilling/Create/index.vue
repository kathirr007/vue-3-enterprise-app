<script setup lang="ts">
import type {
  ClientBillingProfile,
  CreateProfileClientPayload,
  CreateProfileDetailsPayload,
  CreateProfilePayload
} from '@/types/client-billing.type';
import { useMutation, useQuery } from 'vue-query';

import type { Step } from '@/types/common.type';
import ClientBillingCreateProfile from '@/components/ClientBilling/Create/Profile.vue';
import ClientBillingAddDetailsForm from '@/components/ClientBilling/AddDetailsForm.vue';
import ClientBillingAddClientForm from '@/components/ClientBilling/AddClientForm.vue';

const props = defineProps<{
  profile?: boolean;
  revisit?: boolean;
  clientbilling?: ClientBillingProfile;
}>();
const emit = defineEmits(['back', 'success']);

const { createOne, attachClient, update, getOneClients } = useClientBilling();
const { pluralize } = useVueFilters();
const { initToast } = useToasts();
const router = useRouter();
const route = useRoute();
const currentRouterClientBillingId = ref<string>(route.params.id as string);

const billingId = ref<string>();
const detailPayLoad = ref();
const createProfilePayload = ref();
const currentStep = ref<'profileForm' | 'form' | 'clientForm'>(
  props.profile ? 'profileForm' : 'form'
);
const selectedProfile = ref<string>();
const clientData = ref(props.clientbilling);

const apiKey = ref(0);
const steps: Record<'profileForm' | 'form' | 'clientForm', unknown> = {
  profileForm: ClientBillingCreateProfile,
  form: ClientBillingAddDetailsForm,
  clientForm: ClientBillingAddClientForm
};

const stepProps = computed(() => {
  if (currentStep.value === 'profileForm') {
    return {
      profileClient: createProfilePayload.value,
      create: true,
      apiKey: apiKey.value,
      loading: createClientBillingIsLoading.value
    };
  }
  if (currentStep.value === 'form') {
    return {
      create: true,
      loading: loadingClientBillingProfile.value,
      apiKey: apiKey.value,
      detailBilling: props.revisit ? props.clientbilling : clientData.value,
      hideBackButton: !props.revisit
    };
  }
  if (currentStep.value === 'clientForm') {
    return {
      apiKey: apiKey.value,
      loading: attachClientBillingIsLoading.value,
      revisit: props.revisit,
      addClient: true,
      billingProfileClients: clientBillingDetails.value
    };
  }
});

const stepItems = computed(() => {
  const steps: Step[] = [
    {
      name: 'profileForm',
      label: `${props.revisit ? 'Update/View' : 'Add'} Profile`
    },
    {
      name: 'form',
      label: `${props.revisit ? 'Update/View' : 'Add'} Details`
    },
    {
      name: 'clientForm',
      label: `${props.revisit ? 'Update/View' : 'Add'} ${pluralize($tConfig('CLIENT'))}`
    }
  ];
  return steps.filter((step: Step) => {
    if (step.name === 'profileForm' && !props.profile) {
      return false;
    }
    return true;
  });
});

const {
  mutateAsync: createClientBilling,
  isLoading: createClientBillingIsLoading
} = useMutation((payload: CreateProfilePayload) => createOne(payload), {
  onSuccess: (data) => {
    if (data) {
      const keys = Object.keys(data);
      keys.forEach((key) => {
        if (!data[key])
          delete data[key];
      });
      clientData.value = data;
      billingId.value = data.id as string;
      currentStep.value = 'form';
    }

    // emit('success');
  }
});
// update Client billing
const {
  isLoading: loadingClientBillingProfile,
  mutateAsync: UpdateClientProfile
} = useMutation(
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
        actionType: 'Update',
        severity: 'success',
        summary: `${
          !props.revisit ? 'Create Billing Profile' : 'Update Billing Profile'
        }`,
        detail: `${$tConfig('CLIENT_BILLING_PROFILE')} has been ${
          !props.revisit ? 'created' : 'updated'
        } successfully`
      });
      currentStep.value = 'clientForm';
    }
  }
);

const {
  mutateAsync: attachClientBilling,
  isLoading: attachClientBillingIsLoading
} = useMutation(
  ({ payload, id }: { payload: CreateProfileClientPayload; id: string }) =>
    attachClient(id, payload),
  {
    onSuccess: () => {
      initToast({
        actionType: 'Create',
        severity: 'success',
        summary: 'Success',
        detail: `${$tConfig('CLIENT')} Attached successfully`
      });

      emit('success');
    }
  }
);

const { data: clientBillingDetails } = useQuery(
  ['clients-details-list', currentRouterClientBillingId],
  () => {
    if (!currentRouterClientBillingId.value)
      return;
    return getOneClients(currentRouterClientBillingId.value as string);
  }
);

async function handleProfile(value: CreateProfilePayload) {
  await createClientBilling(value);
  if (value) {
    setTimeout(() => {
      currentStep.value = 'form';
    }, 2000);
  }
  else {
    selectedProfile.value = 'profileForm';
  }
}

async function prepareForPayload(payload: CreateProfileDetailsPayload) {
  detailPayLoad.value = payload;
  await UpdateClientProfile({
    id: billingId.value
      ? (billingId.value as string)
      : currentRouterClientBillingId.value,
    payload: payload as unknown as CreateProfileDetailsPayload
  });
  if (payload) {
    setTimeout(() => {
      currentStep.value = 'clientForm';
    }, 2000);
  }
}
async function handleClientPayload(data: string[]) {
  await attachClientBilling({
    id: billingId.value
      ? (billingId.value as string)
      : currentRouterClientBillingId.value,
    payload: data as unknown as CreateProfileClientPayload
  });
}
function handleBack() {
  if (currentStep.value === 'profileForm')
    emit('back');
  if (currentStep.value === 'form') {
    if (props.profile)
      currentStep.value = 'profileForm';
    else emit('back');
  }
  if (currentStep.value === 'clientForm')
    currentStep.value = 'form';
}
function handleSkip(type?: 'clientForm') {
  if (type === 'clientForm') {
    router.push({ name: 'admin-client-billing' });
  }
}
</script>

<template>
  <div class="lg:w-10 xl:w-8 mx-auto">
    <CommonSteps
      id="abc"
      readonly
      :items="stepItems"
      class="mb-4 w-10 mx-auto"
      :current="currentStep"
    />

    <div
      class="card border-2 border-round default-border-color border-round-lg mx-4"
    >
      <KeepAlive>
        <component
          :is="steps[currentStep]"
          :key="currentStep"
          v-bind="stepProps"
          @back="handleBack"
          @skip="handleSkip"
          @profile="handleProfile"
          @form="prepareForPayload"
          @client-form="handleClientPayload"
        />
      </KeepAlive>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
