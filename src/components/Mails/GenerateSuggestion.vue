<script setup lang="ts">
import type {
  Conversation,
  GenerateSuggestionPayload,
  GeneratedResponse,
  MailType,
  SuggestMessagePayload
} from '@/types/inbox.type';
import {
  AutoreplyTone,
  GenerateSuggestionPayloadSchema,
  Tone
} from '@/types/inbox.type';
import type { SchemaForm } from '@/types/schemaform.type';
import Dropdown from 'primevue/dropdown';
import { useMutation } from 'vue-query';

const props = defineProps<{
  message?: string;
  conversations?: Conversation[];
  type?: MailType;
  isAutoreply?: boolean;
}>();

const emit = defineEmits<{
  (e: 'success', data: GeneratedResponse[]): void;
  (e: 'modalClose'): void;
}>();

const { isRobotDialog, notValidData, showDialog } = useAiInfo();
const { isPortalUser } = useCurrentUserData();
const { getAutoreplySuggestions } = useBrightAssist();

const { mutateAsync: generateSuggestions, isLoading } = useMutation(
  (payload: GenerateSuggestionPayload) => {
    return useGenerateSuggestion(payload, isPortalUser.value);
  },
  {
    onSuccess: (data) => {
      emit('success', data);
      if (Array.isArray(data) && !data.length) {
        notValidData.value = true;
      }
    },
    onError: () => {
      notValidData.value = true;
    }
  }
);
const {
  mutateAsync: generateAutoReplySuggestions,
  isLoading: generatingAutoReply
} = useMutation(
  (payload: SuggestMessagePayload) => {
    return getAutoreplySuggestions(payload, isPortalUser.value);
  },
  {
    onSuccess: (data) => {
      emit('success', data);
      if (Array.isArray(data) && !data.length) {
        notValidData.value = true;
      }
    },
    onError: () => {
      notValidData.value = true;
    }
  }
);
async function onSubmit(values: Record<string, any>) {
  props.isAutoreply
    ? await generateAutoReplySuggestions({
      content_orientation: values.tone as Tone,
      thread: props.conversations as Conversation[]
    })
    : await generateSuggestions({
      tone: values.tone as Tone,
      message: props.message as string,
      type: props.type as MailType
    });
}
function handleCancel() {
  emit('modalClose');
}

const toneOptions = computed<{ name: string; value: Tone }[]>(() => {
  return Object.entries(props.isAutoreply ? AutoreplyTone : Tone).map(
    (entry) => {
      return {
        name: entry[0],
        value: entry[1]
      };
    }
  );
});

const formData: SchemaForm = {
  fields: [
    {
      as: Dropdown,
      type: 'dropdown',
      name: 'tone',
      label: 'Select Tone',
      required: true,
      autocomplete: 'off',
      options: toneOptions.value,
      optionLabel: 'name',
      optionValue: 'value',
      filter: false
    }
  ],
  validationSchema: GenerateSuggestionPayloadSchema,
  //   initialValues: undefined,
  btnText: 'Generate',
  secondaryBtnText: 'Cancel'
};

watchEffect(() => {
  isRobotDialog.value = isLoading.value || generatingAutoReply.value;
});
</script>

<template>
  <CommonSchemaForm
    :data="formData"
    :primary-btn-loading="isLoading || generatingAutoReply"
    @submit="onSubmit"
    @secondary-btn-click="handleCancel"
  />

  <Dialog
    v-model:visible="showDialog"
    modal
    append-to="body"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
    content-class="border-round-bottom-md"
  >
    <CommonAiInfo
      title="Hi I am BrightAssistant, your AI Team Member"
      :show-loading="isLoading || generatingAutoReply"
    >
      <template #content>
        <p class="font-medium text-base mt-2">
          {{
            notValidData
              ? 'Apologies, There was an error. It would be helpful if you could provide more information.'
              : `Please take a moment to relax while I work on rewriting your text for you.`
          }}
        </p>
      </template>
    </CommonAiInfo>
  </Dialog>
</template>
