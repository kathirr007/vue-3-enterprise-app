<script setup lang="ts">
import Divider from 'primevue/divider';
import InputText from 'primevue/inputtext';
import type { User, UserOptionalUpdatePayload } from '@/types/teams.type';
import { UserOptionalUpdatePayloadSchema } from '@/types/teams.type';
import type { Attachment } from '@/types/attachment.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import Title from '../Form/Title.vue';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

import Calender from 'primevue/calendar';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import type { Ref } from 'vue';
import Editor from 'primevue/editor';
import Dropdown from 'primevue/dropdown';

const props = defineProps<{
  userId?: string;
}>();

const disabledTooltip = inject('disabledTooltip', '');
const canDoActions = inject('canDoActions', true);
const { isFalsy } = useUtilityFns();
const { isPortalUser } = useCurrentUserData();
const route = useRoute();
const userId = props.userId
  ? ref(props.userId)
  : ref(route.params.id as string);
const confirmStatusDialog = ref(false);
const confirmDeleteDialog = ref(false);
const country = ref('');
const formValues = ref<User>();
const formKey = ref(0);
const formRef = ref<SchemaFormRef | null>(null);

const { focusAndBlurInput } = useUtilityFns();
const { currentUser, updateUserToken } = useCurrentUserData();
const { initToast } = useToasts();
const queryClient = useQueryClient();
const { canDo, featureSubscribed } = usePermissions();

function showToast() {
  initToast({
    actionType: 'Update',
    title: 'Team Member',
    actionObj: { ...userDetails.value }
  });
}

const { getCountriesList, getStatesList } = useCommonListQueries();

const { data: countriesList } = getCountriesList();

const countryEnabled = computed(() => !!country.value);

const { data: statesList } = getStatesList(
  country,
  countryEnabled,
  'states-list'
);

const { data: userDetails } = useQuery<User>(
  'user-details',
  async () => {
    return useUserDetails(userId.value, isPortalUser.value);
  },
  {
    onSuccess: (data: User) => {
      if (data) {
        if (data.isOwner) {
          formData.value.fields = formData.value.fields.filter((e) => {
            return !(e.name === 'reportTo' || e.name === 'invitedBy');
          });
        }
        formValues.value = data;
        if (currentUser.value?.id === data.id) {
          const currentUserData = JSON.parse(atob(userToken.value));
          updateUserToken({ ...currentUserData, user: data as User });
        }
      }
    }
  }
);

const activeStatus = computed(() => {
  return userDetails.value?.isActive ? 'Deactivate' : 'Activate';
});

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        as: Textarea,
        name: 'notes',
        label: 'Notes',
        placeholder: 'Enter Notes',
        hide: isPortalUser.value,
        rows: 5,
        showSlot: true
      },

      {
        as: Divider,
        name: 'divider2',
        hide: true
      },
      {
        as: Title,
        name: 'title2',
        label: 'Other Information',
        hide: true
      },
      {
        as: Calender,
        type: 'calender',
        name: 'dob',
        label: 'Date of Birth',
        placeholder: 'Select Date of Birth',
        formGridClass: 'md:col-6',
        dateFormat: 'dd M yy',
        hide: true
      },
      {
        as: InputNumber,
        type: 'input-number',
        mode: 'currency',
        currency: 'USD',
        locale: 'en-US',
        label: 'Salary(Monthly)',
        inputGroup: true,
        inputGroupPrefix: '$',
        formGridClass: 'md:col-6',
        name: 'salary',
        placeholder: '$0.00',
        hide: true
      },

      {
        as: Divider,
        name: 'divider',
        label: 'divider',
        hide: isPortalUser.value
      },

      {
        as: Title,
        name: 'title',
        label: 'Address Information'
      },
      {
        as: InputText,
        name: 'address',
        label: 'Street',
        placeholder: 'Street',
        formGridClass: 'md:col-6'
      },
      {
        as: InputText,
        name: 'city',
        label: 'City',
        placeholder: 'City',
        formGridClass: 'md:col-6'
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'country',
        label: 'Country',
        optionLabel: 'country',
        optionValue: 'country',
        placeholder: 'Country',
        formGridClass: 'md:col-6',
        options: countriesList.value || []
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'state',
        label: 'State',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: 'State',
        formGridClass: 'md:col-6',
        options: statesList.value || []
      },
      {
        as: InputText,
        name: 'zipcode',
        label: 'Zipcode',
        placeholder: 'Zipcode',
        formGridClass: 'md:col-6'
        // disabled: isFalsy(formRef.value?.schemaFormValues?.country)
      },
      {
        as: Divider,
        name: 'divider',
        label: 'divider'
      },
      {
        as: Title,
        name: 'title',
        label: 'Local Information'
      },
      {
        as: InputText,
        name: 'language',
        label: 'Language',
        placeholder: 'Language',
        formGridClass: 'md:col-6'
      },
      {
        as: Editor,
        type: 'editor',
        name: 'signature',
        label: 'Signature',
        editorStyle: 'height: 160px'
      }
    ],
    validationSchema: UserOptionalUpdatePayloadSchema,
    initialValues: userDetails,
    btnText: 'Submit',
    hideButtons: !isPortalUser.value && !canDo('users', 'edit')
  } as SchemaForm;
});

function handleDropdownChange(val: Record<string, any>, name?: string) {
  if (name === 'country') {
    formRef.value?.setFieldValue('state', null);
    formRef.value?.validateField('zipcode');
  }
  formValues.value = val as unknown as User;
}

const { findFormIndex, updateFieldsProps } = useSchemaForm(formData);
const countriesIndex = findFormIndex('country');
const statesIndex = findFormIndex('state');
const deisgnationIndex = findFormIndex('designationId');
const roleIndex = findFormIndex('orgUserRoleId');
const managerIndex = findFormIndex('managerId');
const dividerIndex = findFormIndex('divider2');
const titleIndex = findFormIndex('title2');
const dobIndex = findFormIndex('dob');
const salaryIndex = findFormIndex('salary');

function handleFormFields() {
  const loggedInUser = { ...currentUser.value };

  const fieldIndexesToUpdate = [
    dividerIndex,
    titleIndex,
    dobIndex,
    salaryIndex
  ];

  if (loggedInUser?.orgRole?.name === 'Level 1') {
    updateFieldsProps(fieldIndexesToUpdate, 'hide', false);
  }
  else {
    updateFieldsProps(fieldIndexesToUpdate, 'hide', true);
  }
  // const isCurrentUserLevel1 = loggedInUser?.orgRole?.name === 'Level 1';
  // updateFieldsProps(fieldIndexesToUpdate, 'hide', !isCurrentUserLevel1);

  formKey.value++;
}

const { mutateAsync: userOptionalUpdate, isLoading: updatingUser }
  = useMutation(
    'user-optional-update',
    async (payload: UserOptionalUpdatePayload) => {
      return useUserOptionalUpdateDetails(
        userId.value,
        payload,
        isPortalUser.value
      );
    }
  );

const { mutateAsync: userDisable } = useMutation(async (id: string) => {
  return useUserDisable({ id });
});
const { mutateAsync: userDelete } = useMutation(async (id: string) => {
  return useUserRemove(id as string);
});
const { mutateAsync: userEnable } = useMutation(async (id: string) => {
  return useUserEnable(id);
});

async function handleUpdate(values: Record<string, any>) {
  const payload = {
    ...values,
    zipcode: values.zipcode ? `${values.zipcode}` : null,
    email: userDetails?.value?.email as string,
    orgUserRoleId: userDetails?.value?.orgUserRoleId as string,
    designationId: userDetails?.value?.designationId as string,
    salary: values.salary ? `${values.salary}` : ''
  } as UserOptionalUpdatePayload;
  if (values.picture) {
    payload.picture = (values.picture as Attachment).id as string;
  }
  await userOptionalUpdate(payload);
  queryClient.invalidateQueries('user-details');
  showToast();
}
function HandleActivation(status: string) {
  if (status === 'Activate') {
    userEnable(userId.value as string);
  }
  else {
    userDisable(userId.value as string);
  }
}
function handleDelete() {
  userDelete(userId.value as string);
}

onMounted(() => {
  handleFormFields();
  useTimeoutFn(() => {
    // formKey.value += 1;
    focusAndBlurInput(
      formRef as unknown as Ref<SchemaFormRef>,
      'notes',
      'textarea'
    );
  }, 400);
});

watchEffect(() => {
  if (formValues.value) {
    country.value = (formValues.value as User)?.country as string;
  }
  if (formRef.value?.schemaFormValues?.country) {
    // formRef.value?.validateField('mobile');
    formRef.value?.validateField('zipcode');
  }
});

watch(
  currentUser,
  () => {
    handleFormFields();
  },
  {
    immediate: true
  }
);
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :key="formKey"
    :data="formData"
    :disable-submit="!canDoActions"
    :disabled-tooltip="disabledTooltip"
    :primary-btn-loading="updatingUser"
    @submit="handleUpdate"
    @dropdown-change="handleDropdownChange"
  >
    <!-- <template #state>
      <div :class="'field mb-0'">
        <label for="state" :class="'block font-medium text-900'"> State </label>
        <VField name="state" v-slot="{ handleChange, value, validate }">
          <Dropdown
            :tabindex="0"
            @update:model-value="handleChange"
            @blur="validate()"
            class="w-full"
            name="state"
            id="state"
            :model-value="value"
            :options="statesList"
            :optionLabel="'name'"
            :optionValue="'id'"
            :filter="true"
            placeholder="State"
          />
        </VField>
      </div>
    </template> -->
    <template #notes>
      <div class="font-medium underline text-lg mb-3">
        Notes
      </div>
      <Common426 v-if="featureSubscribed('team', 'notes') === false" feature="notes" />
      <CommonComments
        v-else
        resource-type="TEAM_MEMBER"
        :resource-id="userId"
      />
    </template>
  </CommonSchemaForm>
  <CommonConfirmRemoveDialog
    v-if="confirmStatusDialog"
    :visible="confirmStatusDialog"
    :title="`Confirm ${activeStatus} User`"
    @confirm="HandleActivation(activeStatus)"
    @hide="confirmStatusDialog = false"
  >
    Are you sure you want to {{ activeStatus }} the team member?
  </CommonConfirmRemoveDialog>
  <CommonConfirmRemoveDialog
    v-if="confirmDeleteDialog"
    :visible="confirmDeleteDialog"
    title="Confirm Delete User"
    @confirm="handleDelete"
    @hide="confirmDeleteDialog = false"
  >
    Are you sure you want to delete the team member?
  </CommonConfirmRemoveDialog>
</template>

<style scoped>
:deep(.p-inputtextarea) {
  height: 131px !important;
}
</style>
