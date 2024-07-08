<script setup lang="ts">
import type {
  ClientGroup,
  ClientGroupAddClientsPayload,
  ClientGroupCreatePayload
} from '@/types/client-group';
import {
  ClientGroupAddClientsSchema,
  ClientGroupCreatePayloadSchema
} from '@/types/client-group';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import MultiSelect from 'primevue/multiselect';
import type { Client } from '@/types/client.type';
import { useRouteQuery } from '@vueuse/router';

const props = withDefaults(
  defineProps<{
    clientGroup?: ClientGroup;
    addClients?: boolean;
  }>(),
  {
    addClients: false
  }
);

const emit = defineEmits<{
  (e: 'success', data: ClientGroup): void;
  (e: 'update', data: ClientGroup): void;
  (e: 'add-clients', data: ClientGroup): void;
  (e: 'remove-clients', data: ClientGroup): void;
}>();

const queryClient = useQueryClient();
const { addClients, removeClients, createOne, update } = useClientGroups();

const formKey = ref(0);
const clientsToRemove = ref<string[]>([]);
const formRef = ref<SchemaFormRef>();
const isCreateRoute = useRouteQuery<string>('create');

// const { data: clientList } = useQuery(['clients-list'], () => useClientList(), {
//   enabled: props.addClients,
// });
const { data: filterDataClient, applyFilter: applyFilterClient }
  = useFilterColumns();
applyFilterClient('Is Active', 'true');
const clientFilters = useEncodeFilterData(filterDataClient);

const { data: clientList } = useQuery(
  ['clients-list'],
  async () => {
    const clients = await useClientListV2({ filters: clientFilters });
    return clients.results;
  },
  { enabled: props.addClients }
);

const { mutateAsync: createUpdateClientGroup, isLoading: createIsLoading }
  = useMutation(
    (payload: ClientGroupCreatePayload | ClientGroupAddClientsPayload) => {
      if (props.clientGroup && !props.addClients) {
        return update(
          props.clientGroup.id,
          payload as Partial<ClientGroupCreatePayload>
        );
      }
      else if (props.addClients) {
        return addClients(
          props.clientGroup?.id as string,
          payload as ClientGroupAddClientsPayload
        );
      }
      return createOne(payload as ClientGroupCreatePayload);
    },
    {
      onSuccess: (data) => {
        if (props.clientGroup) {
          queryClient.invalidateQueries('client-group-details');
          props.addClients ? emit('add-clients', data) : emit('update', data);
        }
        else {
          emit('success', data);
        }
      }
    }
  );

const { mutateAsync: removeClientGroupClients, isLoading: removingClients }
  = useMutation(
    (payload: ClientGroupAddClientsPayload) => {
      return removeClients(
        props.clientGroup?.id as string,
        payload as ClientGroupAddClientsPayload
      );
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('client-group-details');
        emit('remove-clients', data);
      }
    }
  );

async function onSubmit(values: Record<string, any>) {
  if (props.addClients) {
    clientsToRemove.value = props.clientGroup?.clients
      ?.filter(
        (client: Client) =>
          !(values as ClientGroupAddClientsPayload).clients.includes(client.id)
      )
      .map((client: Client) => client.id) as string[];
    if (clientsToRemove.value.length) {
      await removeClientGroupClients({
        clients: clientsToRemove.value
      });
    }
    await createUpdateClientGroup({
      clients: (values as ClientGroupAddClientsPayload).clients as string[]
    });
  }
  else {
    await createUpdateClientGroup({
      name: (values as ClientGroupCreatePayload).name,
      description: (values as ClientGroupCreatePayload).description
    });
  }
}

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'name',
        label: 'Name',
        required: true,
        autocomplete: 'off',
        hide: props.addClients
      },
      {
        as: MultiSelect,
        type: 'multiSelect',
        name: 'clients',
        label: 'Clients',
        placeholder: 'Select clients',
        optionLabel: 'name',
        optionValue: 'id',
        display: 'chip',
        options: clientList.value || [],
        hide: !props.addClients
      },
      {
        as: Textarea,
        name: 'description',
        label: 'Description',
        rows: 4,
        hide: props.addClients
      }
    ],
    validationSchema: props.addClients
      ? ClientGroupAddClientsSchema
      : ClientGroupCreatePayloadSchema,
    initialValues: props.clientGroup
      ? {
          ...props.clientGroup,
          clients: props.clientGroup.clients?.map(
            (client: Client) => client.id
          )
        }
      : undefined,
    btnText: 'Submit'
  } as SchemaForm;
});

watch(
  () => props.clientGroup,
  (val) => {
    if (val) {
      formRef.value?.setValues({
        ...val,
        clients: val.clients?.map((client: Client) => client.id)
      });
    }
  }
);
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :key="formKey"
    :data="formData"
    :primary-btn-loading="createIsLoading || removingClients"
    @submit="onSubmit"
  />
</template>
