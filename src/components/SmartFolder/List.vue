<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { MenuItem } from 'primevue/menuitem';
import Menu from 'primevue/menu';
import type { SmartFolder } from '@/types/smart-folder.type';

const props = defineProps<{
  isCreate?: boolean;
}>();

const emit = defineEmits<{
  (event: 'success'): void;
  (event: 'back'): void;
  (event: 'edit'): void;
}>();

const queryClient = useQueryClient();
const { featureSubscribed } = usePermissions();
const { getAll, remove: removeSmartFolder } = useSmartFolder();
const { filters, searchText: staticSearchText } = useDatatableFilters();
const { initToast } = useToasts();
const currentInstance = getCurrentInstance();
const deleteSmartFolderDialog = ref(false);
const selectedSmartFolder = ref<SmartFolder>();
const isUpdate = ref(false);
const filteredSmartFolders = ref();

const {
  data: smartFolderList,
  isLoading: loadingSmartFolderList,
  isFetching: fetchingSmartFolderList
} = useQuery(
  ['smart-folder-list'],
  () => {
    return getAll();
  },
  {
    onSuccess: (data) => {
      if (featureSubscribed('smart_folder', 'default_smart_folder') === false) {
        filteredSmartFolders.value = data.filter(
          item => item.isPredefined === false
        );
      }
      else {
        filteredSmartFolders.value = data;
      }
    }
  }
);

const { isLoading: deletingSmartFolder, mutateAsync: deleteSmartFolder }
  = useMutation(
    (id: string) => {
      return removeSmartFolder(id);
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Remove',
          summary: `Delete Smart Folder`,
          detail: `Smart Folder <strong>${selectedSmartFolder.value?.name}</strong> deleted
           successfully`
        });
        queryClient.invalidateQueries('smart-folder-list');
        queryClient.invalidateQueries('smart-folder-limit');
      }
    }
  );

async function handleDeleteSmartFolder() {
  await deleteSmartFolder(selectedSmartFolder.value?.id as string);
  deleteSmartFolderDialog.value = false;
}

const smartFolderMenuItems = ref([
  {
    label: 'Edit',
    action: 'edit',
    icon: 'pi pi-pencil'
  },
  {
    label: 'Delete',
    action: 'delete',
    icon: 'pi pi-trash'
  }
]);

function menuClick(item: MenuItem, data: SmartFolder) {
  selectedSmartFolder.value = data;
  switch (item.action) {
    case 'edit':
      emit('edit');
      isUpdate.value = true;
      break;
    case 'delete':
      deleteSmartFolderDialog.value = true;
      break;

    default:
      break;
  }
}

function toggleMenu(event: Event, ref: string) {
  const foundMenu = Array.isArray(
    currentInstance?.refs[ref] as InstanceType<typeof Menu>
  )
    ? (currentInstance?.refs[ref] as InstanceType<typeof Menu>[])[0]
    : (currentInstance?.refs[ref] as InstanceType<typeof Menu>);

  foundMenu && foundMenu.toggle(event);
}

function handleBack() {
  selectedSmartFolder.value = undefined;
  isUpdate.value = false;
  emit('back');
}
</script>

<template>
  <transition mode="out-in" name="slide-left">
    <SmartFolderCreate
      v-if="isCreate || isUpdate"
      :smart-folder="selectedSmartFolder"
      @back="handleBack"
    />
    <template v-else>
      <CommonLoading v-if="loadingSmartFolderList || fetchingSmartFolderList" />
      <DataTable
        v-else
        v-model:filters="filters"
        :value="filteredSmartFolders"
        responsive-layout="scroll"
        :paginator="false"
        breakpoint="768px"
        :loading="loadingSmartFolderList || fetchingSmartFolderList"
        :global-filter-fields="['name']"
        filter-display="menu"
      >
        <template #empty>
          <div class="text-center">
            No smart folders found.
          </div>
        </template>
        <template #header>
          <div class="flex justify-content-between">
            <div class="p-input-icon-left mr-auto">
              <i class="pi pi-search" />
              <InputText
                v-model="staticSearchText"
                aria-label="Search List"
                placeholder="Search smart folders"
                type="search"
              />
            </div>
            <!-- <CommonListSearchInput
              v-else
              v-bind="{
                listProps: {
                  ...props,
                  statusId: selectedStatus ? selectedStatus : undefined,
                },
                placeholder: `Search ${
                  entityType === 'SUPPORTTASK' ? 'Tickets' : 'Tasks'
                }`,
              }"
            /> -->
          </div>
        </template>
        <Column header="Name" field="name">
          <template #body="{ data }">
            <div>{{ data.name }}</div>
          </template>
        </Column>
        <Column header="Description" field="description" class="w-8">
          <template #body="{ data }">
            <div>{{ data.description || '' }}</div>
          </template>
        </Column>
        <Column class="text-center w-6rem" header="Actions">
          <template #body="{ data }">
            <div v-if="data.isPredefined" class="text-orange-500 text-center">
              Predefined
            </div>
            <div v-else class="flex justify-content-center gap-2">
              <Button
                :icon="
                  deletingSmartFolder && selectedSmartFolder?.id === data.id
                    ? 'pi pi-spin pi-spinner'
                    : 'pi pi-ellipsis-v'
                "
                class="p-button-sm p-button-secondary p-button-rounded bg-primary"
                aria-haspopup="true"
                :aria-controls="`overlay_menu_${data.id}`"
                @click.stop="toggleMenu($event, `menu-${data.id}` as string)"
              />
              <Menu
                :id="`overlay_menu_${data.id}`"
                :ref="`menu-${data.id}`"
                :model="smartFolderMenuItems"
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
      </DataTable>
    </template>
  </transition>

  <CommonConfirmRemoveDialog
    v-if="deleteSmartFolderDialog"
    :visible="deleteSmartFolderDialog"
    title="Confirm Remove Smart Folder"
    @confirm="handleDeleteSmartFolder"
    @hide="deleteSmartFolderDialog = false"
  >
    <div>
      Are you sure you want to {{ 'remove' }} the smart folder
      <strong>{{ selectedSmartFolder?.name }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
</template>
