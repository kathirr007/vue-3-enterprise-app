<script setup lang="ts">
import type {
  ClientBillingProfile,
  CreateProfileClientPayload,
} from '@/types/client-billing.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

import { CreateProfileClientSchema } from '@/types/client-billing.type';
import type { Client } from '@/types/client.type';
import { Field as VField } from 'vee-validate';

const route = useRoute();

const clientsToRemove = ref<string[]>([]);

const queryClient = useQueryClient();
const { detachClient } = useClientBilling();

const { getClients } = useCommonListQueries();
const clientBillingId = ref<string>(route.params.id as string);

const { data: clientData, isLoading: loadingClients } = getClients();

const props = defineProps<{
  billingDetail?: ClientBillingProfile;
  apiKey?: number;
  loading?: boolean;
  revisit?: boolean;
  addClient?: boolean;
}>();

const { errors, values, meta, handleSubmit } = useForm({
  validationSchema: CreateProfileClientSchema,
  initialValues: {
    clients: props.billingDetail
      ? props.billingDetail?.map((client: Client) => client.id)
      : undefined,
  },
  validateOnMount: false,
});

const emit = defineEmits<{
  (e: 'emitStep', step: string): void;
  (e: 'back', step: 'clientForm'): void;
  (e: 'skip', step: 'clientForm'): void;
  (e: 'client-form', value: CreateProfileClientPayload, id?: string): void;
  (e: 'client-form-remove', value: CreateProfileClientPayload): void;
}>();

const { mutateAsync: detachClientsBilling } = useMutation(
  (payload: CreateProfileClientPayload) => {
    return detachClient(
      clientBillingId.value as string,
      payload as CreateProfileClientPayload
    );
  },
  {
    onSuccess: (data: CreateProfileClientPayload) => {
      queryClient.invalidateQueries('client-profile-details');
      queryClient.invalidateQueries('clients-details-list');

      emit('client-form-remove', data);
    },
  }
);

const onSubmit = handleSubmit((formValues: any) => {
  const payload: CreateProfileClientPayload = {
    ...formValues,
  } as unknown as CreateProfileClientPayload;
  clientsToRemove.value = props.billingDetail
    ?.filter(
      (client: Client) =>
        !(payload as CreateProfileClientPayload).clients.includes(client.id)
    )
    .map((client: Client) => client.id) as string[];
  if (clientsToRemove.value && clientsToRemove.value.length) {
    detachClientsBilling({
      clients: clientsToRemove.value,
    });
    const clientArry1 = props.billingDetail?.map((val: any) => val.id);
    const clientArray2 = formValues.clients;
    const clients = clientArray2.filter(
      (item: any) => !clientArry1.includes(item)
    );

    emit('client-form', { clients: clients });
  } else {
    emit('client-form', payload);
  }
});
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <form class="grid formgrid" @submit.stop="onSubmit">
    <div class="col-12 py-2">
      <div class="field mb-0">
        <label for="clients" class="block font-medium text-900">
          <span>Clients</span>
        </label>
        <div class="w-full">
          <CommonLoading v-if="loadingClients" />
          <VField
            v-else
            name="clients"
            v-slot="{ handleChange, value, validate }"
          >
            <MultiSelect
              :tabindex="0"
              @update:model-value="handleChange"
              @blur="validate()"
              class="w-full"
              name="clients"
              id="clients"
              :model-value="value"
              :options="clientData"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Client"
              :show-clear="true"
              :loading="loadingClients"
              :virtualScrollerOptions="{ itemSize: 30 }"
              filter
            >
            </MultiSelect>
          </VField>
        </div>
      </div>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :errors="errors"
          :values="values"
          errorKey="clients"
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
          v-if="route.name?.toString().includes('revisit')"
          label="Skip"
          @click="emit('skip', 'clientForm')"
        />
        <Button
          :label="'Submit'"
          type="submit"
          :loading="loading"
          :disabled="!meta.valid"
        />
      </div>
    </div>
  </form>
</template>
