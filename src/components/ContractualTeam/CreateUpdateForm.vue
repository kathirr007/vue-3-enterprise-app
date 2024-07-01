<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import type { SchemaFormRef } from '@/types/schemaform.type';
import type {
  CreateUserPayload,
  UpdateContractTeamMemberPayload,
  User
} from '@/types/teams.type';
import { UpdateContractTeamMemberPayloadSchema } from '@/types/teams.type';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useMutation, useQueryClient } from 'vue-query';

import type { Attachment } from '@/types/attachment.type';

const props = defineProps<{
  user?: User;
  userId?: string;
}>();

const emit = defineEmits<{
  (e: 'success', data: User): void;
  (e: 'update', data: User): void;
  (e: 'modalClose'): void;
}>();

const formRef = ref<SchemaFormRef>();
const formKey = ref(0);

const queryClient = useQueryClient();
const route = useRoute();
const userId = props.userId
  ? ref(props.userId)
  : ref(route.params.id as string);
const { initToast } = useToasts();
const { currentUser, updateUserToken } = useCurrentUserData();
function showToast(data: User) {
  initToast({
    actionType: userId.value ? 'Update' : 'Create',
    title: 'Team Member',
    actionObj: data
  });
}
const { isPortalUser } = useCurrentUserData();
const { getCurrentUser } = useMe();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);

const { getDesignations, getRoles, getUsers } = useCommonListQueries();
const isPortal = computed(() => !isPortalUser.value);

const { data: designations } = getDesignations(isPortal);
const { data: roles } = getRoles(isPortal);

const { data: users } = getUsers(true, isPortal, initialFilters);
// const { data: currentUser } = useQuery('current-user', async () => useUser());
const usersOptions = computed(() => {
  if (users.value) {
    return !currentUser.value?.isOwner
      && currentUser.value?.id === props.user?.id
      ? users.value?.filter((user: User) => user.id !== currentUser.value?.id)
      : users.value;
  }
  return [];
});

const formData = computed(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'firstName',
        label: props.userId || userId.value ? 'First Name' : 'Team Member',
        required: true,
        autocomplete: 'off',
        placeholder: 'First Name',
        formGridClass: 'md:col-6'
      },
      {
        as: InputText,
        name: 'lastName',
        label: 'Last Name',
        required: true,
        autocomplete: 'off',
        placeholder: 'Last Name',
        formGridClass: 'md:col-6',
        hide: !(props.userId || userId.value)
      },
      {
        as: InputText,
        name: 'email',
        label: 'Email',
        placeholder: 'Email',
        required: true,
        formGridClass: 'md:col-6',
        disabled: !!(props.userId || userId.value)
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'managerId',
        label: 'Report To',
        placeholder: 'Report To',
        formGridClass: 'md:col-6',
        optionLabel: 'name',
        optionValue: 'id',
        hide: isPortalUser.value,
        required: !props.user?.isOwner,
        options: usersOptions.value,
        clearable: !!props.user?.isOwner
      },
      {
        as: InputText,
        name: 'mobile',
        label: 'Mobile',
        formGridClass: 'md:col-6',
        placeholder: 'Mobile',
        type: 'number',
        hide: !(props.userId || userId.value)
      },
      {
        as: InputText,
        name: 'phone',
        label: 'Phone',
        formGridClass: 'md:col-6',
        placeholder: 'Phone',
        type: 'number',
        hide: !(props.userId || userId.value)
      }
    ],
    validationSchema: UpdateContractTeamMemberPayloadSchema,

    initialValues: props.user
      ? {
          ...props.user,
          picture: (props.user.picture as Attachment)?.id,
          isPortal: isPortalUser.value,
          isOwner: props.user.isOwner
        }
      : { isPortal: isPortalUser.value, isOwner: false },
    btnText: props.user ? 'Update' : 'Submit'
  };
});

const {
  mutateAsync: createUpdateTeamMember,
  isLoading: createUpdateIsLoading
} = useMutation(
  (payload: CreateUserPayload | UpdateContractTeamMemberPayload) => {
    if (props.user) {
      return useUserUpdateDetails(
        props.user.id,
        payload as UpdateContractTeamMemberPayload,
        isPortalUser.value
      );
    }
    return useUserCreate(payload as CreateUserPayload);
  },
  {
    onSuccess: async (data) => {
      if (data) {
        showToast(data as User);
        emit('modalClose');
        if (props.user) {
          queryClient.invalidateQueries('user-details');
        }
        else {
          queryClient.invalidateQueries('teams-list');
        }
        if ((data as User).id === currentUser.value?.id) {
          const updatedUserData = await getCurrentUser();
          updateUserToken(updatedUserData);
        }
      }
    }
  }
);

async function onSubmit(values: Record<string, any>) {
  const payload: Partial<
    (CreateUserPayload | UpdateContractTeamMemberPayload) & { salary: string }
  > = { ...values, salary: values.salary?.toString() };
  if ((values as UpdateContractTeamMemberPayload).phone === '') {
    (payload as UpdateContractTeamMemberPayload).phone = null;
  }
  if ((values as UpdateContractTeamMemberPayload).mobile === '') {
    (payload as UpdateContractTeamMemberPayload).mobile = null;
  }
  await createUpdateTeamMember(
    payload as unknown as (
      | CreateUserPayload
      | UpdateContractTeamMemberPayload
    ) & {
      salary: string;
    }
  );
}
</script>

<template>
  <CommonSchemaForm
    :key="formKey"
    ref="formRef"
    :data="formData"
    :primary-btn-loading="createUpdateIsLoading"
    @submit="onSubmit"
  >
    <template #designationId="{ ...attrs }">
      <div class="field mb-0">
        <label class="block font-medium text-900" for="designationId">{{ attrs.label }}
          <span v-if="attrs.required" class="text-red-600">*</span></label>
        <VField v-slot="{ handleChange, value, validate }" name="designationId">
          <Dropdown
            :tabindex="0"
            class="w-full"
            :model-value="value"
            v-bind="attrs"
            @update:model-value="handleChange"
            @blur="validate()"
          >
            <template #header>
              <RouterLink
                :to="{ name: 'admin-roles-and-designations' }"
                class="flex align-items-center py-2 px-3 font-medium text-sm text-gray-500 hover:text-gray-700"
              >
                Add New Designation
                <Icon icon="mdi:external-link" class="ml-1 h-1.5rem w-1.5rem" />
              </RouterLink>
            </template>
            <template #option="slotProps">
              <div class="w-full flex justify-content-between">
                <div>{{ slotProps.option.name }}</div>
                <div v-if="slotProps.option.org === null">
                  <span class="text-orange-500">Predefined</span>
                </div>
              </div>
            </template>
          </Dropdown>
        </VField>
      </div>
    </template>
  </CommonSchemaForm>
</template>
