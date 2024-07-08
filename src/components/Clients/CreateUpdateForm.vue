<script setup lang="ts">
import { ClientAddCollaboratorsSchema } from '@/types/client.type';
import type {
  Client,
  ClientAddCollaboratorsPayload,
  Collaborator
} from '@/types/client.type';
import type { SchemaForm } from '@/types/schemaform.type';
import type { User } from '@/types/teams.type';

import MultiSelect from 'primevue/multiselect';
import { useMutation } from 'vue-query';

const props = defineProps<{
  collaborators?: Collaborator[];
  client?: Client;
}>();
const emit = defineEmits<{
  (e: 'add-collaborators'): void;
  (e: 'remove-collaborators'): void;
  (e: 'success'): void;
}>();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const { usersListOptions, isLoading, isFetching } = useUserListOptions(
  true,
  initialFilters
);

const route = useRoute();
const clientId = ref(route.params.id as string);
const { arrDiff } = useUtilityFns();

const collaboratorsToRemove = ref<string[]>([]);
const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        as: MultiSelect,
        type: 'multiSelect',
        name: 'collaboratorIds',
        label: 'Working Team',
        placeholder: 'Select Team Members',
        optionLabel: 'name',
        optionValue: 'id',
        display: 'chip',
        loading: isLoading.value || isFetching.value,
        options:
          usersListOptions.value?.filter(
            (c: User) => c.id !== props.client?.relationshipManager?.id
          ) || []
      }
    ],
    validationSchema: ClientAddCollaboratorsSchema,
    initialValues: props?.collaborators
      ? {
          collaboratorIds: props?.collaborators
            ?.filter((c: Collaborator) => c.actingAs !== 'Relationship Manager')
            .map(c => c.id)
        }
      : [],
    btnText: 'Submit'
  } as SchemaForm;
});

const {
  mutateAsync: createUpdateCollaborators,
  isLoading: updatingCollaborators
} = useMutation(
  (payload: ClientAddCollaboratorsPayload & { clientId: string }) => {
    return attachCollaborators(payload);
  }
);

const { mutateAsync: removeCollaborators, isLoading: removingCollaborators }
  = useMutation(
    (payload: ClientAddCollaboratorsPayload & { clientId: string }) => {
      return detachCollaborators(payload);
    }
  );

async function onSubmit(values: Record<string, any>) {
  if (props.collaborators) {
    const prevCollaborators = props.collaborators
      .filter((item: Collaborator) => item.actingAs !== 'Relationship Manager')
      .map(client => client.id);
    collaboratorsToRemove.value = arrDiff(
      values.collaboratorIds,
      prevCollaborators
    );
    if (collaboratorsToRemove.value.length) {
      await removeCollaborators({
        clientId: clientId.value,
        collaboratorIds: collaboratorsToRemove.value
      });
    }
    await createUpdateCollaborators({
      clientId: clientId.value,
      collaboratorIds: (values as ClientAddCollaboratorsPayload)
        .collaboratorIds as string[]
    });
    emit('success');
  }
}
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :primary-btn-loading="updatingCollaborators || removingCollaborators"
    @submit="onSubmit"
  />
</template>
