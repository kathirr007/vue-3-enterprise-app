<script setup lang="ts">
import type { Step } from '@/types/common.type';
import { useQuery } from 'vue-query';
import type {
  Webform,
  WebformCreatePayload,
  WebformCreateStep,
  WebformType
} from '@/types/webforms.type';

const props = defineProps<{
  webformType: WebformType;
  clientId?: string;
  isTemplate?: boolean;
  isFromClient?: boolean;
  isCreateTemplate?: boolean;
  isRevisit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'modalClose'): void;
  (e: 'back', step: 'template'): void;
}>();

const route = useRoute();
const router = useRouter();
const { getOne } = useWebformTemplates();
const { titleCase } = useVueFilters();

const isWebformCreate = ref(route.query.isWebformCreate === 'true');
const isBrightAssist = ref(true);
const selectedTemplate = ref<string>();
const apiKey = ref(0);
const templateDetails = ref<Webform>();
const createPayload = ref<Partial<WebformCreatePayload>>();

const { isLoading: templateIsLoading } = useQuery(
  ['template-details', selectedTemplate],
  () => {
    if (!selectedTemplate.value)
      return;
    return getOne(selectedTemplate.value);
  },
  {
    onSuccess: (data: Webform) => {
      const { name, description } = data;
      if (data) {
        apiKey.value++;
        templateDetails.value = {
          ...data
        };
        createPayload.value = {
          name,
          description
        };
        currentStep.value = 'form';
      }
    }
  }
);

const currentStep = ref<WebformCreateStep>(
  props.isTemplate ? 'template' : 'form'
);

function handleTemplate(template: string) {
  if (template === selectedTemplate.value)
    currentStep.value = 'form';
  selectedTemplate.value = template;
}

const stepItems = computed(() => {
  const steps: Step[] = [
    {
      name: 'form',
      label: `Create ${titleCase(
        props.webformType === 'ORGANIZER' ? 'Request' : props.webformType
      )} ${props.isCreateTemplate ? 'Template' : ''}`
    }
    /* {
      name: 'addFields',
      label: 'Add Form Fields',
    }, */
  ];
  if (props.isTemplate) {
    steps.unshift({
      name: 'template',
      label: 'Select Template'
    });
  }
  return steps;
});

function handleCreated(data: Webform) {
  // templateDetails.value = { ...data, isClientWebform: true };
  // currentStep.value = 'addFields';
  const {
    quickstart,
    ...restQueries
  } = route.query;
  data.client
    ? router.push({
      query: { ...restQueries, isUpdateWebform: 'true', webformId: data.id }
    })
    : router.push({
      name: 'admin-webform-templates-id',
      params: { id: data.id },
      query: { ...restQueries, create: 'true', webformType: data.type }
    });
}

function handleBack() {
  if (currentStep.value === 'template')
    emit('modalClose');
  if (currentStep.value === 'form') {
    if (props.isTemplate)
      currentStep.value = 'template';
    else emit('modalClose');
  }
  // if (currentStep.value === 'addFields') currentStep.value = 'form';
}

watchEffect(() => {
  if (isWebformCreate.value) {
    currentStep.value = 'addFields';
  }
});
</script>

<template>
  <div
    class="mx-auto p-3 border-2 border-round default-border-color border-round-lg"
    :class="currentStep === 'addFields' ? 'pb-0' : 'lg:w-10 xl:w-8'"
  >
    <CommonSteps
      v-if="isBrightAssist || isTemplate"
      id="abc"
      readonly
      :items="stepItems"
      class="mb-4"
      :current="currentStep"
    />
    <div v-if="currentStep === 'template'">
      <ClientsWebformsCreateSelectTemplate
        :webform-type="webformType"
        @template="handleTemplate"
        @modal-close="handleBack"
      />
    </div>
    <div v-if="currentStep === 'form'">
      <WebformsCreateUpdateForm
        :webform-type="webformType"
        :is-from-client="isFromClient"
        :is-create-template="isCreateTemplate"
        :is-from-template="!!selectedTemplate"
        :webform-details="templateDetails"
        @back="handleBack"
        @success="handleCreated"
      />
    </div>
    <WebformsBuilder
      v-if="currentStep === 'addFields'"
      :key="route.fullPath"
      :webform="templateDetails"
      :webform-type="webformType"
      is-from-client
      is-client-webform-create
      :is-template="isTemplate"
      @back="handleBack"
      @success="emit('modalClose')"
    />
  </div>
</template>

<style lang="scss" scoped></style>
