<script setup lang="ts">
import type { Attachment } from '@/types/attachment.type';
import type { EntityType, Task } from '@/types/tasks.type';
import type { FullNameObj, User } from '@/types/teams.type';
import { useQuery } from 'vue-query';

const props = defineProps<{
  taskId?: string;
  task?: Task;
  canCallTaskDetails?: boolean;
}>();
const emit = defineEmits<{
  (e: 'success', data: Task): void;
}>();

const { fullName, dateToHumanShort, initials, convertMinsToHrsMins }
  = useVueFilters();
const { getAttachmentUrl } = useAttachments();
const router = useRouter();
const { $screens, isDoubleExtraLarge } = useCommonBreakPoints();
const { currentUser, isPortalUser } = useCurrentUserData();
const isAvailable = ref(true);

const { data: taskDetails, isLoading } = useQuery(
  ['task-details', props.taskId],
  async () =>
    useTask(
      props.taskId as string,
      props.task?.type as EntityType,
      isPortalUser.value
    ),
  {
    enabled: props.canCallTaskDetails && !!props.taskId,
    onSuccess: async (data) => {
      emit('success', data as Task);
      if (data.dueDate && !isPortalUser.value) {
        const userId = Array.isArray(data.assignees)
          ? data.assignees[0]
          : data.assignees;
        const response = await checkAvailability({
          date: data.dueDate,
          userId
        });
        isAvailable.value = response;
      }
    }
  }
);
const isSupport = computed(() => {
  return props.task?.type === 'SUPPORTTASK';
});

const isUserAvailable = computed(() => {
  return isAvailable.value;
});
</script>

<template>
  <div class="grid grid-nogutter surface-border">
    <div class="py-3" :class="isDoubleExtraLarge ? 'col-6' : 'col-12'">
      <div class="text-500 font-medium mb-1">
        {{ isSupport ? 'Ticket Raised Date' : 'Planned Start Date' }}
      </div>
      <div class="text-900 font-medium">
        {{
          isSupport
            ? taskDetails?.createdAt
              ? dateToHumanShort(taskDetails?.createdAt as string)
              : 'None'
            : taskDetails?.startDate
              ? dateToHumanShort(taskDetails?.startDate)
              : 'None'
        }}
      </div>
    </div>
    <div class="py-3" :class="isDoubleExtraLarge ? 'col-6' : 'col-12'">
      <div class="text-500 font-medium mb-1">
        {{ isSupport ? 'Start Date' : 'Actual Start Date' }}
      </div>
      <div class="text-900 font-medium">
        {{
          taskDetails?.actualStartDate
            ? dateToHumanShort(taskDetails?.actualStartDate)
            : 'None'
        }}
      </div>
    </div>
    <div class="py-3" :class="isDoubleExtraLarge ? 'col-6' : 'col-12'">
      <div class="text-500 font-medium mb-1">
        {{ isSupport ? 'Expected Resolution Date' : 'Due Date' }}
      </div>
      <div class="text-900 font-medium">
        {{
          taskDetails?.dueDate ? dateToHumanShort(taskDetails?.dueDate) : 'None'
        }}
      </div>
      <div
        v-if="!isPortalUser && !isUserAvailable"
        class="font-normal text-orange-500"
      >
        Leaves/Holidays are conflicting with Task's Due date
      </div>
    </div>
    <div
      v-if="taskDetails?.actualCompletedDate && isSupport"
      class="py-3"
      :class="isDoubleExtraLarge ? 'col-6' : 'col-12'"
    >
      <div class="text-500 font-medium mb-1">
        Ticket Resolution Date
      </div>
      <div class="text-900 font-medium">
        {{
          taskDetails?.actualCompletedDate
            ? dateToHumanShort(taskDetails?.actualCompletedDate)
            : 'None'
        }}
      </div>
    </div>
    <template v-if="!isSupport">
      <div class="py-3" :class="isDoubleExtraLarge ? 'col-6' : 'col-12'">
        <div class="text-500 font-medium mb-1">
          Task Aging
        </div>
        <div class="text-900 font-medium">
          {{
            taskDetails?.taskAging ? `${taskDetails?.taskAging} Day(s)` : 'NA'
          }}
        </div>
      </div>
      <div class="py-3" :class="isDoubleExtraLarge ? 'col-6' : 'col-12'">
        <div class="text-500 font-medium mb-1">
          Over Due
        </div>
        <i v-if="isLoading" class="pi pi-spin pi-spinner" />
        <div
          v-else
          class="text-900 font-medium"
          :class="{
            'text-red-600': taskDetails?.overDueInDays !== 'NA',
          }"
        >
          {{
            taskDetails?.overDueInDays !== 'NA'
              ? `${taskDetails?.overDueInDays} Day(s)`
              : 'NA'
          }}
        </div>
      </div>
      <div class="py-3" :class="isDoubleExtraLarge ? 'col-6' : 'col-12'">
        <div class="text-500 font-medium mb-1">
          Total Budget Time
        </div>
        <div class="text-900 font-medium">
          <i v-if="isLoading" class="pi pi-spin pi-spinner" />
          <template v-else>
            {{ convertMinsToHrsMins(Number(taskDetails?.estimatedTime)) }}
          </template>
        </div>
      </div>
    </template>
    <div class="py-3" :class="isDoubleExtraLarge ? 'col-6' : 'col-12'">
      <div class="text-500 font-medium mb-1">
        Total Time Spent
      </div>
      <div class="text-900 font-medium">
        <i v-if="isLoading" class="pi pi-spin pi-spinner" />
        <template v-else>
          {{ convertMinsToHrsMins(Number(taskDetails?.timeSpent)) }}
        </template>
      </div>
    </div>
    <div class="py-3" :class="isDoubleExtraLarge ? 'col-6' : 'col-12'">
      <div class="text-500 font-medium mb-1">
        Collaborators
      </div>
      <div class="text-900 font-medium flex flex-wrap gap-1">
        <i v-if="isLoading" class="pi pi-spin pi-spinner" />
        <template v-else>
          <template v-if="(taskDetails?.watchersData as User[])?.length > 0">
            <Avatar
              v-for="(user, index) in taskDetails?.watchersData"
              :key="index"
              v-tooltip.top="`${fullName(user)}`"
              class="cursor-pointer"
              :class="{ 'bg-primary': user.picture }"
              shape="circle"
              @click="
                router.push({ name: 'admin-teams-id', params: { id: user.id } })
              "
            >
              <template v-if="user.picture">
                <img
                  class="bg-primary text-sm"
                  :src="`${getAttachmentUrl(
                    (user?.picture as Attachment).path as string,
                  )}`"
                  :style="{ 'vertical-align': 'middle' }"
                  :alt="`${fullName(user)}`"
                >
              </template>
              <span v-else>
                {{
                  `${initials(
                    fullName(user as unknown as FullNameObj) as string,
                  )}`
                }}
              </span>
            </Avatar>
          </template>
          <span v-else>No Collaborators</span>
        </template>
      </div>
    </div>
  </div>
</template>
