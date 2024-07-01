<script setup lang="ts">
import router from '@/router';
import type { OrgCategoryId } from '@/types/app.type';
import type { OnboardingSteps } from '@/types/common.type';
import type { CreateOrgIntegrationPayload, OrgCategory } from '@/types/integrations.type';
import type { OrgCreatePayload } from '@/types/myaccount.type';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const cookies = useCookies([
  'user'
]);
const { appData } = useAppData();
const { initToast } = useToasts();
const { create } = useOrgIntegrations();
const { getAllCategories, getOneCategory, updateOrg } = useOrgOnboarding();
const { currentUser, updateUserToken } = useCurrentUserData();
const { getPermissions } = usePermissions();
const { getCurrentUser } = useMe();
const { getDesignations } = useCommonListQueries();
const { assignObj1ToObj2, removeFalsyValues } = useUtilityFns();
const queryClient = useQueryClient();

const isLogoUpdate = ref(false);
const currentStep = ref<OnboardingSteps>('form');
const selectedCategory = ref<string>();
const selectedDesignationId = ref<string>();
const selectedSubCategories = ref<string[]>();
const orgFormValues = ref<Partial<OrgCreatePayload>>();
// const canCallSubCategories

const { data: allDesignations } = getDesignations();

const { data: allCategories, isLoading: loadingCategories, isFetching: fetchingCategories } = useQuery('org-categories', () => {
  return getAllCategories();
});

const { data: subCategories, isLoading: loadingSubCategories, isFetching: fetchingSubCategories } = useQuery(['org-sub-categories', selectedCategory], () => {
  if (!selectedCategory.value)
    return;
  return getOneCategory(selectedCategory.value as OrgCategoryId);
});

const categories = computed(() => {
  if (currentStep.value === 'category')
    return allCategories.value;
  if (currentStep.value === 'sub-category')
    return subCategories.value?.subCategories
    ;
});

/* const categoryDesignations = computed(() => {
  if (currentStep.value === 'sub-category')
    return subCategories.value?.designations;
  return [];
}); */

const { data: orgData, isLoading: gettingOrg } = useQuery('org-data', () => {
  return useOrgDetails();
});

const { isLoading, mutateAsync: createUpdateOrg } = useMutation(
  ({ id, payload, isLogoUpdate }: { id: string; payload: Partial<OrgCreatePayload>; isLogoUpdate?: boolean }) => {
    return isLogoUpdate ? useOrgUpdate(payload) : updateOrg({ id, payload });
  },
  {
    onSuccess: () => {
      queryClient.invalidateQueries('org-data');
      initToast({
        actionType: 'Update',
        summary: isLogoUpdate.value ? 'Update Logo' : 'Organization Onboarding',
        detail: `Organization ${isLogoUpdate.value ? 'Logo updated' : 'Onboarding completed'} successfully.`
      });
    }
  }
);

const {
  isLoading: creatingOrgIntegrations,
  mutateAsync: createOrgIntegrations
} = useMutation((payload: CreateOrgIntegrationPayload) => {
  return create(payload);
});

async function handleForm(values: OrgCreatePayload, isCompleted?: boolean) {
  const payload = {
    ...values
  } as Partial<OrgCreatePayload>;
  isLogoUpdate.value = !isCompleted;
  if (isCompleted) {
    orgFormValues.value = { ...values };
    currentStep.value = 'category';
  }
  else {
    await createUpdateOrg({ id: orgData.value?.id as string, payload, isLogoUpdate: !isCompleted });
  }
  // orgFormValues.value = { ...values };
  // currentStep.value = 'category';
}

async function updateOrgOnboarding() {
  let payload = {
    ...orgFormValues.value,
    subcategories: selectedSubCategories.value as string[],
    categoryId: selectedCategory.value as string,
    isOnBoardingCompleted: true,
    logo: orgData.value?.logo ? orgData.value.logo.id : null,
    designationId: selectedDesignationId.value as string
  } as Partial<OrgCreatePayload>;

  // payload = removeFalsyValues(payload);
  payload = assignObj1ToObj2(payload, {}, true);

  await createUpdateOrg({ id: orgData.value?.id as string, payload });
  initToast({
    actionType: 'Update',
    summary: 'Organization Onboarding Completed',
    detail: 'Organization Onboarding completed successfully'
  });
  const data = await getPermissions();
  userPerms.value = btoa(JSON.stringify(data));
  const userData = await getCurrentUser();
  updateUserToken(userData);
  await nextTick();
  router.push({ name: 'index' });
}
async function handleCategories(values: CreateOrgIntegrationPayload, stepName: OnboardingSteps) {
  if (stepName === 'category') {
    selectedCategory.value = values.integrationIds[0];
    orgFormValues.value = { ...orgFormValues.value, categoryId: values.integrationIds[0] as OrgCategoryId } as Partial<OrgCreatePayload>;
    selectedDesignationId.value = values.orgDesignationId;
    currentStep.value = 'sub-category';
  }
  else {
    selectedSubCategories.value = values.integrationIds;
    // await createOrgIntegrations(values);
    await updateOrgOnboarding();
  }
}

function handleBack(stepName: OnboardingSteps) {
  switch (stepName) {
    case 'category':
      currentStep.value = 'form';
      break;
    case 'sub-category':
      currentStep.value = 'category';
      break;
    default:
      break;
  }
}
</script>

<template>
  <div
    class="mx-auto flex justify-content-center lg:justify-content-between p-2 lg:p-5"
  >
    <div
      class="flex flex-column align-items-center"
      :class="`${currentStep === 'form' ? 'sm:w-10 md:w-6' : 'w-full'}`"
    >
      <a
        href="https://www.brightreturn.com/"
        target="_blank"
        title="Bright Return"
        class="mx-auto mt-4 lg:mt-0"
      >
        <img
          :src="appData.logoExtended"
          alt="appData.logoAltText"
          height="70"
          class="mb-2"
        >
      </a>
      <Divider />
      <CommonLoading v-if="gettingOrg" />
      <template v-else-if="currentStep === 'form'">
        <h2 class="text-primary text-2xl mt-0 mb-3">
          Welcome to Brightreturn
        </h2>
        <div
          class="card border-2 border-round default-border-color border-round-lg w-full xl:w-9 mx-auto"
        >
          <OnboardingForm
            :loading="isLoading"
            :org="orgData"
            :org-form-values="orgFormValues"
            class=""
            @form="handleForm"
          />
        </div>
      </template>
      <transition v-else mode="out-in" name="slide-up">
        <OnboardingIntegrations
          :key="currentStep"
          :org-form-values="orgFormValues"
          :is-loading="loadingCategories || loadingSubCategories"
          :is-fetching="fetchingCategories || fetchingSubCategories"
          :loading="creatingOrgIntegrations || isLoading"
          :step-name="currentStep"
          :all-designations="allDesignations"
          :categories="(categories as OrgCategory[])"
          @back="handleBack"
          @categories="handleCategories($event, currentStep)"
          @skip="updateOrgOnboarding"
        />
      </transition>
    </div>
    <div v-if="currentStep === 'form'" class="flex align-content-center md:w-6">
      <div
        class="welcome-info hidden md:block bg-no-repeat info-graphics w-full bg-none"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-heading {
  @media (width <= 991px) {
    padding: 14px;
    margin-top: 2rem;
  }
}

.bg-none {
  background-color: transparent !important;
}
</style>

<route lang="yaml">
meta:
  layout: switch-account
</route>
