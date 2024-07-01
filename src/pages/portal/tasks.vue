<script setup lang="ts">
import TasksList from '@/components/Tasks/List.vue';

const { hasFeatureAccess } = useClientPortalAccess('work', 'Tasks');

const { featureSubscribed } = usePermissions();
const { isLarge } = useCommonBreakPoints();
const { activeTabIndex, tabRef, handleTabChange } = useSteps('portal-tasks');

const tasksListRef = ref<InstanceType<typeof TasksList> | null>(null);
const currentStatus = ref<string>();
const currentUser = cookies.get('user');
function handleStatusName(val: string) {
  if (val) {
    currentStatus.value = val;
  }
}
</script>

<template>
  <Common401 v-if="!hasFeatureAccess" feature="Tasks" />
  <Common426
    v-else-if="featureSubscribed('client_portal', 'client_task') === false"
    feature="tasks"
  />
  <template v-else>
    <!-- <TabView
      v-if="isLarge"
      ref="tabRef"
      v-model:activeIndex="activeTabIndex"
      @tab-change="handleTabChange"
      lazy
    >
      <TabPanel header="Tasks">
        <CommonPage :title="`Task ( ${currentStatus ? currentStatus : ''} )`">
          <template #description
            >A list of all team tasks. Click on a task of further details.
          </template> -->
    <!-- <template v-slot:actions>
            <Button
              icon="pi pi-plus"
              class="p-button-rounded"
              @click="handleCreate"
              v-tooltip.left="'Add Task'"
            />
          </template> -->
    <!-- <TasksList
            ref="tasksListRef"
            v-if="isLarge"
            isPortal
            :entityType="'CLIENTTASK'"
            :disabledFilters="[
              'Client',
              'Assigned To',
              'Start Date',
              'Project Name',
            ]"
            :clientId="currentUser?.client.id"
            @task-status-title="handleStatusName"
          ></TasksList>
        </CommonPage>
      </TabPanel> -->
    <!-- <TabPanel header="Completed Tasks">
        <CommonPage title="Completed Tasks">
          <template #description
            >A list of all completed tasks. Click on a task of further details.
          </template>
          <TasksList
            ref="tasksListRef"
            :status="'CLOSED'"
            v-if="isLarge"
            isPortal
            :entityType="'CLIENTTASK'"
            :disabledFilters="['Status', 'Client', 'Assigned To', 'Project Name']"
            :clientId="currentUser?.client.id"
          ></TasksList>
        </CommonPage>
      </TabPanel> -->
    <!-- </TabView> -->
    <CommonPage
      v-if="isLarge"
      :title="`Task ( ${currentStatus ? currentStatus : ''} )`"
    >
      <template #description>
        A list of all tasks. Click on a task of further details.
      </template>
      <TasksList
        v-if="isLarge"
        ref="tasksListRef"
        is-portal
        entity-type="CLIENTTASK"
        :disabled-filters="[
          'Client',
          'Assigned To',
          'Start Date',
          'Project Name',
        ]"
        :client-id="currentUser?.client.id"
        @task-status-title="handleStatusName"
      />
    </CommonPage>
    <CommonPage v-else title="Tasks">
      <template #description>
        A list of all tasks. Click on a task of further details.
      </template>
      <!-- <template v-slot:actions>
        <Button
          icon="pi pi-plus"
          class="p-button-rounded"
          @click="handleCreate"
          v-tooltip.left="'Add Task'"
        />
      </template> -->
      <TasksMobileList
        ref="tasksListRef"
        entity-type="CLIENTTASK"
        :disabled-filters="[
          'Start Date',
          'Project Name',
          'Client',
          'Assigned To',
          'Project Manager',
        ]"
        is-portal
        :client-id="currentUser?.client.id"
      />
    </CommonPage>
    <!-- <Dialog
      :modal="true"
      appendTo="body"
      header="Create Task"
      v-model:visible="openTaskCreate"
      :breakpoints="defaultBreakpoints"
      :style="{ width: '60vw' }"
      :contentClass="'border-round-bottom-md'"
    >
      <TasksCreateUpdate v-if="isLarge" :key="formKey" @close="handleClose" />
      <TasksMobileCreateUpdate v-else @close="handleClose" />
    </Dialog> -->
  </template>
</template>
