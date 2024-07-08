<script setup lang="ts">
import type { Client, ClientStatesPayload } from '@/types/client.type';
import { ClientStatesBulkPayloadSchema } from '@/types/client.type';
import { Field as VField } from 'vee-validate';
import type { Ref } from 'vue';
import { useMutation, useQueryClient } from 'vue-query';
import type { InferType } from 'yup';

export type StatesBulkPayload = InferType<typeof ClientStatesBulkPayloadSchema>;

const disabledTooltip = inject('disabledTooltip');
const canDoActions = inject('canDoActions');
const clientDetails = inject('clientDetails') as Ref<Client>;

const { initToast } = useToasts();
const { getCountriesList, getStatesList } = useCommonListQueries();
const queryClient = useQueryClient();
const { handleTooltip } = useTooltip();

const { data: countriesList, isFetching: fetchingCountries }
  = getCountriesList();
const country = ref('USA');
const enabled = computed(() => !!country.value);
const { data: statesList, isFetching: fetchingStates } = getStatesList(
  country,
  enabled,
  'states-list'
);

const { mutateAsync: createBulkStates, isLoading: createIsLoading }
  = useMutation(
    ({
      clientId,
      payload
    }: {
      clientId: string;
      payload: ClientStatesPayload;
    }) => {
      return useCreateClientStates(clientId, payload);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('client-states-list');
        initToast({
          actionType: 'Add',
          summary: 'Client States',
          detail: `Client States added successfully.`
        });
      }
    }
  );

const { handleSubmit, meta } = useForm({
  validationSchema: ClientStatesBulkPayloadSchema,
  initialValues: { country: 'USA' },
  initialTouched: { country: true },
  validateOnMount: false
});
const onSubmit = handleSubmit((values: Record<string, unknown>) => {
  createBulkStates({
    clientId: clientDetails?.value.id,
    payload: { stateIds: values.stateIds as string[] }
  });
});
</script>

<template>
  <form class="grid formgrid md:w-8 xl:w-6 mx-auto" @submit="onSubmit">
    <div class="col-12 md:col-6 py-2">
      <div class="field mb-0">
        <label for="country" class="block font-medium text-900">
          Country <span class="text-red-600">*</span>
        </label>
        <VField v-slot="{ handleChange, value, validate }" name="country">
          <Dropdown
            id="state"
            :tabindex="0"
            class="w-full"
            name="state"
            :model-value="value"
            :options="countriesList"
            option-label="country"
            option-value="country"
            :filter="true"
            placeholder="Select Country"
            :loading="fetchingCountries"
            @update:model-value="handleChange"
            @blur="validate()"
            @change="(e: { value: string }) => (country = e.value)"
          />
        </VField>
      </div>
    </div>
    <div class="col-12 md:col-6 py-2">
      <div class="field mb-0">
        <label for="stateIds" class="block font-medium text-900">
          States <span class="text-red-600">*</span>
        </label>
        <VField v-slot="{ handleChange, value, validate }" name="stateIds">
          <MultiSelect
            id="state"
            :tabindex="0"
            class="w-full"
            name="state"
            :model-value="value"
            :options="statesList"
            option-label="name"
            option-value="id"
            :filter="true"
            placeholder="Select States"
            :loading="fetchingStates"
            @update:model-value="handleChange"
            @blur="validate()"
          />
        </VField>
      </div>
    </div>
    <div class="col-12 text-right">
      <span
        v-tooltip.top="
          handleTooltip(!!canDoActions, '', disabledTooltip as string)
        "
        class="inline-block ml-auto"
      >
        <Button
          class="font-medium ml-auto mt-1 block"
          :disabled="!meta.valid || !canDoActions"
          type="submit"
          label="Submit"
          :loading="createIsLoading"
        />
      </span>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
