<script lang="ts" setup>
import { Field as VField } from 'vee-validate';
import type { Org, OrgCreatePayload } from '@/types/myaccount.type';
import type { SchemaFormRef } from '@/types/schemaform.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import InputText from 'primevue/inputtext';
import { feedbackSettingPayloadSchema } from '@/types/feedback.type';

const { initToast } = useToasts();
const { assignObj1ToObj2 } = useUtilityFns();
const queryClient = useQueryClient();
const orgUpdateRef = ref<SchemaFormRef | null>(null);

const formKey = ref(0);

const { data: orgDetails, isLoading } = useQuery('org-data', () => {
  return useOrgDetails();
});

const { mutateAsync: createUpdateOrg, isLoading: updatingFeedbackSetting } = useMutation(
  (payload: Partial<OrgCreatePayload>) => {
    return useOrgUpdate(payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Organization Feedback Setting Update',
        detail: 'Organization feedback setting updated successfully.'
      });
      queryClient.invalidateQueries('org-data');
    }
  }
);

const orgInitialValues = computed(() => {
  return {
    name: orgDetails.value?.name,
    googleReviewFeedback: orgDetails.value?.googleReviewFeedback,
    isClientFeedbackActive: orgDetails.value?.isClientFeedbackActive === 'true'
  };
});

const formData = computed(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'googleReviewFeedback',
        label: 'Google review URL',
        autocomplete: 'off',
        placeholder: 'Enter your Google review URL'
      },
      {
        name: 'isClientFeedbackActive',
        label: 'Enable Rating',
        showSlot: true
      }
    ],
    initialValues: orgInitialValues,
    validationSchema: feedbackSettingPayloadSchema,
    btnText: 'Submit'
  };
});

function createOrgPayload(values: Partial<Org>) {
  let payload: Partial<OrgCreatePayload> = {
    ...values
  } as Partial<OrgCreatePayload>;
  payload = { ...assignObj1ToObj2(payload, {}, true), isClientFeedbackActive: `${values.isClientFeedbackActive}` };
  return payload;
}
async function onSubmit(values: Partial<Org>) {
  await createUpdateOrg(createOrgPayload(values));
}

watch(
  () => orgDetails.value,
  (val) => {
    if (val) {
      orgUpdateRef.value?.setValues({
        ...orgUpdateRef.value?.schemaFormValues,
        name: val.name,
        timezone: val.timezone
      });
    }
  },
  {
    deep: true,
    immediate: true
  }
);
</script>

<template>
  <CommonSchemaForm
    ref="orgUpdateRef"
    :key="formKey"
    :data="formData"
    :primary-btn-loading="updatingFeedbackSetting"
    @submit="onSubmit"
  >
    <template #isClientFeedbackActive="{ ...attrs }">
      <div class="field mb-0">
        <div class="flex align-items-center gap-3">
          <label for="isClientFeedbackActive" class="cursor-pointer block font-medium text-900">
            {{ attrs.label }}
            <span v-if="attrs.required" class="text-red-600">*</span>
          </label>
          <VField
            v-slot="{ handleChange, value, validate }"
            name="isClientFeedbackActive"
          >
            <InputSwitch
              :value="value"
              :model-value="(value as string)"
              input-id="isClientFeedbackActive"
              @update:model-value="handleChange"
              @blur="validate()"
            />
          </VField>
        </div>
        <FormFeedbackMessage
          :errors="(attrs.errors as ComputedRef).value"
          :values="(attrs.values as ComputedRef).value"
          error-key="isClientFeedbackActive"
          :feedback="true"
        />
      </div>
    </template>
  </CommonSchemaForm>
</template>

<style lang="scss" scoped>

</style>
