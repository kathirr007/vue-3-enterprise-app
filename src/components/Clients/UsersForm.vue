<script setup lang="ts">
import { type FieldEntry, Field as VField } from 'vee-validate';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { InferType } from 'yup';
import { useRouteQuery } from '@vueuse/router';
import { useRoute } from 'vue-router';
import InputText from 'primevue/inputtext';
import type { Client, ClientUser, CommonUser } from '@/types/client.type';
import { CreateUserPayloadSchema } from '@/types/client.type';
import type { Ref } from 'vue';
import Divider from 'primevue/divider';
import type { APIActions, MetaObj } from '@/types/common.type';
import type { FullNameObj, User } from '@/types/teams.type';
import type { ContactAddClientsPayload } from '@/types/contacts.type';

export type CreateUserPayloadType = InferType<typeof CreateUserPayloadSchema>;
type EmptyRecord = CommonUser & { error?: string };

const disabledTooltip = inject('disabledTooltip');
const canDoActions = inject('canDoActions');
const clientDetails = inject<any>('clientDetails', () => null);
const loadingClientDetails = inject<any>('loadingClientDetails', false);
const fetchingClientDetails = inject<any>('fetchingClientDetails', false);

const queryClient = useQueryClient();
const isBusinessEntityIndividual = ref(false);
const isClientCommunicationDirect = ref(false);
const showIsClientCommunicationDirect = ref(true);
const authorizedUsers = ref<CommonUser[]>([]);
const resendVerificationEmail = ref('');
const showAuthUserDisableDialog = ref(false);
const showClientUserActionDialog = ref(false);
const removeClientUserDialog = ref(false);
const selectedAuthUser = ref<CommonUser | null>(null);
const selectedUser = ref<CommonUser | null>(null);
const clientUserAction = ref<'disable' | 'enable' | 'auth-user' | 'remove'>();
const instance = getCurrentInstance();

const { fullName } = useVueFilters();
const { currentUser } = useCurrentUserData();
const { canDo, canAccessAllMenu } = usePermissions();
const isDetailsRoute = useRoute().name === 'admin-clients-id';
const { isMedium } = useCommonBreakPoints();
const { showToast } = useToasts();
let clientId = useRouteQuery<string>('clientId');
const route = useRoute();
if (isDetailsRoute) {
  clientId = ref(route.params.id as string);
}
const { handleTooltip } = useTooltip();
const { initToast } = useToasts();
const { resendVerificationLink } = useAuthVerify();
const { detachClients } = useContacts();

const tableCellStyles = { 'min-width': '15rem' };
const tableActionStyles = { 'min-width': '11rem' };
const emptyRecord = reactive<EmptyRecord>({
  firstName: '',
  email: '',
  mobile: '',
  country: clientDetails.value.country,
  error: ''
});

const BooleanOptions = [
  { name: 'Yes', value: true, radioLabel: 'Yes' },
  { name: 'No', value: false, radioLabel: 'No' }
];

const {
  values: userValues,
  errors: userErrors,
  validateField,
  setValues,
  meta,
  validate,
  setTouched,
  setFieldTouched
} = useForm({
  validationSchema: CreateUserPayloadSchema,
  initialValues: {
    users: [{ ...emptyRecord }]
  },
  validateOnMount: false
});
const { remove, push: usePush, fields: userFields } = useFieldArray('users');
setValues({ users: [{ ...emptyRecord }] });
setFieldTouched('users', true);

const { mutateAsync: createClientUser, isLoading: createIsLoading }
  = useMutation(
    ({ clientId, payload }: { clientId: string; payload: CommonUser }) => {
      return useClientUserCreate({ clientId, payload });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('client-details');
      }
    }
  );
const { mutateAsync: editClientUser } = useMutation(
  ({
    clientId,
    payload,
    id
  }: {
    clientId: string;
    payload: CommonUser;
    id: string;
  }) => {
    return useClientUserUpdate({ clientId, id, payload });
  },
  {
    onSuccess: () => {
      queryClient.invalidateQueries('client-details');
    }
  }
);
const { mutateAsync: disableClientUser, isLoading: disablingClientUser }
  = useMutation(
    ({
      clientId,
      payload,
      id
    }: {
      clientId: string;
      payload?: { newUserId: string };
      id: string;
    }) => {
      return useClientUserDisable({ clientId, id, payload });
    },
    {
      onSuccess: () => {
        handleToast(
          selectedAuthUser.value || (selectedUser.value as CommonUser),
          'Disable'
        );
        selectedAuthUser.value = null;
        queryClient.invalidateQueries('client-details');
      }
    }
  );
const { mutateAsync: enableClientUser, isLoading: enablingClientUser }
  = useMutation(
    ({ clientId, id }: { clientId: string; id: string }) => {
      return useClientUserEnable({ clientId, id });
    },
    {
      onSuccess: () => {
        handleToast(selectedUser.value as CommonUser, 'Enable');
        queryClient.invalidateQueries('client-details');
      }
    }
  );
const { mutateAsync: makeClientUserAsAuth, isLoading: makingAuthUser }
  = useMutation(
    ({ clientId, id }: { clientId: string; id: string }) => {
      return useMakeClientUserAsAuth({ clientId, id });
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Update',
          summary: 'Update Authorized User',
          detail: `<strong>${fullName(
            selectedUser.value as FullNameObj
          )}</strong> made as authorized successfully`
        });
        queryClient.invalidateQueries('client-details');
      }
    }
  );
const { mutateAsync: resendVerification, isLoading: sendingLink } = useMutation(
  (payload: { email: string }) => resendVerificationLink(payload),
  {
    onMutate: (variables) => {
      resendVerificationEmail.value = variables.email;
    },
    onSuccess: (data) => {
      initToast({
        actionType: 'Update',
        summary: 'Resend Verification Link',
        detail: `Verification link has been sent to <strong>${resendVerificationEmail.value}</strong> successfully`
      });
      resendVerificationEmail.value = '';
    }
  }
);
const { mutateAsync: removeClientUser, isLoading: removingClientUser }
  = useMutation(
    ['detach-clients'],
    ({ id, payload }: { id: string; payload: ContactAddClientsPayload }) =>
      detachClients({ id, payload }),
    {
      onSuccess: (data: any) => {
        if (data) {
          handleToast(selectedUser.value as CommonUser, 'Remove');
          selectedUser.value = null;
        }
        queryClient.invalidateQueries('client-details');
      }
    }
  );

async function handleCreateEdit(idx: string) {
  const fields = ['firstName', 'email', 'mobile'];
  let validateCount = 0;
  for (let i = 0; i < fields.length; i++) {
    const field = `users[${idx}].${fields[i]}`;
    const { valid } = await validateField(field as 'users');
    if (valid) {
      validateCount++;
    }
  }
  if (validateCount !== fields.length)
    return;

  if (validateCount === fields.length) {
    const payload = {
      ...userValues.users[+idx],
      mobile: `${userValues.users[+idx].mobile}`
    };
    const ClientUserData: CommonUser = await CreateEditUser(payload as unknown as CommonUser);
    if (ClientUserData) {
      userValues.users[+idx].value = { ...ClientUserData } as CommonUser;
      showToast({
        severity: 'success',
        summary: `Create ${$tConfig('CLIENT')} User`,
        detail: 'User created successfully'
      });
    }
  }
}
function removeFieldError(field: Ref<EmptyRecord>): void {
  if (!field.value.error)
    return;
  field.value.error = '';
}
async function CreateEditUser(payload: CommonUser) {
  // if(payload.id){
  //   const reponse =
  // }
  let response;
  if (payload.id) {
    response = await editClientUser({
      clientId: clientId.value as string,
      payload,
      id: payload.id
    });
  }
  response = await createClientUser({
    clientId: clientId.value as string,
    payload: payload as CommonUser
  });
  if (response) {
    const user = {
      ...response.user,
      isActive: response.isActive,
      isOwner: response.isOwner
    };
    user.meta.forEach((meta: MetaObj) => {
      user[meta.metaKey] = meta.metaValue;
    });
    return user;
  }
  return null;
}

const { data } = useQuery<Client>(
  'client-details',
  async () => {
    return useClientDetails(clientId.value);
  },
  {
    onSuccess: (data: Client) => {
      if (data) {
        if (data.businessEntity) {
          const businessEntity = data.businessEntity;
          if (businessEntity.name.toUpperCase() === 'INDIVIDUAL') {
            isBusinessEntityIndividual.value = true;
          }
        }
        const users: ClientUser[] = data?.clientUsers as ClientUser[];
        if (users && users.length > 0) {
          const userFields: EmptyRecord[] = [];
          const authUserFields: EmptyRecord[] = [];
          users.forEach((clientuser: ClientUser) => {
            const returnObj: { [key: string]: unknown } = {
              ...(clientuser.user as object),
              isActive: clientuser.isActive
            };
            const meta = clientuser?.user?.meta as MetaObj[];
            meta.forEach((metaObj: MetaObj) => {
              returnObj[metaObj.metaKey] = metaObj.metaValue;
            });
            if (!clientuser.isOwner) {
              userFields.push(returnObj as EmptyRecord);
            }
            else {
              authUserFields.push(returnObj as EmptyRecord);
            }
          });
          if (userFields.length > 0) {
            setValues({ users: userFields });
          }
          authorizedUsers.value = authUserFields;
        }
        else {
          authorizedUsers.value = [];
          setValues({ users: [{ ...emptyRecord }] });
        }
      }
    }
  }
);

async function HandleAuthUserSubmit(payload: CommonUser) {
  const authClientUserData: CommonUser = await CreateEditUser({
    ...payload,
    mobile: `${payload.mobile}`,
    isOwner: true
  });
  if (authClientUserData) {
    authorizedUsers.value = [{ ...authClientUserData }];
    showToast({
      severity: 'success',
      summary: 'Create Authorized User',
      detail: 'Authorized User created successfully'
    });
  }
}

function handleAuthUserAction(data: {
  action: 'enable' | 'disable' | 'remove';
  value: CommonUser;
}) {
  selectedUser.value = data.value;
  selectedAuthUser.value = data.value;
  clientUserAction.value = data.action;
  data.action === 'disable'
    ? (showAuthUserDisableDialog.value = true)
    : (showClientUserActionDialog.value = true);
}

function prepareForDisableAuthUser(value: string) {
  const selectedId = clientDetails.value?.clientUsers?.find(
    (user: ClientUser) => user.user.id === selectedAuthUser.value?.id
  )?.id;
  const newUserId = clientDetails.value?.clientUsers?.find(
    (user: ClientUser) => user.user.id === value
  )?.id;
  disableClientUser({
    clientId: clientId.value as string,
    id: selectedId as string,
    payload: { newUserId }
  });
  showAuthUserDisableDialog.value = false;
}

function handleActions(idx: number,
  field: CommonUser,
  makeAuthUser = false,
  removeClientUser = false) {
  if (!field.id) {
    remove(idx);
    return;
  }
  selectedUser.value = field;
  if (makeAuthUser) {
    clientUserAction.value = 'auth-user';
  }
  else
    clientUserAction.value = removeClientUser
      ? 'remove'
      : field.isActive
        ? 'disable'
        : 'enable';
  showClientUserActionDialog.value = true;
}

async function prepareForClientUserAction() {
  const selectedId = clientDetails.value?.clientUsers?.find(
    (user: ClientUser) => user.user.id === selectedUser.value?.id
  )?.id;

  switch (clientUserAction.value) {
    case 'auth-user':
      await makeClientUserAsAuth({
        clientId: clientId.value as string,
        id: selectedId as string
      });
      break;
    case 'disable':
      await disableClientUser({
        clientId: clientId.value as string,
        id: selectedId as string
      });
      break;
    case 'enable':
      await enableClientUser({
        clientId: clientId.value as string,
        id: selectedId as string
      });
      break;
    case 'remove':
      await removeClientUser({
        id: selectedUser.value?.id as string,
        payload: { clientIds: [clientDetails.value?.id as string] }
      });
      break;

    default:
      break;
  }

  showClientUserActionDialog.value = false;
  selectedUser.value = null;
  clientUserAction.value = undefined;
}

const actionDialogDetails = computed(() => {
  if (
    (selectedUser.value || selectedAuthUser.value)
    && clientUserAction.value
  ) {
    switch (clientUserAction.value) {
      case 'auth-user':
        return {
          title: 'Make Authorized User',
          message: `Are you sure you want to make <strong>${fullName(
            selectedUser.value as User
          )}</strong> as authorized user?`
        };
      case 'enable':
      case 'disable':
        return {
          title: `Confirm ${
            clientUserAction.value === 'disable' ? 'Disable' : 'Enable'
          } User`,
          message: `Are you sure you want to ${
            clientUserAction.value
          } <strong>${fullName(selectedUser.value as User)}</strong>?`
        };
      case 'remove':
        return {
          title: `Confirm ${'Remove'} User`,
          message: `Are you sure you want to ${
            clientUserAction.value
          } <strong>${fullName(selectedUser.value as User)}</strong>?`
        };

      default:
        return {
          title: '',
          message: ''
        };
    }
  }
  return {
    title: '',
    message: ''
  };
});

function handleToast(data: CommonUser, type: APIActions) {
  if (data) {
    initToast({
      actionType: type,
      summary: `${type} User`,
      detail: `<strong>${fullName(data)}</strong> ${type}d successfully`
    });
  }
}

watchEffect(() => {
  /* if (clientDetails.value) {
    if (clientDetails.value?.businessEntity) {
      const businessEntity = clientDetails.value?.businessEntity;
      if (businessEntity.name.toUpperCase() === 'INDIVIDUAL') {
        isBusinessEntityIndividual.value = true;
      }
    }
    const users: ClientUser[] = clientDetails.value?.clientUsers as ClientUser[];
    if (users && users.length > 0) {
      const userFields: EmptyRecord[] = [];
      const authUserFields: EmptyRecord[] = [];
      users.forEach((clientuser: ClientUser) => {
        const returnObj: { [key: string]: unknown } = {
          ...(clientuser.user as object),
          isActive: clientuser.isActive
        };
        const meta = clientuser?.user?.meta as MetaObj[];
        meta.forEach((metaObj: MetaObj) => {
          returnObj[metaObj.metaKey] = metaObj.metaValue;
        });
        if (!clientuser.isOwner) {
          userFields.push(returnObj as EmptyRecord);
        }
        else {
          authUserFields.push(returnObj as EmptyRecord);
        }
      });
      if (userFields.length > 0) {
        setValues({ users: userFields });
      }
      authorizedUsers.value = authUserFields;
    }
    else {
      authorizedUsers.value = [];
      setValues({ users: [{ ...emptyRecord }] });
    }
  } */
});

/* onMounted(() => {
  useTimeoutFn(() => {
    validate({ mode: 'validated-only' });
  }, 600);
}); */
</script>

<template>
  <div class="grid formgrid p-fluid">
    <div class="col-12">
      <FormTitle :title="`Add ${$tConfig('CLIENT')}'s Authorized Person`" font-size="text-lg" />
      <CommonLoading v-if="loadingClientDetails || fetchingClientDetails" />
      <ClientsAddAuthUserForm
        v-else
        :auth-users="authorizedUsers"
        :is-creating-user="createIsLoading"
        :is-loading="
          enablingClientUser || disablingClientUser || removingClientUser
        "
        :removing-client-user="removingClientUser"
        @auth-user-submit="HandleAuthUserSubmit"
        @auth-user-disable="handleAuthUserAction"
        @auth-user-enable="handleAuthUserAction"
        @auth-user-remove="handleAuthUserAction"
      />
    </div>

    <Divider />
    <form class="col-12">
      <FormTitle :title="`${$tConfig('CLIENT')} Users`" />
      <CommonLoading v-if="loadingClientDetails || fetchingClientDetails" />
      <div v-else class="col-12">
        <div class="p-datatable p-component p-datatable-responsive-scroll">
          <div class="p-datatable-wrapper overflow-x-auto">
            <table
              class="bulk-create-table p-datatable-table w-full"
              role="table"
              cellspacing="0"
              cellpadding="0"
            >
              <thead class="bg-gray-50 p-datatable-thead" role="rowgroup">
                <tr>
                  <th role="cell" :style="tableCellStyles">
                    Name <span class="text-red-500">*</span>
                  </th>
                  <th role="cell" :style="tableCellStyles">
                    Email <span class="text-red-500">*</span>
                  </th>
                  <th role="cell" :style="tableCellStyles">
                    Mobile <span class="text-red-500">*</span>
                  </th>
                  <th role="cell" :style="tableActionStyles">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="p-datatable-tbody relative" role="rowgroup">
                <tr
                  v-for="(field, idx) in userFields"
                  :key="field.key"
                  role="row"
                  class="relative"
                  :class="[
                    {
                      'border-red-400 border-2': (
                        field.value as unknown as EmptyRecord
                      ).error,
                    },
                  ]"
                >
                  <td
                    role="cell"
                    valign="top"
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error
                          && isMedium,
                      },
                    ]"
                  >
                    <label
                      :for="`name_${idx}`"
                      class="mb-2"
                      :class="isMedium ? 'hidden' : 'block'"
                    >First Name</label>
                    <VField
                      :id="`name_${idx}`"
                      :name="`users[${idx}].firstName`"
                      class="w-full"
                      :as="InputText"
                      :disabled="(field.value as unknown as CommonUser).id"
                      placeholder="Name"
                      @input="
                        removeFieldError(field as unknown as Ref<EmptyRecord>)
                      "
                    />
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="userErrors"
                        :values="userValues"
                        :error-key="`users[${idx}].firstName`"
                      />
                    </transition>
                    <div
                      v-if="(field.value as unknown as EmptyRecord).error"
                      class="p-error api-error"
                    >
                      {{ (field.value as unknown as EmptyRecord).error }}
                    </div>
                  </td>
                  <td
                    role="cell"
                    valign="top"
                    :style="tableCellStyles"
                    :class="[
                      {
                        'pb-4':
                          (field.value as unknown as EmptyRecord).error
                          && isMedium,
                      },
                    ]"
                  >
                    <label
                      :for="`name_${idx}`"
                      class="mb-2"
                      :class="isMedium ? 'hidden' : 'block'"
                    >Email</label>
                    <VField
                      :id="`name_${idx}`"
                      :name="`users[${idx}].email`"
                      class="w-full"
                      :as="InputText"
                      :disabled="(field.value as unknown as CommonUser).id"
                      placeholder="Email"
                      @input="
                        removeFieldError(field as unknown as Ref<EmptyRecord>)
                      "
                    />
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="userErrors"
                        :values="userValues"
                        :error-key="`users[${idx}].email`"
                      />
                    </transition>
                    <div
                      v-if="(field.value as unknown as EmptyRecord).error"
                      class="p-error api-error"
                    >
                      {{ (field.value as unknown as EmptyRecord).error }}
                    </div>
                  </td>
                  <td role="cell" valign="top" :style="tableCellStyles">
                    <label
                      :for="`mobile_${idx}`"
                      class="mb-2"
                      :class="isMedium ? 'hidden' : 'block'"
                    >Mobile</label>
                    <VField
                      :id="`mobile_${idx}`"
                      :name="`users[${idx}].mobile`"
                      class="w-full"
                      :as="InputText"
                      :disabled="(field.value as unknown as CommonUser).id"
                      placeholder="Mobile"
                      @input="
                        removeFieldError(field as unknown as Ref<EmptyRecord>)
                      "
                    />
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="userErrors"
                        :values="userValues"
                        :error-key="`users[${idx}].mobile`"
                      />
                    </transition>
                  </td>
                  <td
                    role="cell"
                    valign="top"
                    :style="tableActionStyles"
                    class="text-right md:text-left"
                  >
                    <div class="flex flex-wrap gap-2">
                      <!-- {{ field }} -->
                      <span
                        v-if="
                          (field.value as unknown as EmptyRecord).id
                            && !(field.value as unknown as User).isVerified
                        "
                        v-tooltip.top="
                          `${
                            !canDoActions
                              ? disabledTooltip
                              : 'Resend verification link'
                          }`
                        "
                        class="inline-block"
                        style="height: 2.357rem;"
                      >
                        <Button
                          v-if="canDo('clients', 'create')"
                          :disabled="
                            !canDoActions
                              || sendingLink
                              || !(field.value as unknown as User).isActive
                          "
                          type="button"
                          icon="pi"
                          class="p-button-sm p-button-rounded p-button"
                          aria-label="resend-verification-link"
                          :loading="sendingLink"
                          @click="
                            resendVerification({
                              email: `${
                                (field.value as unknown as User).email
                              }`,
                            })
                          "
                        >
                          <i
                            v-if="
                              sendingLink
                                && resendVerificationEmail
                                  === (field.value as unknown as User).email
                            "
                            class="pi pi-spin pi-spinner"
                          />
                          <Icon
                            v-else
                            class="flex-none text-base"
                            icon="fa6-solid:share-from-square"
                          />
                        </Button>
                      </span>
                      <span
                        v-if="!(field.value as unknown as EmptyRecord).id"
                        v-tooltip.top="
                          `${!canDoActions ? disabledTooltip : meta.valid ? `Add ${$tConfig('CLIENT')} user` : ''}`
                        "
                        class="inline-block"
                        style="height: 2.357rem;"
                      >
                        <Button
                          v-if="canDo('clients', 'create')"
                          :disabled="!canDoActions || !meta.valid"
                          type="button"
                          icon="pi pi-check"
                          aria-label="delete-record"
                          class="p-button-sm p-button-rounded"
                          @click="handleCreateEdit(idx.toString())"
                        >
                          <i
                            v-if="createIsLoading"
                            class="pi pi-spin pi-spinner"
                          />
                        </Button>
                      </span>
                      <span
                        v-if="(field.value as unknown as EmptyRecord).id && idx === userFields.length - 1"
                        v-tooltip.top="
                          `${!canDoActions ? disabledTooltip : meta.valid ? 'Add new row' : ''}`
                        "
                        class="inline-block"
                        style="height: 2.357rem;"
                      >
                        <Button
                          v-if="
                            (canAccessAllMenu
                              || clientDetails?.relationshipManager.id
                                === currentUser.id)
                          "
                          :disabled="!canDoActions || !meta.valid"
                          icon="pi pi-plus"
                          aria-label="add-record"
                          class="p-button-sm p-button-rounded p-button-primary"
                          @click="usePush(emptyRecord); validate({ mode: 'silent' })"
                        />
                      </span>
                      <span
                        v-if="
                          (field.value as unknown as EmptyRecord).id
                            || userFields.length > 1
                        "
                        v-tooltip.top="
                          `${!canDoActions ? disabledTooltip : ''}`
                        "
                        class="inline-block"
                        style="height: 2.357rem;"
                      >
                        <Button
                          v-if="canDo('clients', 'delete')"
                          v-tooltip="
                            `${
                              !(field.value as unknown as EmptyRecord).id
                                ? 'Delete row'
                                : (field.value as CommonUser)?.isActive
                                  ? 'Disable'
                                  : 'Enable'
                            }`
                          "
                          type="button"
                          :icon="`pi ${
                            !(field.value as unknown as EmptyRecord).id
                              ? 'pi-trash'
                              : (field.value as CommonUser)?.isActive
                                ? 'pi-ban'
                                : 'pi pi-check-circle'
                          }`"
                          :aria-label="`${
                            !(field.value as unknown as EmptyRecord).id
                              ? 'Delete'
                              : (field.value as CommonUser)?.isActive
                                ? 'Disable'
                                : 'Enable'
                          } record`"
                          class="p-button-sm p-button-rounded"
                          :class="{
                            'p-button-danger':
                              (field.value as CommonUser)?.isActive
                              || !(field.value as CommonUser)?.id,
                            'p-button-success':
                              (field.value as CommonUser)?.id
                              && !(field.value as CommonUser)?.isActive,
                          }"
                          :disabled="!canDoActions"
                          @click="handleActions(idx, field.value as CommonUser)"
                        >
                          <i
                            v-if="
                              (enablingClientUser || disablingClientUser)
                                && selectedUser?.id
                                  === (field.value as unknown as EmptyRecord).id
                            "
                            class="pi pi-spin pi-spinner"
                          />
                        </Button>
                      </span>
                      <span
                        v-if="(field.value as unknown as EmptyRecord).id"
                        v-tooltip.top="
                          `${
                            !canDoActions
                              ? disabledTooltip
                              : 'Make As Authorized Person'
                          }`
                        "
                        class="inline-block"
                        style="height: 2.357rem;"
                      >
                        <Button
                          v-if="canDo('clients', 'edit')"
                          :disabled="
                            !canDoActions
                              || makingAuthUser
                              || !(field.value as unknown as User).isActive
                          "
                          type="button"
                          icon="pi"
                          class="p-button-sm p-button-rounded p-button"
                          aria-label="make as authorized person"
                          :loading="makingAuthUser"
                          @click="
                            handleActions(idx, field.value as CommonUser, true)
                          "
                        >
                          <i
                            v-if="
                              makingAuthUser
                                && selectedUser?.id
                                  === (field.value as unknown as EmptyRecord).id
                            "
                            class="pi pi-spin pi-spinner"
                          />
                          <Icon
                            v-else
                            class="flex-none text-lg"
                            icon="mdi:user-check"
                          />
                        </Button>
                      </span>
                      <span
                        v-if="(field.value as unknown as EmptyRecord).id"
                        v-tooltip.top="
                          `${!canDoActions ? disabledTooltip : ''}`
                        "
                        class="inline-block"
                        style="height: 2.357rem;"
                      >
                        <Button
                          v-tooltip.top="`Remove ${$tConfig('CLIENT')} User`"
                          type="button"
                          :disabled="!canDoActions"
                          icon="pi pi-trash"
                          aria-label="remove-record"
                          class="p-button-sm p-button-rounded p-button-danger"
                          @click="
                            handleActions(
                              idx,
                              field.value as CommonUser,
                              false,
                              true,
                            )
                          "
                        >
                          <i
                            v-if="
                              removingClientUser
                                && selectedUser?.id
                                  === (field.value as unknown as EmptyRecord).id
                            "
                            class="pi pi-spin pi-spinner"
                          />
                        </Button>
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </form>
  </div>
  <Dialog
    v-model:visible="showAuthUserDisableDialog"
    :modal="true"
    :dismissable-mask="true"
    :style="{ width: '50vw' }"
    header="Confirm Disable Authorized User"
  >
    <ClientsDisableAuthUserForm
      :selected-auth-user="(selectedAuthUser as CommonUser)"
      :client-users="(userFields as FieldEntry<CommonUser>[])"
      @cancel="showAuthUserDisableDialog = false"
      @submit="prepareForDisableAuthUser"
    />
  </Dialog>

  <CommonConfirmRemoveDialog
    v-if="showClientUserActionDialog"
    :visible="showClientUserActionDialog"
    :modal="true"
    :style="{ width: '40vw' }"
    :header="actionDialogDetails?.title"
    @hide="showClientUserActionDialog = false"
    @confirm="prepareForClientUserAction"
  >
    <div v-html="actionDialogDetails?.message" />
  </CommonConfirmRemoveDialog>
</template>
