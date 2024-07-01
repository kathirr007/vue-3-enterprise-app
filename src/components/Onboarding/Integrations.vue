<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import type { OnboardingSteps } from '@/types/common.type';
import type {
  CreateOrgIntegrationPayload,
  Integration,
  OrgCategory
} from '@/types/integrations.type';
import { type OrgCreatePayload, onBoardingCategorySchema } from '@/types/myaccount.type';
import type { Designation } from '@/types/designation.type';

const props = withDefaults(defineProps<{
  loading: boolean;
  stepName: OnboardingSteps;
  categories: OrgCategory[];
  isLoading: boolean;
  isFetching: boolean;
  orgFormValues?: Partial<OrgCreatePayload>;
  allDesignations?: Designation[];
}>(), {
  categories: () => [],
  allDesignations: () => []
});

const emits = defineEmits<{
  (e: 'back', stepName: OnboardingSteps): void;
  (e: 'skip'): void;
  (e: 'categories', payload: CreateOrgIntegrationPayload, stepName: OnboardingSteps): void;
}>();

const selectedIntegrations = ref<Integration[]>([]);

// const { getDesignations } = useCommonListQueries();
// const { data: designations } = getDesignations();

const { handleSubmit, errors, meta, values, validateField, validate } = useForm({
  validationSchema: onBoardingCategorySchema
});

const categoryDesignations = computed(() => {
  return selectedIntegrations.value ? props.allDesignations?.filter((designation: Designation) => designation.orgCategories?.[0].id === selectedIntegrations.value[0]?.id) : [];
});

const { value: designationId } = useField<string | null>('designationId');

function handleSelect(value: Integration, isMultiple: boolean) {
  /* if (!isMultiple) {
    selectedIntegrations.value = [value];
  }
  else {
  } */
  if (value.isCardSelected) {
    designationId.value = null;
    const index = selectedIntegrations.value?.findIndex(
      e => e.id === value.id
    );
    if (index !== -1) {
      selectedIntegrations.value?.splice(index, 1);
    }
    else {
      if (isMultiple && props.orgFormValues?.categoryId !== 'BUSINESS') {
        selectedIntegrations.value.push(value);
      }
      else selectedIntegrations.value = [value];
    }
  }
  else {
    if (isMultiple && props.orgFormValues?.categoryId !== 'BUSINESS') {
      selectedIntegrations.value.push(value);
    }
    else selectedIntegrations.value = [value];
  }
}

const welcomeTitle = computed(() => {
  if (props.stepName === 'category')
    return 'Please select your profession';
  else {
    switch (props.orgFormValues?.categoryId) {
      case 'ACCOUNTING':
        return 'What Services does your firm offer?';
      case 'LAWYER':
        return 'What types of legal matters does your firm handle?';
      case 'BUSINESS':
        return 'Please select your business type.';

      default:
        return '';
    }
  }
});

const refactoredCategories = computed(() => {
  if (!props.categories)
    return [];
  /* const otherCategory = {
    id: 'OTHER',
    description: '',
    name: 'Other',
    isCardSelected: !!selectedIntegrations.value.find(
      e => e.id === 'OTHER'
    )
  }; */
  const modifiedCategories = props.categories
    .map((category) => {
      return {
        ...category,
        isCardSelected: !!selectedIntegrations.value.find(
          e => e.id === category.id
        )
      };
    });
  /* if (props.stepName === 'sub-category') {
    modifiedCategories.push(otherCategory);
  } */

  return modifiedCategories;
});

function onSubmit() {
  emits('categories', {
    integrationIds: selectedIntegrations.value.map(e => e.id),
    orgDesignationId: designationId.value as string
  }, props.stepName);
}
</script>

<template>
  <div class="w-full">
    <CommonLoading v-if="isLoading || isFetching" />
    <div v-else-if="categories?.length" class="card">
      <h3 class="mb-2 text-center">
        Welcome {{ props.orgFormValues?.name }}, {{ welcomeTitle }}
      </h3>
      <!-- <h6 class="my-0">
        Choose the apps you currently require to enhance your firm's
        productivity. You can always add additional apps later if not selected
        now.
      </h6> -->
      <div class="flex justify-content-center w-full">
        <IntegrationsListItems
          :integrations="(refactoredCategories as unknown as Integration[]) || []"
          is-card-clickable
          class="mt-5 justify-content-center"
          @select="handleSelect($event, stepName === 'sub-category')"
        />
      </div>
      <div v-if="stepName === 'category'" class="w-full text-center mt-4">
        <div class="text-left field col-12 md:col-4 mx-auto">
          <label for="designationId" class="block font-medium text-900">
            Designation
            <span class="text-red-600">*</span>
          </label>
          <VField v-slot="{ handleChange, value, validate }" tag="div" name="designationId">
            <Dropdown
              id="designationId"
              input-id="designationId"
              class="w-full"
              :model-value="value"
              :options="categoryDesignations"
              option-label="name"
              option-value="id"
              placeholder="Select a Designation"
              @update:model-value="handleChange"
              @blur="validate()"
            >
              <template #option="{ option }">
                <div class="flex justify-content-between">
                  <div>{{ option.name }}</div>
                  <div v-if="option.org === null && option.orgCategories">
                    <span class="text-orange-500">{{ option.orgCategories[0].name }}</span>
                  </div>
                </div>
              </template>
            </Dropdown>
          </VField>
          <transition mode="out-in" name="field-slide-down">
            <FormFeedbackMessage
              :errors="errors"
              :values="values"
              error-key="designationId"
              :feedback="false"
            />
          </transition>
        </div>
      </div>
      <div class="flex justify-content-between w-full mt-4">
        <Button
          class="max-w-max mr-auto p-button-text"
          label="Back"
          icon="pi pi-chevron-left"
          @click="emits('back', stepName)"
        />
        <Button
          class="max-w-max"
          :label="stepName === 'category' ? 'Next' : 'Submit'"
          :disabled="!selectedIntegrations.length || (stepName === 'category' && !meta.valid)"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </div>
    <div v-else>
      No {{ stepName === 'category' ? 'categories' : 'sub-categories' }} Found.
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
