<script lang="ts" setup>
import type {
  CreateServicePayload,
  OrderedPipelineStages,
  ProjectStage,
  Service
} from '@/types/service.type';
import type { GenerateTasksPayload } from '@/types/project.type';
import { useMutation, useQuery } from 'vue-query';

const route = useRoute();
const { initToast } = useToasts();
const { defaultBreakpoints } = useCommonBreakPoints();
const { updateBreadcrumb } = useBreadcrumbs();
const { canDo } = usePermissions();
const { activeTabIndex, tabRef, handleTabChange }
  = useSteps('admin-services-id');

const serviceId = ref(route.params.id as string);
const createServiceDialog = ref(false);
const deleteServiceDialog = ref(false);
const projectStages = ref<OrderedPipelineStages[]>([]);

const { data: serviceDetails, isLoading: gettingService } = useQuery(
  'service-details',
  () => {
    if (!serviceId.value)
      return;
    return useServiceDetails(serviceId.value as string);
  },
  {
    onSuccess: (data: Service) => {
      if (data) {
        projectStages.value = data.OrderedPipelineStages;
        updateBreadcrumb({
          breadcrumbs: [
            { label: 'Setup Project Template', to: { name: 'admin-services' } },
            { label: data.name }
          ]
        });
      }
    }
  }
);

watchEffect(() => {
  if (serviceDetails.value) {
    updateBreadcrumb({
      breadcrumbs: [
        { label: 'Setup Project Template', to: { name: 'admin-services' } },
        { label: serviceDetails.value.name }
      ]
    });
  }
});

function showToast() {
  initToast({
    actionType: 'Delete',
    title: 'Project Template',
    actionObj: { ...serviceDetails.value }
  });
}

const { mutateAsync: removeService } = useMutation(
  (id: string) => useServiceDelete(id),
  {
    onSuccess: () => showToast()
  }
);

function deleteService() {
  if (serviceDetails.value !== undefined) {
    removeService(serviceDetails.value.id);
  }
}

const { mutateAsync: UpdateService, isLoading: updatingService } = useMutation(
  ({ payload, id }: { payload: Partial<Service>; id: string }) => {
    return useServiceUpdate(id, payload);
  },
  {
    onSuccess(data: Service) {
      initToast({
        actionType: serviceDetails.value ? 'Update' : 'Create',
        title: 'Project Template',
        actionObj: data as unknown as Record<string, unknown>
      });
      createServiceDialog.value = false;
    }
  }
);

function handleUpdateService(value: CreateServicePayload,
  id?: string,
  brightAssist?: { payload: GenerateTasksPayload | undefined }) {
  UpdateService({ payload: value as Partial<Service>, id: id as string });
}

function handleStage(stages: ProjectStage[]) {
  UpdateService({
    payload: {
      pipelineStage: stages.map((stage, index) => {
        return { pipelineStageId: stage.id, order: index + 1 };
      })
    } as Partial<Service>,
    id: serviceId.value as string
  });
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div>
    <div class="card flex flex-column md:flex-row mb-4 align-items-end">
      <div class="w-full md:w-7 mb-2 md:mb-0">
        <div class="flex align-items-center">
          <div class="ml-2 space-y-0.5 flex-1">
            <h1 class="text-3xl text-primary mb-2">
              {{ serviceDetails?.name }}
            </h1>
            <div class="w-full inline-flex align-items-center space-x-2.5">
              <i class="pi pi-clock text-2xl text-primary" />

              <span class="text-gray-800">{{ 'One Time' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full md:w-5 flex justify-content-end">
        <Button
          v-if="canDo('services', 'edit')"
          icon="pi pi-pencil"
          class="p-button-sm p-button-rounded"
          @click="createServiceDialog = true"
        />
        <!-- <Button
          icon="pi pi-trash"
          disabled
          class="p-button-sm p-button-rounded p-button-danger ml-2"
          @click="deleteServiceDialog = true"
        /> -->
      </div>
    </div>
    <TabView
      ref="tabRef"
      v-model:activeIndex="activeTabIndex"
      lazy
      @tab-change="handleTabChange"
    >
      <TabPanel header="Project Templates">
        <CommonPage
          title="
         Task Templates
        "
        >
          <ServiceAddTaskForm />
        </CommonPage>
      </TabPanel>
      <TabPanel header="Project Stages">
        <CommonPage
          title="
         Project Stages
        "
        >
          <CommonLoading v-if="gettingService" />
          <ServiceAddStageForm
            v-else
            class="w-6 mx-auto p-3 border-2 border-round default-border-color border-round-lg"
            :stages="projectStages"
            is-update
            :loading="updatingService"
            @stage="handleStage"
          />
        </CommonPage>
      </TabPanel>
    </TabView>
  </div>
  <CommonConfirmRemoveDialog
    v-if="serviceDetails && deleteServiceDialog"
    :visible="deleteServiceDialog"
    :record-to-remove="(serviceDetails as Record<string, any>)"
    title="Confirm Delete Project Template"
    @confirm="deleteService"
    @hide="deleteServiceDialog = false"
  />
  <Dialog
    v-model:visible="createServiceDialog"
    :modal="true"
    append-to="body"
    header="Update Project Template"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <ServiceAddDetailsForm @form="handleUpdateService" />
  </Dialog>
</template>
