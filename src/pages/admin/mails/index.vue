<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem';
import type { Inbox } from '@/types/inbox.type';
import { useQuery } from 'vue-query';

const { defaultBreakpoints } = useCommonBreakPoints();
const { currentUser } = useCurrentUserData();
const { canAccessAllMenu, featureSubscribed } = usePermissions();
const isCreateInbox = ref(false);
const isCreateThread = ref(false);
const disableCreateThread = ref(false);
const selectedInbox = ref<Inbox>();

const { data: inboxes, isFetching: gettingInboxes } = useQuery(
  'inboxes',
  () => {
    return useInboxList();
  },
  {
    onSuccess: (data) => {
      mailsMenuItems.value = [
        {
          label: 'Inboxes',
          items: data.length
            ? data.map((item, index) => {
              return {
                label: item.name,
                data: item,
                command: () => {
                  selectedInbox.value = item;
                  addInlineStyling(index);
                }
              };
            })
            : [
                {
                  label: 'New Inbox',
                  icon: 'pi pi-plus',
                  command: () => {
                    isCreateInbox.value = true;
                  }
                }
              ]
        }
      ];
      if (data?.length) {
        selectedInbox.value = data[0];
        addInlineStyling(0);
      }
    }
  }
);

function addInlineStyling(index: number) {
  mailsMenuItems.value[0].items = mailsMenuItems.value[0].items?.map(
    (item, i) => {
      if (i === index) {
        return {
          ...item,
          style: { borderLeft: '4px solid #1B6DE6' }
        };
      }
      else {
        return { ...item, style: '' };
      }
    }
  );
}

const appMenuControls = allMenuControls;
const mailsMenuItems = ref<MenuItem[]>([
  {
    label: 'Inboxes',
    items: []
  }
]);

const hasMailAccess = computed(() => {
  if (inboxes.value) {
    return inboxes.value[0]?.agentId?.includes(currentUser.value?.id);
  }
  return false;
});

// const disableThreadCreate = () => {
//   disableCreateThread.value = true;
// };

// const closeCreateThread = () => {
//   isCreateThread.value = false;
//   disableCreateThread.value = false;
// };

onMounted(() => {
  appMenuControls.toggleEmailLayout(true);
  // currentMailType.value = 'inbox';
});

onUnmounted(() => {
  appMenuControls.toggleEmailLayout(false);
});
</script>

<template>
  <div v-if="featureSubscribed('help_desk', 'inbox') === false" class="card">
    <Common426 feature="inbox" />
  </div>
  <div v-else>
    <!-- <template
      v-slot:actions
      v-if="currentUser.isOwner || (canAccessAllMenu && hasMailAccess)"
    >
      <Button
        icon="pi pi-cog"
        class="p-button-rounded"
        :disabled="!selectedInbox"
        v-tooltip.left="'Mailbox Configuration'"
        @click="isCreateThread = true"
      />
    </template> -->
    <template v-if="currentUser.isOwner || hasMailAccess">
      <CommonLoading v-if="gettingInboxes" />
      <div v-else class="grid">
        <div
          v-if="!inboxes?.length"
          class="col-2 pr-0 mail-scroll-section space-y-3.5"
        >
          <!-- <Menu :model="mailsMenuItems" class="w-auto" /> -->
          <Menu :model="mailsMenuItems" class="w-auto h-full">
            <template #item="data">
              <div class="p-menuitem-link">
                <span
                  class="p-menuitem-text custom-line-clamp-1"
                  :title="data.item.label as string"
                >
                  <i
                    v-if="data.item.icon"
                    :class="data.item.icon"
                    class="mr-2"
                  />
                  {{ data.item.label }}</span>
                <div
                  class="p-menuitem-text custom-line-clamp-1 font-normal break-all"
                  :style="{ marginTop: '1px' }"
                  :title="data.item?.data?.fromEmail[0] || ''"
                >
                  {{ data.item?.data?.fromEmail[0] || '' }}
                </div>
              </div>
            </template>
          </Menu>
        </div>
        <div :class="!inboxes?.length ? 'col-10' : 'col-12'">
          <MailsThreadContainer v-if="selectedInbox" :inbox="selectedInbox" />
          <div
            v-else
            class="h-full w-full card flex align-items-center justify-content-center"
          >
            Please create inbox to show mails.
          </div>
        </div>
      </div>
    </template>
    <div v-else class="card">
      <p class="text-center font-medium text-xl">
        You don't have access of the Mails. Please contact administrator.
      </p>
    </div>
  </div>

  <Dialog
    v-model:visible="isCreateInbox"
    :modal="true"
    append-to="body"
    header="Create Inbox"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '50vw' }"
    content-class="border-round-bottom-md"
    @hide="isCreateInbox = false"
  >
    <MailsCreateInbox @modal-close="isCreateInbox = false" />
  </Dialog>
</template>

<style lang="scss" scoped>
$submenuItemTextColor: #83888f;
$submenuItemHoverBgColor: var(--primary-lighter-color);
$activeSubmenuItemTextColor: rgb(41 50 65 / 80%);

.mail-scroll-section {
  height: calc(100vh - 325px);
  overflow-y: auto;
}

:deep(.p-menu) {
  .p-menuitem-link {
    display: flex;
    flex-direction: column;
    align-items: start;
    padding: 0.5rem 1rem;
    font-weight: 500;
    line-height: 1.5;
    color: $submenuItemTextColor;
    transition: all 0.3s ease;

    &:hover {
      .p-menuitem-text {
        color: $primaryColor;
      }

      background-color: $submenuItemHoverBgColor;
    }
  }
}

.pi-custom::before {
  // background-color: v-bind(customIconColor);
  // font-weight: v-bind(customIconFont);
  background-color: $submenuItemTextColor;
}
</style>
