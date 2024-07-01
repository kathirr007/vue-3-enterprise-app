<script setup lang="ts">
import { useMutation, useQueryClient } from 'vue-query';
import type { Client } from '@/types/client.type';
import { Field as VField } from 'vee-validate';
import type {
  ContactAddClientsPayload,
  UserContact,
  UserContactClient
} from '@/types/contacts.type';
import { contactAddClientsSchema } from '@/types/contacts.type';

const props = defineProps<{
  contactDetails?: UserContact;
  loading?: boolean;
  addClient?: boolean;
  hideSkip?: boolean;
}>();

const emit = defineEmits<{
  (e: 'modal-close'): void;
  (e: 'back', step: 'clientForm'): void;
  (e: 'skip', step: 'clientForm'): void;
  (e: 'client-form', value: ContactAddClientsPayload, id?: string): void;
  (e: 'client-form-remove', value: ContactAddClientsPayload): void;
}>();
const route = useRoute();
const queryClient = useQueryClient();
const { attachClients, detachClients } = useContacts();
const { getClients } = useCommonListQueries();
const { initToast } = useToasts();
const { data: clientData, isLoading: loadingClients } = getClients();

const contactId = ref<string>(route.params.id as string);
const clientsToRemove = ref<string[]>([]);
const clientsNotAdded = computed(() => {
  const existingClients = props.contactDetails?.userClients?.map(
    (client: UserContactClient) =>
      (client as unknown as UserContactClient).client.id
  );
  if (clientData.value) {
    return clientData.value.filter(
      (client: Client) =>
        client.isActive && !existingClients?.includes(client.id)
    );
  }
  return [];
});

const { errors, values, meta, handleSubmit } = useForm({
  validationSchema: contactAddClientsSchema,
  validateOnMount: false
});

const { mutateAsync: attachContactClients, isLoading: attachingClients }
  = useMutation(
    (payload: ContactAddClientsPayload) => {
      return attachClients(
        (props.contactDetails?.id || contactId.value) as string,
        payload as ContactAddClientsPayload
      );
    },
    {
      onSuccess: (data: ContactAddClientsPayload) => {
        initToast({
          actionType: 'Add',
          summary: `Attach ${$tConfig('CLIENT')}s`,
          detail: `Total ${values.clientIds.length} ${
            values.clientIds.length > 1 ? `${$tConfig('CLIENT').toLowerCase()}s are` : `${$tConfig('CLIENT').toLowerCase()} is`
          } added successfully.`
        });
        queryClient.invalidateQueries('contact-details');
        emit('client-form', data);
        emit('modal-close');
      }
    }
  );

/* const { mutateAsync: detachClients, isLoading: detachingClients } = useMutation(
  (payload: ContactAddClientsPayload) => {
    return detachClient(
      (props.contactDetails?.id || contactId.value) as string,
      payload as ContactAddClientsPayload
    );
  },
  {
    onSuccess: (data: ContactAddClientsPayload) => {
      queryClient.invalidateQueries('contact-details');
      emit('client-form-remove', data);
    },
  }
); */

const onSubmit = handleSubmit(async (formValues: any) => {
  const payload: ContactAddClientsPayload = {
    ...formValues
  } as unknown as ContactAddClientsPayload;
  /* clientsToRemove.value = props.contactDetails?.userClients
    ?.filter(
      (client: UserContactClient) =>
        !(payload as ContactAddClientsPayload).clients.includes(client.id)
    )
    .map((client: UserContactClient) => client.id) as string[];
  if (clientsToRemove.value && clientsToRemove.value.length) {
    detachClients({
      clients: clientsToRemove.value,
    });
    const clientArray1 = props.contactDetails?.userClients?.map(
      (val: any) => val.id
    ) as string[];
    const clientArray2 = formValues.clients;
    const clients = clientArray2.filter(
      (item: any) => !clientArray1.includes(item)
    );

    emit('client-form', { clients: clients });
  } else {
    emit('client-form', payload);
  } */
  // emit('client-form', payload);
  await attachContactClients(payload);
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <form class="grid formgrid" @submit.stop="onSubmit">
    <div class="col-12 py-2">
      <div class="field mb-0">
        <label for="clients" class="block font-medium text-900">
          <span>{{ `${$tConfig('CLIENT')}s` }}</span>
          <span class="text-red-600">*</span>
        </label>
        <div class="w-full">
          <CommonLoading v-if="loadingClients" />
          <VField
            v-else
            v-slot="{ handleChange, value, validate }"
            name="clientIds"
          >
            <MultiSelect
              id="clients"
              :tabindex="0"
              class="w-full"
              name="clients"
              :model-value="value"
              :options="[...(clientsNotAdded as Client[])]"
              option-label="name"
              option-value="id"
              :placeholder="`Select ${$tConfig('CLIENT')}`"
              :show-clear="true"
              :loading="loadingClients"
              :virtual-scroller-options="{ itemSize: 30 }"
              filter
              @update:model-value="handleChange"
              @blur="validate()"
            />
          </VField>
        </div>
      </div>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :errors="errors"
          :values="values"
          error-key="clientIds"
          :feedback="false"
        />
      </transition>
    </div>
    <div class="flex w-full justify-content-between mt-3 ml-auto col-12">
      <Button
        v-if="addClient"
        class="max-w-max mr-auto p-button-text"
        label="Back"
        icon="pi pi-chevron-left"
        @click="emit('back', 'clientForm')"
      />
      <div class="ml-auto space-x-2.5">
        <Button
          v-if="!hideSkip"
          label="Skip"
          @click="emit('skip', 'clientForm')"
        />
        <Button
          label="Submit"
          type="submit"
          :loading="attachingClients"
          :disabled="!meta.valid"
        />
      </div>
    </div>
  </form>
</template>
