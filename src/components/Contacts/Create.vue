<script setup lang="ts">
import type { Step } from '@/types/common.type';
import ContactAddDetailsForm from '@/components/Contacts/AddDetailsForm.vue';
import ClientBillingAddClientForm from '@/components/Contacts/AddClientForm.vue';
import type { UserContact } from '@/types/contacts.type';

const emit = defineEmits(['back', 'success']);
const router = useRouter();
const detailPayLoad = ref();
const currentStep = ref<'form' | 'clientForm'>('form');
const steps: Record<'form' | 'clientForm', unknown> = {
  form: ContactAddDetailsForm,
  clientForm: ClientBillingAddClientForm
};

const stepProps = computed(() => {
  if (currentStep.value === 'form') {
    return {
      create: true
    };
  }
  if (currentStep.value === 'clientForm') {
    return {
      addClient: true,
      contactDetails: detailPayLoad.value
    };
  }
});

const stepItems = computed(() => {
  const steps: Step[] = [
    {
      name: 'form',
      label: `Add Details`
    },
    {
      name: 'clientForm',
      label: `Add ${$tConfig('CLIENT')}s`
    }
  ];
  return steps;
});

async function handleAddDetails(value: UserContact) {
  detailPayLoad.value = value;
  currentStep.value = 'clientForm';
}

function handleBack() {
  if (currentStep.value === 'form') {
    emit('back');
  }
  else {
    currentStep.value = 'form';
  }
}
function handleSkip(type?: 'clientForm') {
  /* if (type === 'clientForm') {
  } */
  router.push({ name: 'admin-contacts' });
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
          @client-form="handleSkip"
          @add-details="handleAddDetails"
        />
      </KeepAlive>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
