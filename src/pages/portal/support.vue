<script setup lang="ts">
import TasksList from '@/components/Tasks/List.vue';

const { hasFeatureAccess } = useClientPortalAccess(
  'brightdesk',
  'Support Tickets'
);

const { featureSubscribed } = usePermissions();
const { defaultBreakpoints, isLarge } = useCommonBreakPoints();
const { currentUser } = useCurrentUserData();
const { activeTabIndex, tabRef, handleTabChange } = useSteps('portal-support');

const currentStatus = ref<string>();
const openTaskCreate = ref(false);
const formKey = ref(0);
const tasksListRef = ref<InstanceType<typeof TasksList> | null>(null);

function handleCreate() {
  openTaskCreate.value = true;
  formKey.value++;
}
function handleClose() {
  openTaskCreate.value = false;
}
function handleStatusName(val: string) {
  if (val) {
    currentStatus.value = val;
  }
}
</script>

<template>
  <Common401 v-if="!hasFeatureAccess" feature="Support Tickets" />
  <Common426
    v-else-if="featureSubscribed('client_portal', 'documents') === false"
    feature="support tickets"
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

      </TabPanel> -->
    <!-- <TabPanel header="Closed">
        <CommonPage title="Closed">
          <template #description
            >A list of all closed tickets. Click on a ticket of further details.
          </template>
          <TasksList
            ref="tasksListRef"
            :status="'CLOSED'"
            :entityType="'SUPPORTTASK'"
            :disabledFilters="['Status', 'Client', 'Assigned To', 'Project Name']"
            v-if="isLarge"
            isPortal
            :clientId="currentUser?.client.id"
          ></TasksList>
        </CommonPage>
      </TabPanel> -->
    <!-- </TabView> -->
    <CommonPage
      v-if="isLarge"
      :title="`Support Tickets ( ${currentStatus ? currentStatus : ''} )`"
    >
      <template #description>
        A list of all support tickets. Click on a ticket of further details.
      </template>
      <template #actions>
        <Button
          v-tooltip.left="'Add Task'"
          icon="pi pi-plus"
          class="p-button-rounded"
          @click="handleCreate"
        />
      </template>
      <TasksList
        v-if="isLarge"
        ref="tasksListRef"
        entity-type="SUPPORTTASK"
        :disabled-filters="['Client', 'Assigned To', 'Project Name']"
        is-portal
        :client-id="currentUser?.client?.id"
        @task-status-title="handleStatusName"
      />
    </CommonPage>
    <CommonPage v-else title="Support Tickets">
      <template #description>
        A list of all tickets. Click on a ticket of further details.
      </template>
      <template #actions>
        <Button
          v-tooltip.left="'Add Task'"
          icon="pi pi-plus"
          class="p-button-rounded"
          @click="handleCreate"
        />
      </template>
      <TasksMobileList
        ref="tasksListRef"
        entity-type="SUPPORTTASK"
        :disabled-filters="[
          'Start Date',
          'Project Name',
          'Client',
          'Assigned To',
        ]"
        :client-id="currentUser?.client?.id"
        is-portal
      />
    </CommonPage>
  </template>
  <Dialog
    v-model:visible="openTaskCreate"
    :modal="true"
    append-to="body"
    header="Create Task"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <TasksCreateUpdate
      v-if="isLarge"
      :key="formKey"
      :client-id="currentUser.client?.id"
      :is-support-task="true"
      @close="handleClose"
    />
    <TasksMobileCreateUpdate
      v-else
      :client-id="currentUser.client?.id"
      :is-support-task="true"
      @close="handleClose"
    />
  </Dialog>
</template>
