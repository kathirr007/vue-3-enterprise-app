<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem';
import Menu from 'primevue/menu';
import { type Feedback, type FeedbackCreatePayload, FeedbackStatus } from '@/types/feedback.type';
import type { APIActions } from '@/types/common.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import StarRating from 'vue-star-rating';

const props = defineProps<{
  multiSelect?: boolean;
  hideActions?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:feedback', value: { data: Feedback; action: APIActions }): void;
  (e: 'cancel:feedback', value: { data: Feedback; action: APIActions }): void;
}>();

const { updateFeedback, remindFeedback, ratingPassthroughOptions, ratingOptions } = useFeedback();
const { initToast } = useToasts();
const queryClient = useQueryClient();

const currentInstance = getCurrentInstance();
const selectedFeedback = ref<Feedback>();
const removeFeedbackDialog = ref(false);
const feedbackActionMenus = ref([
  {
    label: 'Edit',
    action: 'edit',
    icon: 'pi pi-pencil',
    iconClass: 'text-xl mr-1',
    showPortal: true
  },
  {
    label: 'Send Reminder',
    action: 'remind',
    icon: 'pi pi-undo'
  },
  {
    label: 'Cancel',
    action: 'cancel',
    icon: 'pi pi-times'
  }
]);

function toggleMenu(event: Event, ref: string) {
  const foundMenu = Array.isArray(
    currentInstance?.refs[ref] as InstanceType<typeof Menu>
  )
    ? (currentInstance?.refs[ref] as InstanceType<typeof Menu>[])[0]
    : (currentInstance?.refs[ref] as InstanceType<typeof Menu>);

  foundMenu && foundMenu.toggle(event);
}

function showToast(actionType: APIActions,
  actionTitle: string,
  data?: Feedback) {
  initToast({
    actionType,
    title: actionTitle,
    summary: `${actionType} ${actionTitle}`,
    detail:
      actionType === 'Remind'
        ? `Reminder of ${actionTitle} ${
            data ? `for <strong>${data.title}</strong>` : ''
          } sent successfully.`
        : `${actionTitle} ${
            data ? `<strong>${data.title}</strong>` : ''
          } ${actionType}d successfully.`
  });
  queryClient.invalidateQueries('feedbacks-list');
}

const {
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  currentLimit,
  currentPage,
  queryFilters,
  querySortBy,
  queryKeys
} = useDataTableUtils();
const { getAll } = useHrmsHolidays();
const { getAllFeedbacks } = useFeedback();
const { canDo } = usePermissions();
const { dateToHumanShort } = useVueFilters();

const { isLoading: loadingHolidays, data: holidays } = useQuery(
  ['feedbacks-list', ...queryKeys],
  () => {
    return getAllFeedbacks({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value,
      sortBy: querySortBy.value
    });
  }
);

const { mutateAsync: handleRemind, isLoading: remindingFeedback } = useMutation(
  ['remind-feedback'],
  (id: string) => {
    return remindFeedback(selectedFeedback.value?.id as string);
  },
  {
    onSuccess: () => {
      showToast('Remind', 'Feedback', selectedFeedback.value);
    }
  }
);
const { mutateAsync: handleCancel, isLoading: updatingFeedback } = useMutation(
  ['update-feedback'],
  ({ id, payload }: { id: string; payload: Partial<FeedbackCreatePayload> }) => {
    return updateFeedback({ id: selectedFeedback.value?.id as string, payload });
  },
  {
    onSuccess: () => {
      showToast('Cancel', 'Feedback', selectedFeedback.value);
    }
  }
);

async function handleRemindFeedback() {
  await handleRemind(selectedFeedback.value?.id as string);
}

function menuClick(item: MenuItem, data: any) {
  selectedFeedback.value = data;
  switch (item.action) {
    case 'edit':
      emit('update:feedback', { data, action: 'Update' });
      break;
    case 'remind':
      handleRemindFeedback();
      break;
    case 'cancel':
      removeFeedbackDialog.value = true;
      break;

    default:
      break;
  }
}

function filterFeedbackActionMenus(feedback: Feedback) {
  const menusToFilter = ['edit', 'markAsPaid', 'remind', 'cancel', 'share'];
  const statusToCheck = ['None'];

  return statusToCheck.includes(feedback.status as string)
    ? feedbackActionMenus.value.filter(
      (menu: MenuItem) => !menusToFilter.includes(menu.action)
    )
    : feedbackActionMenus.value;
}

async function handleCancelFeedback() {
  const { client: { id: clientId }, projects: [{ id: projectId }], title } = selectedFeedback.value as Feedback;
  const payload: Partial<FeedbackCreatePayload> = { projectIds: [projectId], clientId, title, status: 'CANCELLED' };
  await handleCancel({ id: selectedFeedback.value?.id as string, payload });
}
</script>

<template>
  <DataTable
    data-key="id"
    :total-records="holidays?.total"
    :value="holidays?.results"
    :loading="loadingHolidays"
    v-bind="tableAttrs"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <Column header="Title" field="title" class="w-4" />
    <Column header="Client" field="client">
      <template #body="{ data }">
        {{ data.client.name }}
      </template>
    </Column>
    <Column header="Rating" field="rating" class="text-center">
      <template #body="{ data }">
        <div class="text-center">
          <StarRating class="align-items-center justify-content-center" :rating="(data.rating || 0)" v-bind="{ ...ratingOptions }" />
        </div>
      </template>
    </Column>
    <Column header="Date & Time">
      <template #body="{ data }">
        {{ data.ratedAt ? dateToHumanShort(data.ratedAt) : 'NA' }}
      </template>
    </Column>
    <Column header="Status">
      <template #body="{ data }">
        {{ FeedbackStatus[data.status as keyof typeof FeedbackStatus] }}
      </template>
    </Column>
    <Column
      class="text-center w-2"
    >
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="{ data }">
        <div class="flex justify-content-center gap-2">
          <Button
            icon="pi pi-ellipsis-v"
            class="p-button-sm p-button-secondary p-button-rounded bg-primary"
            aria-haspopup="true"
            :aria-controls="`overlay_menu_${data.id}`"
            :disabled="data.status === 'COMPLETED' || data.status === 'CANCELLED' "
            @click.stop="
              toggleMenu($event, `menu-${data.id}` as string)
            "
          >
            <i
              v-if="
                data.id === selectedFeedback?.id
                  && (updatingFeedback || remindingFeedback)
              "
              class="pi pi-spin pi-spinner"
            />
          </Button>
          <Menu
            :id="`overlay_menu_${data.id}`"
            :ref="`menu-${data.id}`"
            :model="
              filterFeedbackActionMenus(data as Feedback)
            "
            :popup="true"
          >
            <template #item="{ item }">
              <span
                class="p-menuitem-link"
                role="menuitem"
                @click="menuClick(item, data)"
              >
                <Icon
                  v-if="item.iconify"
                  class="flex-none"
                  :icon="item.icon"
                  :class="item.iconClass"
                />
                <span
                  v-else
                  class="p-menuitem-icon pi"
                  :class="item.icon"
                />
                <span class="p-menuitem-text">
                  {{ item.label }}
                </span>
              </span>
            </template>
          </Menu>
        </div>
      </template>
    </Column>
    <template #empty>
      <div class="text-center">
        No Feedbacks found
      </div>
    </template>
  </DataTable>
  <CommonConfirmRemoveDialog
    v-if="removeFeedbackDialog"
    :visible="removeFeedbackDialog"
    :record-to-remove="(selectedFeedback as Record<string, any>)"
    header="Cancel Feedback"
    @confirm="handleCancelFeedback"
    @hide="removeFeedbackDialog = false"
  />
</template>
