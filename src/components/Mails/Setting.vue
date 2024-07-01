<script setup lang="ts">
import type { Inbox, InboxCreatePayload } from '@/types/inbox.type';
import { array, string } from 'yup';
import InputText from 'primevue/inputtext';
import type { APIActions } from '@/types/common.type';
import { useMutation, useQueryClient } from 'vue-query';

const props = defineProps<{
  inbox: Inbox;
}>();

const emit = defineEmits(['success', 'cancel']);

const { getUsers } = useCommonListQueries();
const { initToast } = useToasts();
const { arrDiff } = useUtilityFns();
const queryClient = useQueryClient();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);

const { data: users, isLoading: loadingAgents } = getUsers(
  true,
  true,
  initialFilters
);

const inboxAgents = computed(() => {
  return users.value;
});

function inboxAgentsFn() {
  return computed(() => {
    return users.value;
  });
}

const { handleSubmit, errors, values, meta } = useForm({
  validationSchema: {
    agentId: array().of(string()).min(1).required().label('Agents is required'),
    forwardEmail: string().label('Forward Email'),
    fromEmail: string().label('From Email')
  },
  initialValues: {
    agentId: props.inbox?.agentId,
    forwardEmail: props.inbox?.forwardingEmail,
    fromEmail: (props.inbox?.fromEmail[0] as string) || ''
  }
});

const { value: agentId } = useField<string[]>('agentId');
const { value: forwardEmail } = useField<string>('forwardEmail');
const { value: fromEmail } = useField<string>('fromEmail');

const { text, copy, copied, isSupported } = useClipboard({
  source: forwardEmail || fromEmail
});

function showToast(actionType: APIActions) {
  initToast({
    actionType,
    summary: `Update Inbox`,
    detail: `Inbox Configurations Updated Successfully`
  });
}

const onSubmit = handleSubmit(async (values: Partial<InboxCreatePayload>) => {
  const payload = {
    ...values,
    fromEmail: values.fromEmail ? values.fromEmail : undefined
  };

  await updateInbox(payload);
  showToast('Update');
  queryClient.invalidateQueries('inboxes');
  emit('success');
});
const { mutateAsync: updateInbox, isLoading: updatingInbox } = useMutation(
  (values: Partial<InboxCreatePayload>) => {
    return useInboxUpdate(props?.inbox.id, { ...values });
  }
);
</script>

<template>
  <div class="p-4">
    <div class="font-medium underline text-xl pb-3">
      Mailbox Configuration
    </div>
    <!-- <CommonSchemaForm :data="formData" @submit="onSubmit" /> -->
    <form class="text-left" @submit.prevent="onSubmit">
      <div class="field">
        <label for="agentId" class="block font-medium text-900">
          Agents
          <span class="text-red-600">*</span>
        </label>
        <CommonMultiSelector
          v-model="agentId"
          :max-selected-labels="3"
          placeholder="Select Agents"
          :selected-items-label="`${agentId.length} Agent(s) selected`"
          :query-fn="inboxAgentsFn as unknown as () => any[]"
          query-key="users-list"
          class="w-full"
        />
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            success-class="font-medium"
            :errors="errors"
            :feedback="false"
            :values="values"
            error-key="agentId"
          />
        </transition>
      </div>
      <div class="field">
        <label for="forwardEmail" class="block font-medium text-900">
          Forward Email
        </label>
        <div class="p-inputgroup flex-1">
          <InputText
            id="forwardEmail"
            v-model="forwardEmail"
            disabled
            class="w-full"
            :class="{ 'p-invalid': errors.forwardEmail }"
          />
          <Button
            v-tooltip.top="
              `${copied ? 'Copied Forward Email' : 'Copy Forward Email'}`
            "
            icon="pi pi-copy"
            @click="copy(forwardEmail)"
          />
        </div>
      </div>
      <div class="field">
        <label for="fromEmail" class="block font-medium text-900">
          From Email ID
        </label>
        <div class="p-inputgroup flex-1">
          <InputText
            id="fromEmail"
            v-model="fromEmail"
            :disabled="!!inbox.fromEmail[0]"
            class="w-full"
            :class="{ 'p-invalid': errors.fromEmail }"
          />
          <Button
            v-tooltip.top="
              `${copied ? 'Copied  From Email' : 'Copy From Email'}`
            "
            icon="pi pi-copy"
            @click="copy(fromEmail)"
          />
        </div>
      </div>
      <div class="flex justify-content-between">
        <Button
          label="Cancel"
          :disabled="!meta.valid"
          class="my-4 p-button-danger"
          @click="emit('cancel')"
        />
        <Button
          label="Submit"
          :disabled="!meta.valid"
          :loading="updatingInbox"
          type="submit"
          class="my-4"
        />
      </div>
    </form>
    <div class="mt-4">
      <h5>
        To set up email forwarding and begin managing your emails in BrightDesk,
        please follow the instructions below:
      </h5>
      <h6 class="text-md">
        <strong>Step1:</strong> Click on the "Settings" button located in
        BrightDesk's Mailbox to copy the forwarding email address.
      </h6>

      <h6 class="text-md">
        <strong>Step2:</strong> Configure your email inbox to forward emails to
        the email address you copied from BrightDesk's Mailbox.
      </h6>

      <h6 class="text-md">
        <strong>Step3:</strong> Compose and send an email to the email address
        that you have set up for forwarding to BrightDesk's Mailbox.
      </h6>

      <h6 class="text-md">
        <strong>Step4:</strong> Check the Mailbox in BrightDesk to view the
        newly forwarded email.
      </h6>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
