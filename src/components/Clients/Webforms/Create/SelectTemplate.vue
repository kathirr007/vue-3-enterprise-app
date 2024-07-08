<script setup lang="ts">
import type { TemplatePayload } from '@/types/service.type';
import { TemplateSchema } from '@/types/service.type';
import type { WebformType } from '@/types/webforms.type';
import { Field as VField } from 'vee-validate';
import { useQuery } from 'vue-query';

const props = defineProps<{
  webformType: WebformType;
  template?: string;
  loading?: boolean;
}>();
const emit = defineEmits<{
  (event: 'cancel'): void;
  (event: 'back', step: 'template'): void;
  (event: 'template', value: string): void;
  (event: 'modalClose'): void;
}>();

const route = useRoute();
const router = useRouter();
const { getAll } = useWebformTemplates();
const { titleCase } = useVueFilters();
const { data: filterData, applyFilter } = useFilterColumns();

const initialFilters = computed(() => {
  applyFilter('Type', [props.webformType || '']);

  const initialFiltersString = useEncodeFilterData(filterData);
  return initialFiltersString;
});

const { data: webformTemplates, isLoading: loadingWebformTemplates } = useQuery(
  ['webform-templates-list'],
  () => {
    return getAll({
      filters: initialFilters.value,
      isTemplate: true
    });
  }
);

const { meta, values, errors } = useForm({
  validationSchema: TemplateSchema,
  initialValues: props.template ? { template: props.template } : {},
  validateOnMount: false
});

function onSubmit() {
  const payload: TemplatePayload = { ...values } as TemplatePayload;
  emit('template', payload.template);
}

function handleCancel() {
  emit('modalClose');
}

function gotoTemplatesList() {
  if (route.name === 'admin-webform-templates') {
    emit('modalClose');
  }
  else {
    router.push({
      name: 'admin-webform-templates',
      query: { activeIndex: props.webformType === 'ORGANIZER' ? 0 : 1 }
    });
  }
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
              :options="webformTemplates?.results"
              option-label="name"
              option-value="id"
              placeholder="Select Template"
              :show-clear="true"
              :loading="loadingWebformTemplates"
              @update:model-value="handleChange"
              @blur="validate()"
            >
              <template #header>
                <span
                  class="cursor-pointer flex align-items-center py-2 px-3 font-medium text-sm text-gray-500 hover:text-gray-700"
                  @click="gotoTemplatesList"
                >
                  Add New
                  {{
                    titleCase(
                      webformType === 'ORGANIZER' ? 'Request' : webformType,
                    )
                  }}
                  Template
                  <Icon
                    icon="mdi:external-link"
                    class="ml-1 h-1.5rem w-1.5rem"
                  />
                </span>
              </template>
              <template #option="{ option }">
                <div class="flex justify-content-between">
                  <div>{{ option.name }}</div>
                  <div v-if="option.org === null">
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
