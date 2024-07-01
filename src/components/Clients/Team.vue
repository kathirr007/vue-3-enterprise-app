<script setup lang="ts">
import type {
  Client,
  ClientAddCollaboratorsPayload,
  Collaborator
} from '@/types/client.type';
import type { APIActions } from '@/types/common.type';
import { FilterMatchMode } from 'primevue/api';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const props = defineProps<{
  client?: Client;
}>();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { initToast } = useToasts();

const addCollaboratorsDialog = ref(false);
const confirmRemoveCollaboratorsDialog = ref(false);
const selectedCollaborator = ref<Collaborator>();

const queryClient = useQueryClient();

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const { activeNestedTabIndex, handleTabChange, nestedTabRef }
  = useSteps('admin-clients-id');

const { isLarge } = useCommonBreakPoints();
const route = useRoute();
const clientId = ref(route.params.id as string);
const { isLoading, data: workingTeamData } = useQuery(
  'client-working-team',
  () => {
    return useClientWorkingTeam(clientId.value as string);
  }
);

const {
  isLoading: isLoadingCollaborators,
  isFetching: isFetchingCollaborators,
  data: collaboratorsData
} = useQuery('client-collaborators', () => {
  return useClientCollaborators(clientId.value as string);
});

function showToast(type: APIActions) {
  initToast({
    title: 'Collaborators',
    actionType: type
  });
}

function handleUpdate() {
  addCollaboratorsDialog.value = false;
  queryClient.invalidateQueries('client-collaborators');
  showToast('Update');
}

function handleDeleteClick(val: Collaborator) {
  selectedCollaborator.value = val;
  confirmRemoveCollaboratorsDialog.value = true;
}

const { mutateAsync: removeCollaborators, isLoading: removingCollaborator }
  = useMutation(
    (payload: ClientAddCollaboratorsPayload & { clientId: string }) => {
      return detachCollaborators(payload);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('client-collaborators');
        confirmRemoveCollaboratorsDialog.value = false;
      }
    }
  );

function handleRemoveCollaborator(val: Collaborator) {
  const payload = {
    clientId: clientId.value,
    collaboratorIds: [val.id] || []
  };
  return removeCollaborators(payload);
}
</script>

<template>
  <TabView
    ref="nestedTabRef"
    v-model:activeIndex="activeNestedTabIndex"
    lazy
    @tab-change="handleTabChange($event, true)"
    @tab-click="handleTabChange($event, true)"
  >
    <TabPanel header="Project Team">
      <h2 class="text-3xl text-primary">
        Project Team
      </h2>
      <DataTable
        v-model:filters="filters"
        :value="workingTeamData"
        :loading="isLoading"
        responsive-layout="scroll"
        breakpoint="768px"
        :global-filter-fields="['name']"
        :paginator="true"
        :rows="15"
        :always-show-paginator="false"
        :page-link-size="isLarge ? 5 : 3"
        filter-display="menu"
      >
        <template #header>
          <div class="flex justify-content-end space-x-2.5">
            <div class="p-input-icon-left mr-auto">
              <i class="pi pi-search" />
              <InputText
                v-model="filters.global.value"
                aria-label="Search List"
                placeholder="Search Team Members"
                type="search"
              />
            </div>

            <!-- <Button
          v-if="workingTeamData?.length"
          icon="pi pi-download"
          label="Download"
          @click="exportToCSV(workingTeamData)"
        /> -->
          </div>
        </template>
        <template #empty>
          <div class="text-center">
            No team member found.
          </div>
        </template>
        <Column
          header="Team Member"
          class="w-2"
          :sortable="true"
          sort-field="name"
          :show-filter-match-modes="false"
          :filter-menu-style="{ width: '14rem' }"
          style="min-width: 14rem;"
          filter-field="name"
          field="name"
        >
          <template #body="{ data }">
            <!-- <router-link
          :to="{ name: 'admin-teams-id', params: { id: data.id } }"
          class="flex flex-shrink-1 align-items-center cursor-pointer text-gray-900 hover:text-gray-600"
        >
        </router-link> -->
            {{ data.name }}
          </template>
        </Column>

        <Column header="Acting As" field="actingAs" />
        <Column header="Designation" field="designation" />
        <Column header="Email">
          <template #body="{ data }">
            <div class="space-y-1.5">
              <div
                v-if="data.contact?.email"
                class="flex align-items-center break-all"
              >
                <a
                  :href="`mailto:${data.contact?.email}`"
                  class="flex align-items-center"
                  :aria-label="data.contact?.email"
                >
                  <!-- <Icon icon="fa6-solid:envelope" class="text-xl mr-2"/> -->
                  {{ data.contact?.email }}
                </a>
              </div>
              <div v-else>
                {{ 'No Email Added' }}
              </div>
            </div>
          </template>
        </Column>
        <Column header="Mobile">
          <template #body="{ data }">
            <div class="space-y-1.5">
              <div v-if="data.contact?.mobile" class="flex align-items-center">
                <a
                  :href="`tel:${data.contact?.mobile}`"
                  class="flex align-items-center"
                  :aria-label="data.contact?.mobile"
                >
                  <!-- <Icon icon="fa6-solid:mobile-screen-button" class="text-xl mr-2"/> -->
                  {{ data.contact?.mobile }}
                </a>
              </div>
              <div
                v-else-if="data.contact?.phone"
                class="flex align-items-center"
              >
                <a
                  :href="`tel:${data.contact?.phone}`"
                  class="flex align-items-center"
                  :aria-label="data.contact?.phone"
                >
                  <!-- <Icon icon="fa6-solid:phone" class="text-xl mr-2"/> -->
                  {{ data.contact?.phone }}
                </a>
              </div>
              <div v-else>
                {{ 'No Mobile or Phone Added' }}
              </div>
            </div>
          </template>
        </Column>
        <Column
          header="Managing Projects"
          class="text-center"
          field="noOfManagingProjects"
        />
        <Column
          header="Working Projects"
          class="text-center"
          field="noOfProjects"
        />
      </DataTable>
    </TabPanel>
    <TabPanel header="Working Team">
      <div
        class="w-full flex flex-column md:align-items-center md:justify-content-between md:flex-row"
      >
        <header
          class="w-full flex justify-content-between align-items-center flex-column md:flex-row mb-4"
        >
          <div class="w-full mr-auto">
            <h2 class="text-3xl text-primary mb-0">
              Working Team
            </h2>
          </div>
          <div class="my-4 md:m-0 ml-auto">
            <Button
              icon="pi pi-plus"
              class="p-button-sm p-button-rounded"
              aria-haspopup="true"
              aria-controls="overlay_menu"
              @click="addCollaboratorsDialog = true"
            />
          </div>
        </header>
      </div>
      <DataTable
        v-model:filters="filters"
        :value="collaboratorsData"
        responsive-layout="scroll"
        breakpoint="768px"
        :loading="isLoadingCollaborators || isFetchingCollaborators"
        :global-filter-fields="['name']"
        :paginator="true"
        :rows="15"
        :always-show-paginator="false"
        :page-link-size="isLarge ? 5 : 3"
        filter-display="menu"
      >
        <template #header>
          <div class="flex justify-content-end space-x-2.5">
            <div class="p-input-icon-left mr-auto">
              <i class="pi pi-search" />
              <InputText
                v-model="filters.global.value"
                aria-label="Search List"
                placeholder="Search Team Members"
                type="search"
              />
            </div>

            <!-- <Button
          v-if="workingTeamData?.length"
          icon="pi pi-download"
          label="Download"
          @click="exportToCSV(workingTeamData)"
        /> -->
          </div>
        </template>
        <template #empty>
          <div class="text-center">
            No team member found.
          </div>
        </template>
        <Column
          header="Team Member"
          class="w-2"
          :sortable="true"
          sort-field="name"
          :show-filter-match-modes="false"
          :filter-menu-style="{ width: '14rem' }"
          style="min-width: 14rem;"
          filter-field="name"
          field="name"
        >
          <template #body="{ data }">
            <!-- <router-link
          :to="{ name: 'admin-teams-id', params: { id: data.id } }"
          class="flex flex-shrink-1 align-items-center cursor-pointer text-gray-900 hover:text-gray-600"
        >
        </router-link> -->
            {{ data.name }}
          </template>
        </Column>

        <Column header="Acting As" field="actingAs" />
        <Column header="Designation" field="designation" />
        <Column header="Email">
          <template #body="{ data }">
            {{ data?.contact?.email }}
          </template>
        </Column>
        <Column header="Mobile">
          <template #body="{ data }">
            <div class="space-y-1.5">
              <div v-if="data.contact?.mobile" class="flex align-items-center">
                <a
                  :href="`tel:${data.contact?.mobile}`"
                  class="flex align-items-center"
                  :aria-label="data.contact?.mobile"
                >
                  <!-- <Icon icon="fa6-solid:mobile-screen-button" class="text-xl mr-2"/> -->
                  {{ data.contact?.mobile }}
                </a>
              </div>
              <div
                v-else-if="data.contact?.phone"
                class="flex align-items-center"
              >
                <a
                  :href="`tel:${data.contact?.phone}`"
                  class="flex align-items-center"
                  :aria-label="data.contact?.phone"
                >
                  <!-- <Icon icon="fa6-solid:phone" class="text-xl mr-2"/> -->
                  {{ data.contact?.phone }}
                </a>
              </div>
              <div v-else>
                {{ 'No Mobile or Phone Added' }}
              </div>
            </div>
          </template>
        </Column>
        <Column header="Actions" class="text-center">
          <template #body="{ data }">
            <Button
              :disabled="data.actingAs === 'Relationship Manager'"
              :icon="
                data.id === selectedCollaborator?.id && removingCollaborator
                  ? 'pi pi-spin pi-spinner'
                  : 'pi pi-trash'
              "
              class="p-button-rounded p-button-danger p-button-sm"
              @click="handleDeleteClick(data)"
            />
          </template>
        </Column>
      </DataTable>
    </TabPanel>
  </TabView>

  <Dialog
    v-model:visible="addCollaboratorsDialog"
    :modal="true"
    append-to="body"
    header="Add or Remove Working Team"
    :style="styles"
    :breakpoints="defaultBreakpoints"
    content-class="border-round-bottom-md"
  >
    <ClientsCreateUpdateForm
      :collaborators="collaboratorsData"
      :client="client"
      @success="handleUpdate"
    />
  </Dialog>

  <CommonConfirmRemoveDialog
    v-if="confirmRemoveCollaboratorsDialog"
    :visible="confirmRemoveCollaboratorsDialog"
    title="Confirm Remove Collaborator"
    @confirm="handleRemoveCollaborator(selectedCollaborator as Collaborator)"
    @hide="confirmRemoveCollaboratorsDialog = false"
  >
    <div>
      Are you sure you want to {{ 'remove' }} the collaborator
      <strong> {{ selectedCollaborator?.name }} </strong>?
    </div>
  </CommonConfirmRemoveDialog>
</template>
