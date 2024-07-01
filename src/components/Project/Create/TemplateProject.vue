<script setup lang="ts">
import type { Service, TemplatePayload } from '@/types/service.type';
import { TemplateSchema } from '@/types/service.type';
import { Field as VField } from 'vee-validate';

const props = defineProps<{
  template?: string;
  loading?: boolean;
}>();
const emit = defineEmits<{
  (event: 'cancel'): void;
  (event: 'back', step: 'template'): void;
  (event: 'template', value: string): void;
  (event: 'modalClose'): void;
}>();

const { getServices } = useCommonListQueries();
const { data: serviceTemplates, isLoading } = getServices(true);
const { meta, values, errors } = useForm({
  validationSchema: TemplateSchema,
  initialValues: props.template ? { template: props.template } : {},
  validateOnMount: false
});

const filteredTemplates = computed(() => {
  if (serviceTemplates.value) {
    return serviceTemplates.value.filter((template: Service) => template.org);
  }
  return [];
});

function onSubmit() {
  const payload: TemplatePayload = { ...values } as TemplatePayload;
  emit('template', payload.template);
}

function handleCancel() {
  // cancel the form
  emit('modalClose');
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
              :options="filteredTemplates"
              option-label="name"
              option-value="id"
              placeholder="Select Template"
              :show-clear="true"
              :loading="isLoading"
              @update:model-value="handleChange"
              @blur="validate()"
            >
              <template #header>
                <RouterLink
                  :to="{ name: 'admin-services' }"
                  class="flex align-items-center py-2 px-3 font-medium text-sm text-gray-500 hover:text-gray-700"
                >
                  Add New Project Template
                  <Icon
                    icon="mdi:external-link"
                    class="ml-1 h-1.5rem w-1.5rem"
                  />
                </RouterLink>
              </template>
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
        class="max-w-max mr-auto"
        label="Cancel"
        severity="danger"
        @click="handleCancel"
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
