<script setup lang="ts">
import type { Inbox, Thread } from '@/types/inbox.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import { useQuery } from 'vue-query';
import { string } from 'yup';

const props = defineProps<{
  inbox: Inbox;
  thread: Thread;
}>();

const emit = defineEmits<{
  (e: 'addAgent', agent: { uid: string }, detachableAgent?: string): void;
}>();

const formRef = ref<SchemaFormRef>();
const selectedAgent = ref<string>();

const { getUsers } = useCommonListQueries();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const { data: users, isLoading } = getUsers(true, true, initialFilters);
const instance = getCurrentInstance();

const inboxAgents = computed(() => {
  return users.value?.filter(user => props.inbox.agentId.includes(user.id));
});

const { isLoading: gettingThead, data: thread } = useQuery(
  ['thread-details', props.thread.id],
  () => useThread(props.inbox.id, props.thread.id),
  {
    onSuccess: async (data) => {
      setTimeout(() => {
        if (data.inboxData?.assignedAgents?.length) {
          formRef.value?.setFieldValue(
            'uid',
            data.inboxData?.assignedAgents[0].id
          );
          selectedAgent.value = data.inboxData?.assignedAgents[0].id;
        }
      }, 500);
      await nextTick(() => {
        instance?.proxy?.$forceUpdate();
      });
    }
  }
);

const formData = computed(() => {
  return {
    fields: [
      {
        type: 'dropdown',
        name: 'uid',
        label: 'Agent',
        required: true,
        options: inboxAgents.value,
        optionLabel: 'name',
        optionValue: 'id',
        loading: isLoading.value,
        placeholder: 'Select Agent'
      }
    ],
    btnText: `${props.thread.agentId ? 'Reassign' : 'Add'} Agent`,

    validationSchema: {
      uid: string().nullable().required('Agent is required')
    }
  };
});

function onSubmit(data: any) {
  if (!data.uid)
    return;
  if (selectedAgent.value && data.uid !== selectedAgent.value) {
    emit('addAgent', data, selectedAgent.value);
  }
  else emit('addAgent', data);
}
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData as unknown as SchemaForm"
    @submit="onSubmit"
  />
</template>

<style lang="scss" scoped></style>
