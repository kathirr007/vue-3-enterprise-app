<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import { ContactCreatePayloadSchema } from '@/types/contacts.type';
import InputText from 'primevue/inputtext';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import { useRouteQuery } from '@vueuse/router';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import type { ContactCreatePayload, UserContact } from '@/types/contacts.type';
import type { FullNameObj } from '@/types/teams.type';
import type { Attachment } from '@/types/attachment.type';
import type { MetaObj } from '@/types/common.type';

const props = withDefaults(
  defineProps<{
    contactDetails?: UserContact;
  }>(),
  {}
);

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'add-details', data: UserContact): void;
  (e: 'modal-close'): void;
}>();

const queryClient = useQueryClient();
const { initToast } = useToasts();
const { fullName } = useVueFilters();
const { metaFilter } = useUtilityFns();
const { createOne, update } = useContacts();
const { currentUser } = useCurrentUserData();

const formKey = ref(0);
const helpText = ref<any>();
const clientsToRemove = ref<string[]>([]);
const formRef = ref<SchemaFormRef>();
const isCreateRoute = useRouteQuery<string>('create');
const activeStatus = ref();

const { data: filterDataClient, applyFilter: applyFilterClient }
  = useFilterColumns();
applyFilterClient('Is Active', 'true');
const clientFilters = useEncodeFilterData(filterDataClient);

const { data: clientList } = useQuery(['clients-list'], async () => {
  const clients = await useClientListV2({ filters: clientFilters });
  return clients.results;
});

const { mutateAsync: createUpdateContact, isLoading: createIsLoading }
  = useMutation(
    (payload: ContactCreatePayload) => {
      if (props.contactDetails) {
        return update(
          props.contactDetails.id,
          payload as Partial<ContactCreatePayload>
        );
      }
      return createOne(payload as ContactCreatePayload);
    },
    {
      onSuccess: (data) => {
        if (data) {
          initToast({
            actionType: props.contactDetails ? 'Update' : 'Create',
            title: `${$tConfig('CONTACT')}`,
            detail: `${$tConfig('CONTACT')} <strong>${fullName(
              data as unknown as FullNameObj
            )}</strong> ${activeStatus.value}d successfully`
          });
          queryClient.invalidateQueries('contact-details');
          emit('add-details', data);
          emit('modal-close');
        }
      }
    }
  );

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'firstName',
        label: 'First Name',
        required: true,
        autocomplete: 'off',
        formGridClass: 'md:col-6'
      },
      {
        as: InputText,
        name: 'lastName',
        label: 'Last Name',
        required: true,
        autocomplete: 'off',
        formGridClass: 'md:col-6'
      },
      {
        name: 'email',
        label: 'Email',
        as: InputText,
        placeholder: 'Enter Email ',
        formGridClass: 'md:col-6',
        required: true,
        disabled: props.contactDetails
      },
      {
        as: InputText,
        name: 'country',
        label: 'Country',
        hide: true
      },
      {
        as: InputText,
        name: 'mobile',
        label: 'Mobile',
        placeholder: 'Enter Mobile',
        formGridClass: 'md:col-6',
        required: true,
        helpText: 'Country code for mobile validation taken from organization settings.',
        showSlot: true
      }
    ],
    validationSchema: ContactCreatePayloadSchema,
    initialValues: props.contactDetails
      ? {
          ...props.contactDetails
        }
      : undefined,
    btnText: props.contactDetails ? 'Submit' : 'Next',
    secondaryBtnText: props.contactDetails ? '' : 'Back'
  } as SchemaForm;
});

async function onSubmit(values: Record<string, any>) {
  activeStatus.value = props.contactDetails ? 'Update' : 'Create';
  const payload: Partial<ContactCreatePayload> = { ...values };
  if (props.contactDetails?.picture) {
    payload.picture = (props.contactDetails?.picture as Attachment).id;
  }
  await createUpdateContact(payload as ContactCreatePayload);
}

function toggle(event: any) {
  helpText.value?.toggle(event);
}

watch(
  () => props.contactDetails,
  (val) => {
    if (val) {
      formRef.value?.setValues({
        ...val
      });
    }
  }
);

watchEffect(() => {
  if (currentUser.value) {
    formRef.value?.setFieldValue('country', metaFilter(currentUser.value?.org?.meta as MetaObj[], 'country'));
  }
});
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :key="formKey"
    :data="formData"
    :primary-btn-loading="createIsLoading"
    @submit="onSubmit"
    @secondary-btn-click="emit('back')"
  >
    <template #mobile="{ ...attrs }">
      <div class="field mb-0">
        <div class="flex mb-2">
          <label for="mobile" class="block font-medium text-900">
            {{ attrs.label }}
            <span v-if="attrs.required" class="text-red-500">*</span>
          </label>
          <i
            aria-label="toggle_overlay"
            class="pi pi-info-circle text-black ml-1 mt-1"
            aria-haspopup="true" aria-controls="overlay_panel"
            role="link"
            tabindex="0"
            @click="toggle"
            @mouseover="toggle"
            @keyup.enter="toggle"
          />

          <OverlayPanel ref="helpText">
            <div class="w-25rem">
              Country code for mobile validation taken from organization settings. It can be updated <router-link class="hover:underline text-primary font-medium" :to="{ name: 'settings' }">
                here.
              </router-link>
            </div>
          </OverlayPanel>
        </div>
        <VField v-slot="{ handleChange, value, validate }" name="mobile">
          <InputText
            id="mobile"
            input-id="mobile"
            :model-value="`${value || ''}`"
            class="w-full"
            v-bind="attrs"
            @update:model-value="handleChange"
            @blur="validate()"
          />
        </VField>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="(attrs.errors as ComputedRef).value"
            :values="(attrs.values as ComputedRef).value"
            error-key="mobile"
            :feedback="false"
          />
        </transition>
      </div>
    </template>
  </CommonSchemaForm>
</template>

<style lang="scss" scoped>
:deep(.p-inputgroup) {
  input:last-child {
    width: 55%;
    border-radius: 0 6px 6px 0;
  }
}
</style>
