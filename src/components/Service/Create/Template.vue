<script setup lang="ts">
import type { TemplatePayload } from '@/types/service.type';
import { TemplateSchema } from '@/types/service.type';
import { Field as VField } from 'vee-validate';

const props = defineProps<{
  template?: string;
  loading?: boolean;
}>();
const emit = defineEmits<{
  (event: 'back', step: 'template'): void;
  (event: 'template', value: string): void;
}>();

const { getServices } = useCommonListQueries();
const { data: serviceTemplates, isLoading } = getServices(true);
const { meta, values, errors } = useForm({
  validationSchema: TemplateSchema,
  initialValues: props.template ? { template: props.template } : {},
  validateOnMount: false
});

function onSubmit() {
  const payload: TemplatePayload = { ...values } as TemplatePayload;
  emit('template', payload.template);
}
</script>

<template>
  <form class="grid formgrid">
    <div class="col-12 py-2">
      <div class="field mb-0">
        <label for="template" class="block font-medium text-900">
          <span>Template <span class="text-red-500">*</span></span>
        </label>
        <div class="w-full">
          <VField v-slot="{ handleChange, value, validate }" name="template">
            <Dropdown
              id="template"
              :tabindex="0"
              class="w-full"
              name="template"
              :model-value="value"
              :options="serviceTemplates"
              option-label="name"
              option-value="id"
              placeholder="Select Template"
              :show-clear="true"
              :loading="isLoading"
              @update:model-value="handleChange"
              @blur="validate()"
            >
              <template #option="slotProps">
                <div class="flex justify-content-between">
                  <div>{{ slotProps.option.name }}</div>
                  <div v-if="!slotProps.option.org">
                    <span class="text-orange-500">Predefined</span>
                  </div>
                </div>
              </template>
            </Dropdown>
          </VField>
        </div>
      </div>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :errors="errors"
          :values="values"
          error-key="template"
          :feedback="false"
        />
      </transition>
    </div>
    <div class="flex w-full justify-content-between mt-3 ml-auto col-12">
      <Button
        class="max-w-max mr-auto p-button-text"
        label="Back"
        icon="pi pi-chevron-left"
        @click="emit('back', 'template')"
      />
      <Button
        class="max-w-max ml-auto"
        :disabled="!meta.valid"
        type="submit"
        label="Next"
        :loading="loading"
        @click.prevent="onSubmit"
      />
    </div>
  </form>
</template>
