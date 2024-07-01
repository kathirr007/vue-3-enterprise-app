<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import type { Feedback, FeedbackCreatePayload } from '@/types/feedback.type';
import { feedbackSubmitPayloadSchema } from '@/types/feedback.type';
import { useMutation, useQueryClient } from 'vue-query';
import StarRating from 'vue-star-rating';

import type { SchemaForm, SchemaFormField, SchemaFormRef } from '@/types/schemaform.type';
import type { APIActions, MetaObj } from '@/types/common.type';
import Textarea from 'primevue/textarea';

const props = defineProps<{
  project?: string;
  client?: string;
  feedback?: Feedback;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'success', data: Feedback): void;
  (e: 'modalClose'): void;
}>();

const { feedback: feedbackProp } = toRefs(props);

const { createFeedback, updateFeedback, ratingOptions } = useFeedback();
const queryClient = useQueryClient();
const formKey = ref(0);
const { initToast } = useToasts();
const { isFalsy, metaFilter, openLinkInNewTab } = useUtilityFns();

const formRef = ref<SchemaFormRef>();

const googleReviewUrl = computed(() => {
  if (feedbackProp.value) {
    return metaFilter(feedbackProp.value?.org.meta as MetaObj[], 'googleReviewFeedback');
  }
});

function handleAction(actionType: APIActions, data: Feedback) {
  initToast({
    actionType,
    summary: `Submit Feedback'`,
    detail: `Feedback submitted successfully.`
  });
  emit('success', data as Feedback);
}

const { mutateAsync: handleCreateUpdateFeedback, isLoading: creatingFeedback } = useMutation(
  (payload: Partial<FeedbackCreatePayload>) => {
    return feedbackProp.value ? updateFeedback({ id: feedbackProp.value?.id as string, payload }) : createFeedback(payload as FeedbackCreatePayload);
  },
  {
    onSuccess: (data) => {
      handleAction(feedbackProp.value ? 'Update' : 'Create', data);
    }
  }
);

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        name: 'rating',
        label: `Could you rate our firm service from 1 to 5, where 1 means highly not-satisfied and 5 means highly satisfied?`,
        showSlot: true,
        helpText: 'Your feedback is crucial to us.',
        required: true
      },
      {
        name: 'rateResponsiveness',
        label: `On a scale of 1 to 5, how would you rate our responsiveness to your inquiries and concerns?`,
        showSlot: true,
        required: true,
        hide: !(formRef.value?.schemaFormValues?.rating < 5)
      },
      {
        as: Textarea,
        name: 'suggestions',
        label: `We value your feedback deeply. Could you share any suggestions or comments on how we can improve our services, particularly regarding timeliness, to better meet your expectations in the future?`,
        hide: !(formRef.value?.schemaFormValues?.rating < 5)
      }
    ],
    validationSchema: feedbackSubmitPayloadSchema,
    btnText: 'Submit',
    secondaryBtnText: 'Cancel',
    hideSecondaryBtn: true
  } as SchemaForm;
});

function handleCancel() {
  emit('modalClose');
}

async function onSubmit(values: any) {
  const { client: { id: clientId }, projects, title } = feedbackProp.value as Feedback;

  const payload: Partial<FeedbackCreatePayload> = {};
  const { rating, ...rest } = values;
  payload.rating = rating;
  const meta: { question: string; answer: any }[] = [];
  for (const [key, value] of Object.entries(rest)) {
    const foundField = formData.value.fields.find((field: SchemaFormField) => field.name === key);
    const Q_A = { question: foundField?.label as string, answer: value };
    meta.push(Q_A);
  }
  payload.meta = meta;
  await handleCreateUpdateFeedback({ ...payload, status: 'COMPLETED', clientId, projectIds: !isFalsy(projects) ? [projects[0].id] : [], title } as FeedbackCreatePayload);
  // queryClient.invalidateQueries('feedback-details');
  emit('modalClose');
  if (googleReviewUrl.value && rating === 5) {
    useTimeoutFn(() => {
      openLinkInNewTab(googleReviewUrl.value as string);
    }, 1000);
  }
}
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :form-key="formKey"
    :primary-btn-loading="creatingFeedback"
    @secondary-btn-click="handleCancel"
    @submit="onSubmit"
  >
    <template #rating="{ ...attrs }">
      <div class="field mb-0">
        <label for="rating" class="cursor-pointer block font-medium text-900">
          {{ attrs.label }}
          <span v-if="attrs.required" class="text-red-600">*</span>
        </label>
        <div v-if="attrs.helpText" class="text-sm mb-2 -mt-2" v-html="attrs.helpText" />
        <VField
          v-slot="{ handleChange, value, validate }"
          name="rating"
        >
          <StarRating
            :value="value"
            :rating="(value as number)"
            input-id="rating"
            class="w-full"
            v-bind="{ ...ratingOptions, readOnly: false, starSize: 30, increment: 1 }"
            @update:rating="handleChange"
            @blur="validate()"
          />
        </VField>
        <FormFeedbackMessage
          :errors="(attrs.errors as ComputedRef).value"
          :values="(attrs.values as ComputedRef).value"
          error-key="rating"
          :feedback="true"
        />
      </div>
    </template>
    <template #rateResponsiveness="{ ...attrs }">
      <div class="field mb-0">
        <label for="rateResponsiveness" class="cursor-pointer block font-medium text-900">
          {{ attrs.label }}
          <span v-if="attrs.required" class="text-red-600">*</span>
        </label>
        <div v-if="attrs.helpText" class="text-sm mb-2 -mt-2" v-html="attrs.helpText" />
        <VField
          v-slot="{ handleChange, value, validate }"
          name="rateResponsiveness"
        >
          <StarRating
            :value="value"
            :rating="(value as number)"
            input-id="rating"
            class="w-full"
            v-bind="{ ...ratingOptions, readOnly: false, starSize: 30, increment: 1 }"
            @update:rating="handleChange"
            @blur="validate()"
          />
        </VField>
        <FormFeedbackMessage
          :errors="(attrs.errors as ComputedRef).value"
          :values="(attrs.values as ComputedRef).value"
          error-key="rateResponsiveness"
          :feedback="true"
        />
      </div>
    </template>
  </CommonSchemaForm>
</template>

<style lang="scss" scoped></style>
