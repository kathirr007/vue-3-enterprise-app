<script lang="ts" setup>
import type {
  Integration, OrgCategory
} from '@/types/integrations.type';
import type { Org } from '@/types/myaccount.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const props = defineProps<{
  orgData?: Org;
  isLoading?: boolean;
}>();

const { orgData: orgDataProp } = toRefs(props);
const { getOneCategory, attachSubCategory } = useOrgOnboarding();
const { initToast } = useToasts();
const { titleCase } = useVueFilters();
const queryClient = useQueryClient();

const refetchKey = ref(1);
const helpText = ref();

const { data: categoryData, isLoading: categoryLoading } = useQuery('orgs-data', () => {
  return getOneCategory(orgType.value);
});

const selectedSubcategories = computed(() => {
  return orgDataProp?.value?.assignedSubCategories;
});
const newSubcategories = ref<OrgCategory[]>([]);
const failedRecords = ref<Partial<OrgCategory & { error?: string }>[]>([]);
const successRecords = ref<Partial<OrgCategory & { error?: string }>[]>([]);

const refactoredCategories = computed(() => {
  const modifiedCategories = categoryData.value?.subCategories?.map((category: any) => {
    return {
      ...category,
      isCardSelected: !!newSubcategories.value?.find(
        e => e.id === category.id
      )
    };
  });

  return modifiedCategories;
});

function handleSelect(value: Integration, isMultiple: boolean) {
  /* if (!isMultiple) {
    selectedIntegrations.value = [value];
  }
  else {
  } */
  if (value.isCardSelected) {
    const index = newSubcategories.value?.findIndex(
      e => e.id === value.id
    );
    if (index !== -1) {
      newSubcategories.value?.splice(index as number, 1);
    }
    else {
      if (isMultiple && orgDataProp?.value?.categoryId !== 'BUSINESS') {
        newSubcategories.value?.push(value as unknown as OrgCategory);
      }
      else newSubcategories.value = [value as unknown as OrgCategory];
    }
  }
  else {
    if (isMultiple && orgDataProp?.value?.categoryId !== 'BUSINESS') {
      newSubcategories.value?.push(value as unknown as OrgCategory);
    }
    else newSubcategories.value = [value as unknown as OrgCategory];
  }
}

const { mutateAsync: handleAttachSubCategory, isLoading: attachingSubcategory } = useMutation(
  (payload: { subcategoryIds: string[] }) => {
    return attachSubCategory(payload);
  },
  {
    onSuccess: async (data: OrgCategory, variables) => {
      initToast({
        actionType: 'Update',
        summary: 'Org Subcategory Update',
        detail: `Organization ${variables.subcategoryIds.length > 1 ? 'subcategories' : 'subcategory'} <strong>${variables.subcategoryIds.map((item: string) => titleCase(item, '_')).join(', ')}</strong> added successfully.`
      });
      successRecords.value?.push({ ...variables, error: '' });
    }
  }
);

async function onSubmit() {
  const payloadIds = newSubcategories.value.filter((item: OrgCategory) => {
    const existingSubcategoryIds = selectedSubcategories.value?.map((item: OrgCategory) => item.id);
    return !existingSubcategoryIds?.includes(item.id);
  }).map((item: any) => item.id);
  await handleAttachSubCategory({ subcategoryIds: payloadIds });
  queryClient.invalidateQueries('org-data');
  refetchKey.value++;
}

function toggle(event: any) {
  if (orgType.value !== 'BUSINESS')
    return;
  helpText.value?.toggle(event);
}

watchEffect(() => {
  if (props.isLoading) {
    newSubcategories.value = [];
  }
  if (orgDataProp?.value) {
    newSubcategories.value = [...orgDataProp?.value.assignedSubCategories as OrgCategory[]];
  }
});
</script>

<template>
  <div class="flex justify-content-center w-full">
    <CommonLoading v-if="isLoading" />
    <IntegrationsListItems
      v-else
      :key="refetchKey"
      :integrations="(refactoredCategories as unknown as Integration[]) || []"
      :selected-integrations="(selectedSubcategories as unknown as Integration[])"
      is-card-clickable
      class="mt-5 justify-content-center"
      @select="handleSelect($event, orgData?.categoryId !== 'BUSINESS')"
    />
  </div>
  <div class="flex justify-content-end w-full mt-4">
    <span
      class="inline-block" @click="toggle"
      @mouseover="toggle"
      @keyup.enter="toggle"
    >
      <Button
        class="max-w-max"
        label="Submit"
        :loading="attachingSubcategory"
        :disabled="orgType === 'BUSINESS'"
        @click="onSubmit"
      />
      <OverlayPanel ref="helpText">
        <div class="w-25rem">
          To change subcategory, please contact
          <a href="mailto:help@brightreturn.com" class="font-medium underline">help@brightreturn.com</a>
          for assistance.
        </div>
      </OverlayPanel>
    </span>
  </div>
</template>
