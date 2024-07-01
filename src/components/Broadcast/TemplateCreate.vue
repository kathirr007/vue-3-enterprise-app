<script setup lang="ts">
import router from '@/router';
import type {
  BroadcastTemplate,
  CreateBroadcastTemplate,
} from '@/types/broadcast.type';
import type { Step } from '@/types/common.type';
import { useMutation, useQuery } from 'vue-query';
// import { Component } from 'vue';
import AddUpdateTemplate from './AddUpdateTemplate.vue';
import AddUpdateTemplateMessage from './AddUpdateTemplateMessage.vue';

const props = defineProps<{
  template?: string;
  revisit?: boolean;
}>();

const emit = defineEmits<{
  (event: 'template', template: BroadcastTemplate): void;
}>();

const { isLoading: loadingTemplate } = useQuery(
  'broadcast-template-details',
  () => {
    return props.template ? useBroadcastTemplate(props.template) : undefined;
  },
  {
    onSuccess: (data: BroadcastTemplate) => {
      emit('template', data);
      selectedTemplate.value = data;
    },
  }
);

const currentStep = ref<'basic' | 'message'>('basic');
const steps: Record<'basic' | 'message', unknown> = {
  basic: AddUpdateTemplate,
  message: AddUpdateTemplateMessage,
};

const { initToast } = useToasts();
const broadcastTo = inject<string>('broadcastTo');
const selectedTemplate = ref<BroadcastTemplate>();
const stepItems = computed(() => {
  const steps: Step[] = [
    {
      name: 'basic',
      label: `${props.revisit ? 'Update/View' : 'Add'} Basic Details`,
    },
    {
      name: 'message',
      label: `${props.revisit ? 'Update/View' : 'Add'} Message`,
    },
  ];
  return steps;
});

const handleBasic = async (values: CreateBroadcastTemplate) => {
  if (values.id) {
    await updateBroadcastTemplate({
      payload: {
        name: values.name,
        description: values.description,
        isInternal: broadcastTo === 'team' ? true : false,
        attachmentIds: values.attachmentIds ? values.attachmentIds : [],
      },
      id: values.id,
    });
  } else {
    await createBroadcastTemplate({
      name: values.name,
      description: values.description,
      isInternal: broadcastTo === 'team' ? true : false,
    });
  }
};

const handleBack = (step: 'basic' | 'message') => {
  if (step === 'basic') {
    router.push({
      name: 'admin-broadcasts-type',
      // params: { broadcastTo },
      query: { activeIndex: '1' },
    });
  } else currentStep.value = 'basic';
};

// mutations
const { mutateAsync: createBroadcastTemplate, isLoading: createIsLoading } =
  useMutation(
    (payload: CreateBroadcastTemplate) => {
      return useBroadcastTemplateCreate(payload);
    },
    {
      onSuccess: (data: BroadcastTemplate) => {
        selectedTemplate.value = data;
        initToast({
          actionType: 'Create',
          severity: 'success',
          summary: 'Success',
          detail: 'Broadcast Template Created',
        });
        currentStep.value = 'message';
      },
    }
  );
const { mutateAsync: updateBroadcastTemplate, isLoading: updateIsLoading } =
  useMutation(
    ({ payload, id }: { payload: CreateBroadcastTemplate; id: string }) => {
      return useBroadcastTemplateUpdate(payload, id);
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Update',
          severity: 'success',
          summary: 'Success',
          detail: 'Broadcast Template Updated',
        });
        currentStep.value = 'message';
      },
    }
  );

const stepProps = computed(() => {
  if (currentStep.value === 'basic') {
    return {
      createIsLoading: createIsLoading.value,
      updateIsLoading: updateIsLoading.value,
      template: selectedTemplate.value,
    };
  }
  if (currentStep.value === 'message') {
    return {
      template: selectedTemplate.value,
      messages: selectedTemplate.value?.messages,
      revisit: props.revisit,
    };
  }
});
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <div :class="currentStep !== 'message' ? 'lg:w-8 xl:w-6 mx-auto' : ''">
    <CommonSteps
      readonly
      id="abc"
      :items="stepItems"
      class="mb-4"
      :current="currentStep"
    />
    <h2 class="text-2xl">
      <span v-if="currentStep === 'basic'"
        >{{ revisit ? 'Update/View' : 'Add' }} Basic Details</span
      >
      <span v-if="currentStep === 'message'">
        {{ revisit ? 'Update/View' : 'Add' }} Message</span
      >
    </h2>
    <CommonLoading v-if="loadingTemplate" />
    <KeepAlive v-else>
      <component
        :key="currentStep"
        :is="steps[currentStep]"
        v-bind="stepProps"
        @basic="handleBasic"
        @back="handleBack"
        @updateAttachment="handleBasic"
      />
    </KeepAlive>
  </div>
</template>
