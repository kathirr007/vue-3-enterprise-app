<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import InputText from 'primevue/inputtext';
import type { CommonUser } from '@/types/client.type';
import { CreateAuthUserPayloadSchema } from '@/types/client.type';
import type { Ref } from 'vue';
import { useMutation, useQueryClient } from 'vue-query';
import type { User } from '@/types/teams.type';
import type { ContactAddClientsPayload } from '@/types/contacts.type';

const props = defineProps<{
  authUsers: CommonUser[];
  isCreatingUser?: boolean;
  isLoading?: boolean;
  removingClientUser?: boolean;
}>();

const emits = defineEmits<{
  (e: 'auth-user-submit', value: CommonUser): void;
  (
    e: 'auth-user-disable',
    value: { action: 'disable'; value: CommonUser }
  ): void;
  (e: 'auth-user-remove', value: { action: 'remove'; value: CommonUser }): void;
  (e: 'auth-user-enable', value: { action: 'enable'; value: CommonUser }): void;
}>();

type EmptyRecord = CommonUser & { error?: string };

const disabledTooltip = inject('disabledTooltip');
const canDoActions = inject('canDoActions');
const clientDetails = inject<any>('clientDetails', () => null);
const loadingClientDetails = inject<boolean>('loadingClientDetails', false);
const fetchingClientDetails = inject<boolean>('fetchingClientDetails', false);

const { isMedium } = useCommonBreakPoints();
const { initToast } = useToasts();
const { resendVerificationLink } = useAuthVerify();
const { canDo, canAccessAllMenu } = usePermissions();
const { fullName } = useVueFilters();
const { detachClients } = useContacts();
const resendVerificationEmail = ref('');
const removeClientUserDialog = ref(false);
const selectedClientUserToRemove = ref();
const queryClient = useQueryClient();

const tableCellStyles = { 'min-width': '15rem' };
const tableActionStyles = { 'min-width': '8rem' };

const emptyRecord: EmptyRecord = {
  firstName: '',
  email: '',
  mobile: '',
  country: clientDetails.value?.country,
  error: ''
};

const {
  values: AuthUserValues,
  errors: AuthUserErrors,
  validate,
  setValues,
  meta
} = useForm({
  validationSchema: CreateAuthUserPayloadSchema,
  validateOnMount: false,
  initialValues: {
    authUser: [{ ...emptyRecord }]
  }
});

const { fields: authUserFields, remove, push } = useFieldArray('authUser');

function addEmptyRecord() {
  push(emptyRecord);
  // setValues({ authUser: [{ ...emptyRecord }] });
}

function removeFieldError(field: Ref<EmptyRecord>): void {
  if (!field.value.error)
    return;
  field.value.error = '';
}

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

const { mutateAsync: removeContactClient, isLoading: removingClient }
  = useMutation(
    ['detach-clients'],
    ({ id, payload }: { id: string; payload: ContactAddClientsPayload }) =>
      detachClients({ id, payload }),
    {
      onSuccess: (data: any) => {
        if (data) {
          initToast({
            actionType: 'Remove',
            severity: 'error',
            summary: `Remove ${$tConfig('CLIENT')} User`,
            detail: `${$tConfig('CLIENT')} user <strong>${selectedClientUserToRemove.value?.name}</strong> removed from <strong>${clientDetails.value?.name}</strong>`
          });
          selectedClientUserToRemove.value = undefined;
        }
        queryClient.invalidateQueries('client-details');
      }
    }
  );

async function onSubmit() {
  const { valid } = await validate();
  if (valid) {
    const payload = AuthUserValues.authUser[0];
    if (payload.error) {
      delete payload.error;
    }
    emits('auth-user-submit', AuthUserValues.authUser[0]);
  }
}

async function handleResendVerification(field: any) {
  await resendVerification({
    email: `${(field.value as unknown as User).email}`
  });
}

function handleActions(action: 'enable' | 'disable' | 'remove',
  field: CommonUser) {
  switch (action) {
    case 'enable':
      emits(`auth-user-enable`, {
        action: 'enable',
        value: field as CommonUser
      });
      break;
    case 'disable':
      emits(`auth-user-disable`, {
        action: 'disable',
        value: field as CommonUser
      });
      break;
    case 'remove':
      emits(`auth-user-remove`, {
        action: 'remove',
        value: field as CommonUser
      });
      break;

    default:
      break;
  }
}

watchEffect(() => {
  if (props.authUsers && props.authUsers.length > 0) {
    setValues({ authUser: props.authUsers });
  }
});
</script>

<template>
  <form class="col-12" @submit.prevent="onSubmit">
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
            <template v-for="(field, idx) in authUserFields">
              <tr
                v-if="authUserFields.length > 0"
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
                    :name="`authUser[${idx}].firstName`"
                    class="w-full"
                    :as="InputText"
                    :disabled="(field.value as unknown as EmptyRecord).id"
                    placeholder="Name"
                    @input="
                      removeFieldError(field as unknown as Ref<EmptyRecord>)
                    "
                  />
                  <transition mode="out-in" name="field-slide-down">
                    <FormFeedbackMessage
                      :errors="AuthUserErrors"
                      :values="AuthUserValues"
                      :error-key="`authUser[${idx}].firstName`"
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
                    :name="`authUser[${idx}].email`"
                    class="w-full"
                    :as="InputText"
                    :disabled="(field.value as unknown as EmptyRecord).id"
                    placeholder="Email"
                    @input="
                      removeFieldError(field as unknown as Ref<EmptyRecord>)
                    "
                  />
                  <transition mode="out-in" name="field-slide-down">
                    <FormFeedbackMessage
                      :errors="AuthUserErrors"
                      :values="AuthUserValues"
                      :error-key="`authUser[${idx}].email`"
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
                  >mobile</label>
                  <VField
                    :id="`mobile_${idx}`"
                    :name="`authUser[${idx}].mobile`"
                    class="w-full"
                    :as="InputText"
                    :disabled="(field.value as unknown as EmptyRecord).id"
                    placeholder="Mobile"
                    @input="
                      removeFieldError(field as unknown as Ref<EmptyRecord>)
                    "
                  />
                  <transition mode="out-in" name="field-slide-down">
                    <FormFeedbackMessage
                      :errors="AuthUserErrors"
                      :values="AuthUserValues"
                      :error-key="`authUser[${idx}].mobile`"
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
                    >
                      <Button
                        :disabled="!canDoActions || sendingLink"
                        type="button"
                        icon="pi"
                        class="p-button-sm p-button-rounded p-button"
                        aria-label="delete-record"
                        :loading="sendingLink"
                        @click="handleResendVerification(field)"
                      >
                        <i v-if="sendingLink" class="pi pi-spin pi-spinner" />
                        <Icon
                          v-else
                          icon="fa6-solid:share-from-square"
                          class="flex-none text-base"
                        />
                      </Button>
                    </span>
                    <span
                      v-if="!(field.value as unknown as EmptyRecord).id"
                      v-tooltip.top="`${!canDoActions ? disabledTooltip : meta.valid ? 'Add Auth User' : ''}`"
                      class="inline-block"
                      style="height: 2.357rem;"
                    >
                      <Button
                        type="submit"
                        :disabled="
                          !canDoActions
                            || (field.value as unknown as EmptyRecord).id
                              !== undefined
                            || !meta.valid
                        "
                        :icon="
                          (field.value as unknown as EmptyRecord).id
                            ? 'pi pi-user-edit'
                            : 'pi pi-check'
                        "
                        aria-label="add-record"
                        class="p-button-sm p-button-rounded p-button-primary"
                        @click="() => {}"
                      >
                        <i
                          v-if="isCreatingUser"
                          class="pi pi-spin pi-spinner"
                        />
                      </Button>
                    </span>
                    <span
                      v-if="
                        canDo('clients', 'delete')
                          && (field.value as unknown as EmptyRecord).id
                      "
                      v-tooltip.top="`${!canDoActions ? disabledTooltip : ''}`"
                      class="inline-block"
                      style="height: 2.357rem;"
                    >
                      <!-- <Button
                        v-if="canDo('clients', 'delete')"
                        type="button"
                        icon="pi pi-ban"
                        aria-label="disable-record"
                        class="p-button-sm p-button-rounded p-button-danger"
                        @click="
                          emits('auth-user-disable', field.value as CommonUser)
                        "
                        :disabled="!canDoActions"
                      /> -->
                      <Button
                        v-tooltip="
                          `${
                            (field.value as CommonUser)?.isActive
                              ? 'Disable'
                              : 'Enable'
                          }`
                        "
                        type="button"
                        :icon="`pi ${
                          (field.value as CommonUser)?.isActive
                            ? 'pi-ban'
                            : 'pi pi-check-circle'
                        }`"
                        :aria-label="`${
                          (field.value as CommonUser)?.isActive
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
                        @click="
                          handleActions(
                            `${
                              (field.value as CommonUser)?.isActive
                                ? 'disable'
                                : 'enable'
                            }`,
                            field.value as CommonUser,
                          )
                        "
                      >
                        <i v-if="isLoading" class="pi pi-spin pi-spinner" />
                      </Button>
                    </span>
                    <span
                      v-if="(field.value as unknown as EmptyRecord).id"
                      v-tooltip.top="`${!canDoActions ? disabledTooltip : ''}`"
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
                          handleActions('remove', field.value as CommonUser)
                        "
                      >
                        <i
                          v-if="removingClientUser"
                          class="pi pi-spin pi-spinner"
                        />
                      </Button>
                    </span>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="authUserFields.length === 0">
              <td
                role="cell"
                valign="top"
                :style="tableActionStyles"
                class="text-center"
                colspan="4"
              >
                <span
                  v-tooltip.top="`${!canDoActions ? disabledTooltip : ''}`"
                  class="inline-block"
                >
                  <Button
                    :disable="!canDoActions"
                    type="button"
                    icon="pi pi-plus"
                    aria-label="add-record"
                    class="p-button-sm p-button-rounded ml-2"
                    @click="addEmptyRecord"
                  />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
