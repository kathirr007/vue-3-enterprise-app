<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import type {
  Contact,
  Conversation,
  ConversationActionType,
  ConversationCreatePayload,
  ThreadCreatePayload
} from '@/types/inbox.type';
import { ThreadCreatePayloadSchema } from '@/types/inbox.type';
import type {
  SchemaForm,
  SchemaFormRef
} from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import type { AutoCompleteCompleteEvent } from 'primevue/autocomplete';
import AutoComplete from 'primevue/autocomplete';
import type { EditorTextChangeEvent } from 'primevue/editor';
import Editor from 'primevue/editor';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import { useThreadCreate } from '@/composables/inbox';
import type { ComputedRef } from 'vue';
import type {
  AttachmentContentType,
  AttachmentExtension,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';
import type { UploadFilesPayload } from '@/types/common.type';

interface InboxContact extends Contact {
  name: string;
}

const props = withDefaults(
  defineProps<{
    inbox: any;
    creationTitle?: string;
    actionType?: ConversationActionType;
    conversation?: Conversation;
  }>(),
  {
    creationTitle: 'Create Thread'
  }
);

const emit = defineEmits(['success', 'cancel']);

const { initToast } = useToasts();
const { fullName } = useVueFilters();
const { createAttachment, fileSelected } = useAttachments();
const queryClient = useQueryClient();

const formRef = ref<SchemaFormRef>();
const contentDelta = ref();
const contacts = ref<InboxContact[]>();
const contactsSuggesstions = ref<InboxContact[]>();
const attachmentIds = ref<string[]>([]);

useQuery(['inbox-contacts'], () => useInboxContacts(), {
  onSuccess: (data: Contact[]) => {
    contacts.value = data.map(contact => ({
      ...contact,
      name: fullName(contact)
    })) as InboxContact[];
  }
});

const setInitialValues = computed(() => {
  return props.conversation
    ? {
        contact: {
          ...props.conversation.contact,
          name: fullName(props.conversation.contact)
        },
        content:
          props.actionType === 'forward' ? props.conversation.content : null
      }
    : undefined;
});

const formData = computed<SchemaForm>(() => {
  return {
    fields: [
      {
        as: AutoComplete,
        type: 'autocomplete',
        name: 'contact',
        label: 'To',
        required: true,
        showSlot: true
      },
      {
        as: InputText,
        name: 'subject',
        label: 'Subject',
        required: true,
        placeholder: 'Enter Subject'
      },
      {
        as: Editor,
        type: 'editor',
        name: 'content',
        label: 'Content',
        placeholder: 'Content',
        editorStyle: 'height: 160px'
      },
      {
        as: File,
        type: 'file',
        name: 'attachments',
        label: 'Attachments',
        maxFileSize: 5000000,
        multiple: true,
        accept:
          'image/jpeg, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        helpText: `Supported formats: jpeg, jpg, pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv.
      <br />Max size: 5MB.`,
        hide: props.actionType !== 'reply'
      }
    ],
    btnText: 'Submit',
    secondaryBtnText: 'Cancel',
    validationSchema: ThreadCreatePayloadSchema,
    initialValues: setInitialValues.value
  };
});

const { mutateAsync: createThread, isLoading: creatingThread } = useMutation(
  (values: ThreadCreatePayload) => {
    return useThreadCreate(values, props.inbox?.id);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Create',
        severity: 'success',
        summary: 'Success',
        detail: 'Thread Created Successfully'
      });
      queryClient.invalidateQueries('threads');
      emit('success');
    }
  }
);
const { mutateAsync: createConversation, isLoading: creatingConversation }
  = useMutation(
    (values: ConversationCreatePayload) => {
      return useConversationCreate(
        values,
        props.inbox?.id,
        props.conversation?.threadId as string
      );
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Create',
          severity: 'success',
          summary: 'Success',
          detail: `${
            props.actionType === 'reply'
              ? 'Reply Message Sent Successfully'
              : 'Message Forwarded Successfully'
          }`
        });
        queryClient.invalidateQueries('threads');
        emit('success');
      }
    }
  );

const { mutateAsync: uploadFile } = useMutation(
  async (data: { payload: CreateAttachment; file: UploadFilesPayload }) => {
    return createAttachment({
      payloadData: data,
      showToast: false,
      fileUploadRef: 'attachments-upload',
      schemaFormRef: formRef.value?.schemaFormRefs
    });
  },
  {
    onSuccess: (data: { res: AttachmentResponse; file: File }) => {
      attachmentIds?.value.push(data.res.id);
    }
  }
);

async function onSubmit(values: Record<string, any>) {
  const { subject, content, contact, ...rest }
    = values as unknown as ThreadCreatePayload;
  const payload = {
    ...rest,
    contact: { ...contact, uid: contact.uid },
    sourceId: props.inbox.fromEmail[0],
    title: subject,
    channel: 'EMAIL',
    status: 'OPEN',
    content: {
      content: content as unknown as string,
      delta: contentDelta.value
    }
  };

  if (props.actionType === 'reply') {
    await createConversation({
      payload: {
        ...payload,
        type: 'OUTGOING'
      }
    } as unknown as ConversationCreatePayload);
    attachmentIds.value = [];
    return;
  }

  await createThread(payload as unknown as ThreadCreatePayload);
}

function contactsSearch(event: AutoCompleteCompleteEvent,
  val?: InboxContact[]) {
  /*   const selectedContacts = (val && [...(val as InboxContact[])]) || [];
  contactsSuggesstions.value = contacts.value
    ?.filter((contact: InboxContact) =>
      contact.name.toLowerCase().includes(event.query)
    )
    .filter((contact: InboxContact) => {
      return !selectedContacts.some(
        (selectedContact: InboxContact) =>
          selectedContact.name.toLowerCase() === contact.name.toLowerCase()
      );
    }) as InboxContact[]; */
  // const selectedContacts = (val && [...(val as InboxContact[])]) || [];
  contactsSuggesstions.value = contacts.value?.filter((contact: InboxContact) =>
    contact.name.toLowerCase().includes(event.query.toLowerCase())
  ) as InboxContact[];
}

function handleEditorTextChange(val: EditorTextChangeEvent) {
  contentDelta.value = val.delta;
}

async function makeParallelAPIReq(payloadArr: File[]) {
  if (payloadArr.length === 0) {
    return;
  }
  await Promise.allSettled(
    payloadArr.map(async (item) => {
      fileSelected.value = item;
      const payload: CreateAttachment = {
        filename: item.name,
        contentType: item.type as unknown as AttachmentContentType,
        extension: item.name.split('.').pop() as unknown as AttachmentExtension,
        contentLength: item.size
      };
      await uploadFile({ payload, file: fileSelected.value });
    })
  );
}

async function uploadFiles(value: UploadFilesPayload) {
  await makeParallelAPIReq(
    Array.isArray(value.files) ? value.files : [value.files as File]
  );
  if (attachmentIds.value.length) {
    initToast({
      actionType: 'Add',
      summary: 'File Upload',
      detail: `Total <strong>${attachmentIds.value?.length}</strong> File${
        attachmentIds.value?.length > 1 ? 's' : ''
      } uploaded successfully`
    });
  }
}

watchEffect(async () => {
  if (attachmentIds.value) {
    formRef.value?.setValues({
      ...formRef.value.schemaFormValues,
      attachments: attachmentIds.value
    });
  }
});
</script>

<template>
  <div class="p-3">
    <div class="font-medium underline text-xl py-3">
      {{ creationTitle }}
    </div>
    <CommonSchemaForm
      ref="formRef"
      :data="formData"
      :primary-btn-loading="creatingThread || creatingConversation"
      @submit="onSubmit"
      @editor-text-change="handleEditorTextChange"
      @secondary-btn-click="$emit('cancel')"
      @file-upload="(() => uploadFiles)()"
    >
      <template #contact="{ ...attrs }">
        <div class="field mb-0">
          <label class="block font-medium text-900" for="contact">{{ attrs.label }}
            <span v-if="attrs.required" class="text-red-600">*</span></label>
          <VField v-slot="{ handleChange, value, validate }" name="contact">
            <AutoComplete
              :tabindex="0"
              class="w-full p-fluid"
              :model-value="value"
              v-bind="attrs"
              complete-on-focus
              option-label="name"
              empty-search-message="Nothing found"
              :suggestions="contactsSuggesstions"
              @update:model-value="handleChange"
              @blur="validate()"
              @complete="contactsSearch($event, value as InboxContact[])"
            />
          </VField>
          <transition mode="out-in" name="field-slide-down">
            <FormFeedbackMessage
              :errors="(attrs.errors as ComputedRef).value"
              :values="(attrs.values as ComputedRef).value"
              error-key="contact"
              :feedback="true"
            />
          </transition>
        </div>
      </template>
    </CommonSchemaForm>
  </div>
</template>

<style lang="scss" scoped>
:deep(.p-autocomplete) {
  &.w-full {
    .p-inputtext {
      width: 100%;
    }
  }
}
</style>
