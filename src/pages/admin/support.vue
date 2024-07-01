<script setup lang="ts">
import TasksList from '@/components/Tasks/List.vue';

const { defaultBreakpoints, isLarge } = useCommonBreakPoints();
const { canDo, featureSubscribed } = usePermissions();

const openTaskCreate = ref(false);
const formKey = ref(0);
const tasksListRef = ref<InstanceType<typeof TasksList> | null>(null);

function handleClose() {
  openTaskCreate.value = false;
}
</script>

<template>
  <!-- <TabView
    v-if="isLarge"
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    @tab-change="handleTabChange"
    lazy
  >
    <TabPanel header="Active Tickets">
      <CommonPage
        :title="`Active Tickets ( ${currentStatus ? currentStatus : ''} )`"
      >
        <TasksList
          ref="tasksListRef"
          :entityType="'SUPPORTTASK'"
          :disabledFilters="['Start Date', 'Project Name']"
          v-if="isLarge && canDo('support_tasks', 'list')"
          @task-status-title="handleStatusName"
        ></TasksList>
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Active Support Tickets list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
     <TabPanel header="Closed">
      <CommonPage title="Closed Tickets">
        <TasksList
          ref="tasksListRef"
          :status="'CLOSED'"
          :entityType="'SUPPORTTASK'"
          :disabledFilters="['Status', 'Start Date', 'Project Name']"
          v-if="isLarge && canDo('support_tasks', 'list')"
        ></TasksList>
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Closed Support Tickets list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
  </TabView> -->
  <div v-if="featureSubscribed('help_desk', 'support_tickets') === false" class="card">
    <Common426 feature="support tickets" />
  </div>
  <div v-else>
    <CommonPage v-if="isLarge" title="Support Tickets">
      <TasksList
        v-if="isLarge && canDo('support_tasks', 'list')"
        ref="tasksListRef"
        entity-type="SUPPORTTASK"
        :disabled-filters="['Start Date', 'Project Name']"
        hide-status-filters
      />
      <div v-else class="card">
        <p class="text-center font-medium text-xl">
          You don't have access of the Support Tickets list.
        </p>
      </div>
    </CommonPage>
    <CommonPage v-else title="Support Tickets">
      <TasksMobileList
        v-if="canDo('support_tasks', 'list')"
        ref="tasksListRef"
        entity-type="SUPPORTTASK"
        :disabled-filters="['Start Date', 'Project Name']"
      />
      <div v-else class="card">
        <p class="text-center font-medium text-xl">
          You don't have access of the Support Tickets list.
        </p>
      </div>
    </CommonPage>
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
        entity-type="SUPPORTTASK"
        @close="handleClose"
      />
      <TasksMobileCreateUpdate v-else @close="handleClose" />
    </Dialog>
  </div>
</template>
