<script setup lang="ts">
import type { Conversation, MailsAttachmentResponse } from '@/types/inbox.type';
import type { FullNameObj } from '@/types/teams.type';
import { useMutation } from 'vue-query';

const props = defineProps<{
  messages: Conversation[];
  clientId?: string;
}>();

const { fullName, relativeTime, initials } = useVueFilters();
const { getAttachmentUrl, createSavePayload, saveAttachment, downloadFileAs }
  = useAttachments();
const { isPortalUser } = useCurrentUserData();
const { defaultBreakpoints } = useCommonBreakPoints();
const { initToast } = useToasts();

const chatContainer = ref<HTMLElement>();
const isCopyDialog = ref(false);
const selectedAttachment = ref<MailsAttachmentResponse>();

const selectedClientId = ref<string | undefined>(props.clientId);

const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);

const { getClients } = useCommonListQueries();

const { data: clientList, isLoading: fetchingClients } = getClients(
  !isPortalUser.value,
  initialFilters
);

watchEffect(() => {
  if (props.messages) {
    setTimeout(() => {
      if (chatContainer.value)
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }, 300);
  }
});

function handleIconAction(attachment: MailsAttachmentResponse,
  name?: string) {
  if (name === 'save') {
    selectedAttachment.value = attachment;
    isCopyDialog.value = true;
    return;
  }

  downloadFileAs(getAttachmentUrl(attachment.path), attachment.name);
}

const { mutateAsync: save } = useMutation(
  async (id: string | null) => {
    const { payload } = await createSavePayload(
      selectedAttachment.value?.id as string,
      id,
      selectedAttachment.value
    );
    return await saveAttachment(selectedClientId.value as string, payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Add',
        summary: 'File Save',
        detail: `File <strong>${selectedAttachment.value?.name}</strong> saved successfully`
      });
      selectedAttachment.value = undefined;
      isCopyDialog.value = false;
    }
  }
);
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div ref="chatContainer" class="custom-chat overflow-y-auto">
    <div class="chat">
      <div class="chat-content p-3">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="chat-message"
          :class="
            message.type === `${isPortalUser ? 'INCOMING' : 'OUTGOING'}`
              ? 'send'
              : ''
          "
        >
          <div class="flex flex-column md:flex-row align-items-end mb-2">
            <div class="flex align-items-center">
              <Avatar
                v-if="message.contact"
                class="bg-primary mr-2"
                size="normal"
                shape="circle"
              >
                <img
                  v-if="message.contact?.picture"
                  class="text-sm"
                  :src="getAttachmentUrl(message.contact?.picture)"
                  style="vertical-align: middle;"
                  :alt="`${fullName(
                    message.contact as unknown as FullNameObj,
                  )}`"
                >
                <template v-else>
                  {{
                    initials(
                      fullName(
                        message.contact as unknown as FullNameObj,
                      ) as string,
                    )
                  }}
                </template>
              </Avatar>
              <div class="space-y-0.1 flex-1">
                <div>
                  <h1
                    v-if="message.contact"
                    class="text-base text-primary mb-0"
                  >
                    {{ fullName(message.contact) }}
                    <span class="relative-time">{{
                      relativeTime(message.createdAt)
                    }}</span>
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <div
            class="flex mb-2"
            :class="{
              'flex-row':
                message.type === `${isPortalUser ? 'INCOMING' : 'OUTGOING'}`,
            }"
          >
            <div class="message border-round-lg">
              <p v-html="message.content" />

              <div v-if="message.attachments?.length" class="custom-grid my-2">
                <MailsAttachmentPreview
                  v-for="item in message.attachments"
                  :key="item.id"
                  :attachment="item"
                  :icon="
                    isPortalUser
                      ? 'pi pi-download text-primary'
                      : [
                        {
                          name: 'download',
                          class: 'pi pi-download text-primary',
                          tooltip: 'Download',
                        },
                        {
                          name: 'save',
                          class: 'pi pi-save text-primary',
                          tooltip: 'Save',
                        },
                      ]
                  "
                  icon-tooltip="Download"
                  @icon-click="handleIconAction"
                />
              </div>
              <!-- <span class="relative-time">{{
                relativeTime(message.createdAt)
              }}</span> -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Dialog
    v-model:visible="isCopyDialog"
    :modal="true"
    append-to="body"
    header="Save Attachment"
    :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
    content-class="border-round-bottom-md"
    :style="{ width: '50vw' }"
    @hide="isCopyDialog = false"
  >
    <div class="field mb-2">
      <label class="block font-medium text-900">
        {{ `${$tConfig('CLIENT')}` }} <span class="text-red-600">*</span>
      </label>
      <Dropdown
        v-model="selectedClientId"
        :tabindex="0"
        name="client"
        :options="clientList"
        option-label="name"
        option-value="id"
        :filter="true"
        :placeholder="`Select ${$tConfig('CLIENT')}`"
        :loading="fetchingClients"
        :disabled="!!props.clientId"
      />
    </div>
    <ClientsDocumentMove
      v-if="selectedClientId"
      :source-id="[]"
      :client-id="selectedClientId"
      is-save
      @select="save"
      @cancel="isCopyDialog = false"
    />
  </Dialog>
</template>

<style lang="scss" scoped>
p {
  margin: 0;
}

.custom-grid {
  display: grid;
  grid-template-columns: 200px;
  grid-gap: 10px;
}
</style>
