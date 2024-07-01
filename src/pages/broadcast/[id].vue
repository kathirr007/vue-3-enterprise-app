<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';
import { useQuery } from 'vue-query';

const {
  isInbox,
  uploadFileRef,
  fileSelected,
  attachmentRes,
  onUpload,
  createAttachment,
  getAttachment,
  downloadFileAs,
  getAttachmentUrl
} = useAttachments();

const route = useRoute();
const { formatFileSize, dateToHumanShort } = useVueFilters();
const broadcastMessageId = ref(route.params.id as string);
const isTemplate = useRouteQuery('isTemplate');
const userId = useRouteQuery('userId');
const email = useRouteQuery('email');

const {
  data: broadcastMessageDetails,
  isLoading: broadcastMesssageDetailsLoading
} = useQuery(['broadcast-message-details'], () => {
  return useBroadcastMessageDetails({
    broadcastMessageId: broadcastMessageId.value,
    isTemplate: isTemplate.value as string,
    userId: userId.value as string,
    email: email.value as string
  });
});

const { fileIcon } = useVueFilters();

function downloadFile(path: string, name: string) {
  downloadFileAs(getAttachmentUrl(path, true), name);
}
</script>

<template>
  <div class="content-wrapper flex flex-column align-items-center mx-auto">
    <div class="p-0 card justify-content-center w-full align-items-center">
      <div id="invoiceWrapper">
        <div class="mx-4 my-4 innerDiv">
          <div class="py-4 px-4">
            <div>
              <a
                href="https://www.brightreturn.com/"
                target="_blank"
                title="App Return"
              >
                <img
                  src="/images/logos/bright-return-2.svg"
                  alt="BrightReturn"
                  width="240"
                  height="240"
                  class="h-auto"
                  style="
                    box-sizing: border-box;
                    display: block;
                    width: 150px;
                    max-width: 100%;
                    height: auto;
                    line-height: normal;
                    vertical-align: sub;
                    border: 0;
"
                >
              </a>
            </div>

            <div class="detailsTable">
              <table class="w-full text-left mt-4">
                <tr>
                  <th>Subject</th>
                  <td
                    class="subject-content"
                    v-html="broadcastMessageDetails?.data?.subject.text"
                  />
                </tr>
                <tr>
                  <th>Date & Time</th>
                  <td>
                    {{
                      dateToHumanShort(
                        broadcastMessageDetails?.data?.scheduleDate,
                        'MMMM D, YYYY h:mm:ss A',
                      )
                    }}
                  </td>
                </tr>
                <tr>
                  <th>Sender</th>
                  <td>
                    {{ broadcastMessageDetails?.data?.createdBy?.firstName }}
                    {{ broadcastMessageDetails?.data?.createdBy?.lastName }}
                  </td>
                </tr>
                <!-- <tr>
                  <th>Link expires on</th>
                  <td></td>
                </tr> -->
              </table>
            </div>

            <!-- <div class="text-right mt-4">
              <Button label="Download All" severity="secondary" outlined />
            </div> -->

            <div class="mt-8">
              <ul
                class="w-full text-left mt-4 py-4 px-4 flex flex-column gap-3 card shadow-3"
              >
                <li
                  v-for="attachment in broadcastMessageDetails?.data
                    ?.attachments"
                  :key="attachment?.id"
                  class="flex justify-content-between align-items-center"
                >
                  <div class="attachment-details flex align-items-center">
                    <img
                      class="w-4rem h-auto mr-2"
                      :src="`${fileIcon(attachment.name)}`"
                      alt=""
                    >
                    <div class="name-size">
                      <div>{{ attachment.name }}</div>
                      <div class="font-medium">
                        {{ formatFileSize(attachment.size) }}
                      </div>
                    </div>
                  </div>
                  <span class="text-right">
                    <Button
                      @click="downloadFile(attachment.path, attachment.name)"
                    >Download</Button>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content-wrapper {
  max-width: 800px;
}

.innerDiv {
  box-shadow: rgb(0 0 0 / 35%) 0 5px 15px;
}

.detailsTable table {
  border-collapse: collapse;
}

table {
  border: 1px solid black;
}

.detailsTable td,
.detailsTable th {
  padding: 8px;
  text-align: left;
  border: 1px solid black;
}

th {
  width: 20%;
}

.subject-content {
  word-break: break-word;
}
</style>

<route lang="yaml">
meta:
  layout: webform
  isPublic: true
</route>
