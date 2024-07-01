<script setup lang="ts">
import { useQuery } from 'vue-query';
import type { User } from '@/types/teams.type';

const props = withDefaults(
  defineProps<{
    hideFilters?: boolean;
    disabledFilters?: string[];
    isContractualTeams?: boolean;
  }>(),
  {
    disabledFilters: () => [],
    hideFilters: false
  }
);

const emit = defineEmits<{
  (e: 'delete:user', data: User): void;
  (e: 'disable:user', data: User): void;
  (e: 'resend-verify:user', data: User): void;
}>();

const { currentUser } = useCurrentUserData();
const { isLarge } = useCommonBreakPoints();
const { canDo, canAccessAllMenu } = usePermissions();
const { getAttachmentUrl } = useAttachments();
const { fullName, initials } = useVueFilters();
const { filters } = useDatatableFilters();
const { metaFilter } = useUtilityFns();
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  filtersRef,
  isFiltersVisible,
  queryFilters,
  querySortBy,
  tableRecords,
  toggleFilters
} = useDataTableUtils();
const appMenuControls = allMenuControls;

/* const { data: filterData, applyFilter } = useFilterColumns();
if (props.isContractualTeams) {
  applyFilter('Type', ['OUTSOURCED_ORG_USER']);
} else {
  applyFilter('Type', ['ORG_USER']);
}

const preparedFilters = useEncodeFilterData(filterData); */

let encodedFilters: string | undefined;

let userFilter = ['Type', 'type', 'in', ['ORG_USER']];
if (props.isContractualTeams) {
  userFilter = ['Type', 'type', 'in', ['OUTSOURCED_ORG_USER']];
}
if (queryFilters.value) {
  const decodedFilters = JSON.parse(atob(queryFilters.value as string));
  const allUsersFilter = [userFilter, ...decodedFilters];
  encodedFilters = btoa(JSON.stringify(allUsersFilter));
}
else {
  const allUsersFilter = [userFilter];
  encodedFilters = btoa(JSON.stringify(allUsersFilter));
}

const { isLoading: loadingTeams, data: teamsData } = useQuery(
  'teams-list',
  () => {
    return useUsersListV2({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: encodedFilters,
      sortBy: querySortBy.value
    });
  },
  {
    onSuccess: (data) => {
      tableRecords.value = data;
    }
  }
);
</script>

<template>
  <DataTable
    v-model:filters="filters"
    :value="teamsData?.results"
    :total-records="teamsData?.total"
    :loading="loadingTeams"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="[
      'firstName',
      'lastName',
      'email',
      'manager.firstName',
      'manager.lastName',
      'manager.email',
    ]"
    v-bind="tableAttrs"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <template #header>
      <div class="flex justify-content-end">
        <CommonListSearchInput
          v-bind="{
            listProps: props,
            placeholder: isLarge ? 'Search Team Members' : 'Team Members',
          }"
        />
        <div>
          <Button
            v-if="!hideFilters"
            type="button"
            :icon="queryFilters ? 'pi pi-filter-slash' : 'pi pi-filter'"
            class="p-button-icon-only p-button-rounded"
            :class="[{ 'p-button-danger': queryFilters }]"
            @click="toggleFilters(!!queryFilters)"
          />
          <a
            href="https://brightreturn.com/kb/manage-project-team-in-cpa-firm"
            target="_blank"
          >
            <Button
              v-tooltip.top="'Need Help'"
              type="button"
              icon="pi pi-question-circle text-lg"
              class="p-button-icon-only p-button-rounded ml-2"
            />
          </a>
        </div>
      </div>
      <div v-if="isFiltersVisible && !hideFilters" class="my-2">
        <TeamsFilter
          ref="filtersRef"
          :filters="queryFilters"
          :disabled-filters="disabledFilters"
          :is-outsourced-teams="isContractualTeams"
        />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No team record found.
      </div>
    </template>
    <Column field="name" header="Name" class="w-3" sort-field="firstName">
      <template #body="{ data }">
        <router-link
          :to="{ name: 'admin-teams-id', params: { id: data.id } }"
          :class="{
            'pointer-events-none':
              (!canAccessAllMenu
                && data.id !== currentUser.id
                && data.manager?.id !== currentUser.id)
              || !canDo('users', 'single'),
          }"
          class="flex flex-shrink-1 align-items-center text-gray-900 cursor-pointer hover:text-gray-600"
        >
          <Avatar
            class="mr-2 relative"
            :class="{ 'bg-primary': !data.picture }"
            size="large"
            shape="circle"
          >
            <img
              v-if="data.picture"
              class="text-sm"
              :src="getAttachmentUrl(data.picture.path)"
              style="vertical-align: middle;"
              alt="Profile Picture"
            >
            <template v-else>
              {{ initials(fullName(data) as string) }}
            </template>
            <CommonUserStatus :user="data" />
          </Avatar>
          <div class="flex flex-column flex-1">
            <span
              class="user-name-not-active text-primary font-medium"
              :class="{
                'text-gray-300 opacity-50': !data.isActive,
              }"
            >{{ fullName(data) }}
            </span>
            <span
              v-if="data.isOwner && data.designation === null"
              class="user-designation text-blue-300"
            >
              Managing Partner</span>
            <span v-else class="user-designation text-blue-300">{{
              data.designation?.name
            }}</span>
          </div>
        </router-link>
      </template>
    </Column>
    <Column header="Reporting Manager" sort-field="manager.firstName">
      <template #body="{ data }">
        <div v-if="data.manager">
          <span class="font-medium text-primary">{{
            fullName(data.manager)
          }}</span>

          <span
            v-if="data.manager.designation"
            class="user-designation block text-blue-300"
          >{{ data.manager.designation?.name }}
          </span>
        </div>

        <div v-else class="text-primary font-medium">
          {{ 'Self' }}
        </div>
      </template>
    </Column>
    <Column header="Email">
      <template #body="{ data }">
        <div class="space-y-1.5">
          <div v-if="data.email" class="flex align-items-center break-all">
            <a
              :href="`mailto:${data.email}`"
              class="flex align-items-center"
              :aria-label="data.email"
            >
              <!-- <Icon icon="fa6-solid:envelope" class="text-xl mr-2"/> -->
              {{ data.email }}
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
          <div
            v-if="metaFilter(data.meta, 'mobile')"
            class="flex align-items-center"
          >
            <a
              :href="`tel:${metaFilter(data.meta, 'mobile')}`"
              class="flex align-items-center"
              :aria-label="metaFilter(data.meta, 'mobile')"
            >
              <!-- <Icon icon="fa6-solid:mobile-screen-button" class="text-xl mr-2"/> -->
              {{ metaFilter(data.meta, 'mobile') }}
            </a>
          </div>
          <div
            v-else-if="metaFilter(data.meta, 'phone')"
            class="flex align-items-center"
          >
            <a
              :href="`tel:${metaFilter(data.meta, 'phone')}`"
              class="flex align-items-center"
              :aria-label="metaFilter(data.meta, 'phone')"
            >
              <!-- <Icon icon="fa6-solid:phone" class="text-xl mr-2"/> -->
              {{ metaFilter(data.meta, 'phone') }}
            </a>
          </div>
          <div v-else>
            {{ 'No Mobile or Phone Added' }}
          </div>
        </div>
      </template>
    </Column>
    <Column class="text-center w-2" sortable field="assignedEntities">
      <template #header>
        <div class="text-center">
          Active Tasks
        </div>
      </template>
      <template #body="slotProps">
        <div class="text-center">
          <span class="text-gray-900">
            {{ slotProps.data._count.assignedEntities }}
          </span>
        </div>
      </template>
    </Column>
    <Column class="text-center w-2">
      <template #header>
        <div class="text-center">
          OverDue Tasks
        </div>
      </template>
      <template #body="slotProps">
        <div class="w-full text-center">
          <span class="text-gray-900">
            {{ slotProps.data.assignedEntities.length }}
          </span>
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<style lang="scss">
.user-name-not-active {
  border-radius: 1rem !important;
}
</style>
