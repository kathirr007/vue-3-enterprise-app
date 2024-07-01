<script setup lang="ts">
import type { APIActions } from '@/types/common.type';
import type { FromEmail } from '@/types/fromemail.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const { featureSubscribed } = usePermissions();
const { remove: removeFromEmail } = useFromEmail();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { getAll } = useFromEmail();
const { initToast } = useToasts();
const queryClient = useQueryClient();

function showToast(data: FromEmail,
  title: string,
  actionType: APIActions,
  detail?: string) {
  initToast({
    actionType,
    title,
    actionObj: { ...data },
    detail
  });
}

const isCreateUpdateFromEmailDialog = ref(false);
const checkEmailDialog = ref(false);
const removeFromEmailDialog = ref(false);
const selectedFromEmail = ref();
const listData = ref();

function handleRemoveClose() {
  removeFromEmailDialog.value = false;
  selectedFromEmail.value = undefined;
}

function prepareForEmailActions(data: {
  data: FromEmail;
  action: APIActions;
}) {
  selectedFromEmail.value = data.data;
  if (data.action === 'Update')
    isCreateUpdateFromEmailDialog.value = true;
  if (data.action === 'Remove')
    removeFromEmailDialog.value = true;
}

const { mutateAsync: handleRemove } = useMutation(
  (id: string) => removeFromEmail(id),
  {
    onSuccess: (data) => {
      showToast(data as FromEmail, 'From Email', 'Remove');
      selectedFromEmail.value = undefined;
      queryClient.invalidateQueries('fromemail-list');
    }
  }
);

const {
  data: fromEmailList,
  isLoading,
  isFetching
} = useQuery('fromemail-list', () => {
  return getAll();
});
</script>

<template>
  <Common426
    v-if="featureSubscribed('bulk_email', 'from_email') === false"
    feature="from email"
  />
  <CommonPage v-else title="From Email">
    <template #actions>
      <Button
        v-if="!(fromEmailList?.length || isLoading || isFetching)"
        v-tooltip.left="'Create From Email'"
        icon="pi pi-plus"
        class="ml-2 p-button-rounded"
        @click="isCreateUpdateFromEmailDialog = true"
      />
    </template>
    <div class="card">
      <FromEmailList
        :list-data="fromEmailList"
        :is-loading="isLoading"
        @update:from-email="prepareForEmailActions"
        @delete:from-email="prepareForEmailActions"
      />
    </div>
    <CommonConfirmRemoveDialog
      v-if="removeFromEmailDialog"
      :visible="removeFromEmailDialog"
      header="Remove From Email"
      @confirm="handleRemove(selectedFromEmail?.id as string)"
      @hide="handleRemoveClose"
    >
      <div>Are you sure you want to remove the selected from email?</div>
    </CommonConfirmRemoveDialog>
    <Dialog
      v-model:visible="isCreateUpdateFromEmailDialog"
      :modal="true"
      append-to="body"
      :header="selectedFromEmail ? 'Update From Email' : 'Create From Email'"
      :breakpoints="defaultBreakpoints"
      :style="styles"
      content-class="border-round-bottom-md"
      @hide="selectedFromEmail = undefined"
    >
      <FromEmailCreateForm
        :from-email="selectedFromEmail"
        @success="
          isCreateUpdateFromEmailDialog = false;
          checkEmailDialog = true;
        "
      />
    </Dialog>
    <Dialog
      v-model:visible="checkEmailDialog"
      :modal="true"
      append-to="body"
      :breakpoints="defaultBreakpoints"
      :style="styles"
      content-class="border-round-bottom-md"
    >
      <div class="flex flex-column justify-content-center align-items-center">
        <span>
          Please check your email for a message from
          <a
            class="text-blue-500 hover:underline"
            href="mailto:no-reply-aws@amazon.com"
          >no-reply-aws@amazon.com</a>. Kindly verify the email to enable sending messages from that email
          address within BrightReturn Bulk Email
        </span>
        <Button class="mt-3" @click="checkEmailDialog = false">
          Got it
        </Button>
      </div>
    </Dialog>
  </CommonPage>
  <!-- <TabView
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    @tab-change="handleTabChange"
    @tab-click="handleTabChange"
    lazy
  >
    <TabPanel header="From Email"> </TabPanel
  ></TabView> -->
</template>
