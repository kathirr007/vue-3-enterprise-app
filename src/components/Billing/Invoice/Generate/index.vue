<script setup lang="ts">
import type {
  ClientBillingProfile,
  CreateProfileClientPayload,
  CreateProfileDetailsPayload,
  CreateProfilePayload
} from '@/types/client-billing.type';
import { useMutation, useQuery } from 'vue-query';

import type { Step } from '@/types/common.type';
import SelectBillingProfileForm from '@/components/Billing/Invoice/Generate/SelectBillingProfile.vue';
import AddDetailsForm from '@/components/Billing/Invoice/Generate/AddDetails.vue';
import type { ClientBillingInvoice } from '@/types/client-billing-invoices.type';
import type { Client } from '@/types/client.type';
import type { Project } from '@/types/project.type';

const props = defineProps<{
  clientBillingInvoice?: ClientBillingInvoice;
  create?: boolean;
  revisit?: boolean;
  clientbilling?: ClientBillingProfile;
  isClientPage?: boolean;
  clientDetails?: Client;
  projectDetails?: Project;
}>();
const emit = defineEmits(['back', 'success']);
const { createOne, attachClient, update, getOneClients } = useClientBilling();

const { initToast } = useToasts();

const router = useRouter();
const route = useRoute();
const currentRouterClientBillingId = ref<string>(route.params.id as string);

const billingId = ref<string>();
const detailPayLoad = ref();
const createProfilePayload = ref();
const currentStep = ref<'selectBillingProfile' | 'form'>(
  props.create ? 'selectBillingProfile' : 'form'
);
const selectedProfile = ref<string>();
const clientData = ref(props.clientbilling);
const clientSelectionDetails = ref();

const apiKey = ref(0);
const steps: Record<'selectBillingProfile' | 'form', unknown> = {
  selectBillingProfile: SelectBillingProfileForm,
  form: AddDetailsForm
};

const stepProps = computed(() => {
  if (currentStep.value === 'selectBillingProfile') {
    return {
      profileClient: createProfilePayload.value,
      create: true,
      apiKey: apiKey.value,
      loading: createClientBillingIsLoading.value,
      isClientPage: props.isClientPage,
      client: props.clientDetails,
      project: props.projectDetails,
      projects: props.projectDetails ? [props.projectDetails] : undefined,
      billingProfile: props.clientbilling
    };
  }
  if (currentStep.value === 'form') {
    return {
      create: true,
      loading: loadingClientBillingProfile.value,
      apiKey: apiKey.value,
      detailBilling: props.revisit ? props.clientbilling : clientData.value,
      clientBillingInvoice: props.revisit
        ? props.clientBillingInvoice
        : clientData.value,
      hideBackButton: !!props.revisit,
      client: clientSelectionDetails.value?.client,
      projects: clientSelectionDetails.value?.projects,
      tasks: clientSelectionDetails.value?.tasks,
      billingProfile: clientSelectionDetails.value?.billingProfile
    };
  }
});

const stepItems = computed(() => {
  const steps: Step[] = [
    {
      name: 'selectBillingProfile',
      label: `${props.revisit ? 'Update/View' : 'Select'} Billing Profile`
    },
    {
      name: 'form',
      label: `${props.revisit ? 'Update/View' : 'Add'} Details`
    }
  ];
  return steps.filter((step: Step) => {
    if (step.name === 'selectBillingProfile' && !props.create) {
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

async function handleClientSelection(values: any) {
  if (values) {
    clientSelectionDetails.value = values;
    currentStep.value = 'form';
  }
  else {
    selectedProfile.value = 'selectBillingProfile';
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
}
function handleBack() {
  if (currentStep.value === 'selectBillingProfile')
    emit('back');
  if (currentStep.value === 'form') {
    if (props.create)
      currentStep.value = 'selectBillingProfile';
    else emit('back');
  }
}
function handleSkip(type?: 'clientForm') {
  if (props.revisit && type === 'clientForm') {
    router.push({ name: 'admin-client-billing' });
  }
}
function handleSuccess() {
  emit('success');
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
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
      <KeepAlive :key="currentStep">
        <component
          :is="steps[currentStep]"
          :key="currentStep"
          v-bind="stepProps"
          @back="handleBack"
          @skip="handleSkip"
          @select-client="handleClientSelection"
          @form="prepareForPayload"
          @success="handleSuccess"
        />
      </KeepAlive>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
