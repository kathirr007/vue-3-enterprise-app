<script setup lang="ts">
import type {
  Project,
  ScheduleProjectPayload,
  ScheduleProjectStep,
  UnPlannedProject,
  UnScheduledProjectEntity,
  UnScheduledProjectEntityPayload } from '@/types/project.type';
import { useQuery } from 'vue-query';
import type { TaskTemplate } from '@/types/task-template.type';
import type { Attachment } from '@/types/attachment.type';
import type { FullNameObj } from '@/types/teams.type';
import type { EntityPriority, EntityStatus } from '@/types/status-entity.type';
import type { ContentJSON } from '@/types/common.type';

const props = defineProps<{
  dueDate: Date;
  projectDetails?: Project;
  serviceToSchedule?: UnPlannedProject;
  typeofSchedule?: 'Schedule' | 'Extend' | '';
  clientsSelected?: UnScheduledProjectEntity[];
  entities?: UnScheduledProjectEntityPayload[];
  entityTemplatesModified?: Record<string, any>[];
  formValues?: Record<string, any>;
  isLoading?: boolean;
  projectManager?: string;
  isProjectCreate?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', formValues: Record<string, any>): void;
  (e: 'modalClose'): void;
  (e: 'skip'): void;
  (e: 'entities-updates', data: Record<'string', any>[]): void;
  (
    e: 'secondary-btn-click',
    stepName: ScheduleProjectStep,
    formValues: Record<string, any>
  ): void;
}>();
const { fullName, initials } = useVueFilters();
const { isJsonStringValid } = useUtilityFns();
const { getAttachmentUrl } = useAttachments();
const formValues = ref<Partial<ScheduleProjectPayload>>();
const entityTemplatesModified = ref<Record<string, any>[]>([]);
const entities = ref<UnScheduledProjectEntityPayload[]>([]);
const formKey = ref(0);
const updateTaskDialog = ref(false);
const updateTaskDialogHeader = ref('');
const selectedTemplate = ref<TaskTemplate | UnScheduledProjectEntityPayload>();
const selectedAttachments = ref<Record<string, any>[]>([]);
const attachmentsListDialog = ref(false);
const selectedIndex = ref<number>();
const isAllEntitiesUpdated = computed(() =>
  entityTemplatesModified.value.every(item => !!item.isUpdated)
);

const { getEntityPriorityList, getEntityStatuses } = useCommonListQueries();

const { data: clientTaskStatuses } = getEntityStatuses({
  key: 'client-entity-statuses',
  type: 'CLIENTTASK'
});
const { data: clientTaskPriorites } = getEntityPriorityList({
  key: 'client-entity-priorities',
  type: 'CLIENTTASK'
});

const { data: taskStatuses } = getEntityStatuses({
  key: 'task-entity-statuses',
  type: 'TASK'
});
const { data: taskPriorites } = getEntityPriorityList({
  key: 'task-entity-priorities',
  type: 'TASK'
});

const { data: filterDataUser, applyFilter: applyFilterUser }
  = useFilterColumns();
applyFilterUser('Is Active', 'true');
const userFilters = useEncodeFilterData(filterDataUser);

const { usersListOptions } = useUserListOptions(true, userFilters);

const { isLarge, defaultBreakpoints } = useCommonBreakPoints();

const { data: entityTemplates, isFetching: loadingEntities } = useQuery(
  'entity-templates',
  () => {
    if (props.entityTemplatesModified)
      return props.entityTemplatesModified;
    return useTaskTemplateList(props.serviceToSchedule?.serviceId as string);
  }
);

function prepareForUpdate(data: TaskTemplate | UnScheduledProjectEntityPayload,
  index: number) {
  selectedIndex.value = index;
  selectedTemplate.value = data;
  formValues.value = data as Partial<ScheduleProjectPayload>;
  updateTaskDialog.value = true;
  updateTaskDialogHeader.value = `Update ${
    (selectedTemplate.value as TaskTemplate)?.title
    || (selectedTemplate.value as UnScheduledProjectEntityPayload)?.name
  } for ${props.projectDetails?.name}`;
}

watchEffect(() => {
  if (props.entities)
    entities.value = props.entities;
  if (props.entityTemplatesModified) {
    entityTemplatesModified.value = props.entityTemplatesModified;
  }
  formKey.value += 1;
});

watch(
  () => entityTemplatesModified.value,
  (arr) => {
    if (!Array.isArray(arr))
      return;
    emit('entities-updates', arr);
  },
  { deep: true }
);

function updateTaskTemplate(values: Record<string, any>) {
  if (selectedIndex.value !== undefined) {
    const { enableNotifications, enableBilling, ...selectedTaskValues }
      = entityTemplatesModified.value[selectedIndex.value];
    entityTemplatesModified.value[selectedIndex.value] = {
      ...selectedTaskValues,
      ...values,
      isUpdated: true
    };
  }

  selectedIndex.value = undefined;
}

function onSubmit() {
  emit(
    'submit',
    entityTemplatesModified.value.map((e) => {
      return {
        ...e,
        projectId: props.projectDetails?.id,
        isNotificationEnabled: `${
          (e as any).isNotificationEnabled === 'true' || e.enableNotifications
            ? 'true'
            : 'false'
        }`,
        isBillingEnabled: `${
          (e as any).isBillingEnabled === 'true' || e.enableBilling
            ? 'true'
            : 'false'
        }`,
        description: isJsonStringValid(e.description)
          ? JSON.parse(e.description)
          : (e.description as unknown as ContentJSON)?.content
              ? e.description
              : { content: e.description }
      };
    })
  );
}

function handleBack() {
  emit('secondary-btn-click', 'pipeline', {
    entities: entities.value,
    entityTemplatesModified: entityTemplatesModified.value
  });
}

function closeDialog() {
  updateTaskDialog.value = false;
  formValues.value = undefined;
}

watch(
  () => [
    clientTaskStatuses.value,
    clientTaskPriorites.value,
    taskStatuses.value,
    taskPriorites.value,
    usersListOptions.value,
    entityTemplates.value
  ],
  (arr) => {
    for (const e of arr) {
      if (!Array.isArray(e))
        return;
    }

    const clientTaskStatus = arr[0].find(
      (status: EntityStatus) => status.status === 1
    ).name;
    const clientTaskPriority = arr[1].find(
      (priority: EntityPriority) => priority.name.toUpperCase() === 'MEDIUM'
    ).name;
    const taskStatus = arr[2].find(
      (status: EntityStatus) => status.status === 1
    ).name;
    const taskPriority = arr[3].find(
      (priority: EntityPriority) => priority.name.toUpperCase() === 'MEDIUM'
    ).name;

    const dataModified = (entityTemplates.value as TaskTemplate[])?.map(
      (item: TaskTemplate) => ({
        ...item,
        isUpdated: false
      })
    );
    entityTemplatesModified.value = [...(dataModified as TaskTemplate[])].map(
      (e) => {
        return {
          ...e,
          entityStatus: e.entityType === 'TASK' ? taskStatus : clientTaskStatus,
          entityPriority:
            e.entityType === 'TASK' ? taskPriority : clientTaskPriority,
          startDate: props.projectDetails?.startDate,
          dueDate: props.dueDate,
          assignees: props.projectManager && [props.projectManager],
          assigneeData:
            props.projectManager
            && usersListOptions.value?.filter(
              e => e.id === props.projectManager
            ),
          isUpdated: !!props.projectManager,
          clientId: props.projectDetails?.client?.id,
          name: e.title,
          type: e.entityType
        };
      }
    );
  },
  {
    immediate: true
  }
);
</script>

<template>
  <form @submit.stop.prevent="onSubmit">
    <div v-if="!isProjectCreate" class="field mb-0" data-v-f9957f31="">
      <label class="block font-medium text-900">
        Lets update the tasks for
        {{ props.typeofSchedule?.toLowerCase() }} the Project for</label>
    </div>
    <DataTable
      :value="entityTemplatesModified"
      :loading="loadingEntities"
      responsive-layout="scroll"
      breakpoint="768px"
      :paginator="true"
      :rows="15"
      :always-show-paginator="false"
      :page-link-size="isLarge ? 5 : 3"
    >
      <template #empty>
        <div class="text-center">
          No task template record found.
        </div>
      </template>
      <Column field="title" header="Title" class="w-2" :sortable="true" />
      <Column header="Type" class="w-2" :sortable="true">
        <template #body="{ data }">
          {{ data.entityType === 'TASK' ? 'Team Task' : 'Client Request' }}
        </template>
      </Column>
      <Column v-if="!isProjectCreate" field="estimatedTime" class="w-2">
        <template #header>
          <i
            v-tooltip.top="'Task Duration in Minutes'"
            class="pi pi-clock text-xl"
          />
        </template>
        <template #body="{ data }">
          {{ data.estimatedTime }}
        </template>
      </Column>
      <Column v-if="!isProjectCreate" field="attachments" class="w-2">
        <template #header>
          <i v-tooltip.top="'Attachments'" class="pi pi-paperclip text-xl" />
        </template>
        <template #body="{ data }">
          <span
            v-if="data.attachments.length > 0"
            class="underline font-medium cursor-pointer hover:text-gray-600 text-blue-500"
            @click="
              selectedAttachments = data.attachments;
              attachmentsListDialog = true;
            "
          >View</span>
          <span v-else>N/A</span>
        </template>
      </Column>
      <Column field="assignee" class="w-2 text-center">
        <template #header>
          <i v-tooltip.top="'Assignee(s)'" class="pi pi-users text-xl" />
        </template>
        <template #body="{ data }">
          <template v-if="data.assigneeData?.length > 0">
            <Avatar
              v-for="(user, index) in data.assigneeData"
              :key="index"
              v-tooltip.top="`${fullName(user)}`"
              class="mr-2"
              :class="{ 'bg-primary': user.picture }"
              shape="circle"
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

          <span v-else>N/A</span>
        </template>
      </Column>
      <Column
        v-if="isProjectCreate"
        class="w-2 text-center"
        header="Created By"
      >
        <template #body="{ data }">
          <!-- <Icon
            v-if="data?.isGeneratedByBrightAssist"
            icon="fluent-emoji:robot"
            class="ml-1"
            style="font-size: 2.2rem"
          /> -->
          <img
            v-if="data?.isGeneratedByBrightAssist"
            src="/images/robot-icon.png"
            alt="bright assistant robot"
            class="w-3rem ml-1"
          >
          <Avatar
            v-else
            class="mr-1 bg-primary text-2xl line-height-3"
            shape="circle"
            icon="pi pi-user"
          />
        </template>
      </Column>

      <Column class="text-center w-2">
        <template #header>
          <div class="w-full text-center">
            Actions
          </div>
        </template>
        <template #body="slotProps">
          <span
            class="md:w-full font-medium cursor-pointer underline hover:text-gray-600"
            :class="
              slotProps.data.isUpdated ? 'text-green-500' : 'text-red-500'
            "
            @click="prepareForUpdate(slotProps.data, slotProps.index)"
          >
            {{ slotProps.data.isUpdated ? 'Review' : 'Update' }}
          </span>
          <span
            class="md:w-full font-medium cursor-pointer underline text-red-500 hover:text-gray-600 ml-2"
            @click="entityTemplatesModified.splice(slotProps.index, 1)"
          >Delete</span>
        </template>
      </Column>
    </DataTable>
    <div class="flex w-full justify-content-between mt-3 ml-auto col-12 px-0">
      <Button
        v-if="!isProjectCreate"
        label="Back"
        icon="pi pi-chevron-left"
        class="max-w-max p-button-text"
        @click="handleBack"
      />
      <div class="flex column-gap-2 ml-auto">
        <Button
          v-if="isProjectCreate"
          class="max-w-max"
          label="Skip"
          @click="emit('skip')"
        />
        <Button
          class="max-w-max"
          :disabled="!isAllEntitiesUpdated"
          type="submit"
          label="Submit"
          :loading="isLoading"
        />
      </div>
    </div>
    <Dialog
      v-model:visible="updateTaskDialog"
      :modal="true"
      append-to="body"
      :header="updateTaskDialogHeader"
      :breakpoints="defaultBreakpoints"
      :style="{ width: '60vw' }"
      content-class="border-round-bottom-md"
      @hide="closeDialog"
    >
      <ProjectScheduleUpdateTaskTemplate
        :key="formKey"
        project
        :task-id="selectedTemplate?.id"
        :service-id="serviceToSchedule?.serviceId"
        :clients-selected="clientsSelected"
        :form-values="formValues"
        :project-details="(projectDetails as Project)"
        :is-project-create="isProjectCreate"
        @modal-close="closeDialog"
        @submit="updateTaskTemplate"
      />
    </Dialog>
    <Dialog
      v-model:visible="attachmentsListDialog"
      :modal="true"
      append-to="body"
      header="Attachments"
      :breakpoints="defaultBreakpoints"
      :style="{ width: '45vw' }"
      content-class="border-round-bottom-md"
      @hide="selectedAttachments = []"
    >
      <ol
        v-if="selectedAttachments.length"
        class="project-clients-list pl-3 p-0 m-0 formgrid"
      >
        <li
          v-for="(item, index) in selectedAttachments"
          :key="index"
          class="col py-1"
        >
          <div class="flex">
            <a
              :href="getAttachmentUrl(item.path)"
              target="_blank"
              class="flex flex-1 align-items-center font-medium cursor-pointer text-gray-900 hover:text-gray-600"
            >
              {{ item.name }}
            </a>
          </div>
        </li>
      </ol>
      <template v-else>
        No attachments available
      </template>
    </Dialog>
  </form>
</template>

<style lang="scss" scoped></style>
