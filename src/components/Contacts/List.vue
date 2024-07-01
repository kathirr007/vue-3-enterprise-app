<script setup lang="ts">
import { useQuery } from 'vue-query';
import type { User } from '@/types/teams.type';
import type { UserContact } from '@/types/contacts.type';

const props = withDefaults(
  defineProps<{
    hideFilters?: boolean;
    disabledFilters?: string[];
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

const router = useRouter();
const route = useRoute();
const { isLarge } = useCommonBreakPoints();
const { currentUser } = useCurrentUserData();
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
  doesFiltersHasValues,
  queryFilters,
  querySortBy,
  tableRecords,
  toggleFilters,
  isFiltersVisible
} = useDataTableUtils();
const clientIdQuery = ref(route.query.clientId);
const appMenuControls = allMenuControls;
const { getAll } = useContacts();
const selectedClient = ref();

const { isLoading: loadingTeams, data: contactsData } = useQuery(
  ['contacts-list', selectedClient],
  () => {
    return getAll({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value,
      sortBy: querySortBy.value,
      clientId: selectedClient.value as string
    });
  },
  {
    onSuccess: (data) => {
      tableRecords.value = data;
    }
  }
);

const { data: filterData, applyFilter } = useFilterColumns();

function handleClientPageRedirect(data: UserContact) {
  const clientIds = data.userClients?.map(({ client }) => client.id);
  applyFilter('ClientIds', clientIds.length ? [...clientIds] : undefined);
  const preparedFilters = useEncodeFilterData(filterData);

  router.push({
    name: 'admin-clients',
    query: {
      filters: preparedFilters
    }
  });
}

watchEffect(() => {
  if (route && clientIdQuery.value) {
    selectedClient.value = clientIdQuery.value;
  }
});
</script>

<template>
  <DataTable
    v-model:filters="filters"
    :value="contactsData?.results"
    :total-records="contactsData?.total"
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
            placeholder: isLarge ? `Search ${$tConfig('CONTACT')}s` : `${$tConfig('CONTACT')}s`,
          }"
        />
        <div>
          <Button
            v-if="!hideFilters"
            type="button"
            :icon="doesFiltersHasValues ? 'pi pi-filter-slash' : 'pi pi-filter'"
            class="p-button-icon-only p-button-rounded"
            :class="[{ 'p-button-danger': doesFiltersHasValues }]"
            @click="toggleFilters(!!doesFiltersHasValues)"
          />
          <!-- <a
            href="https://brightreturn.com/kb/manage-project-team-in-cpa-firm"
            target="_blank"
          >
            <Button
              type="button"
              icon="pi pi-question-circle text-lg"
              v-tooltip.top="'Need Help'"
              class="p-button-icon-only p-button-rounded ml-2"
            />
          </a> -->
        </div>
      </div>
      <div v-if="isFiltersVisible && !hideFilters" class="my-2">
        <ContactsFilter
          ref="filtersRef"
          :filters="queryFilters"
          :disabled-filters="disabledFilters"
        />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No {{ `${$tConfig('CONTACT').toLowerCase()}` }} record found.
      </div>
    </template>
    <Column field="name" header="Name" class="w-3" sort-field="firstName">
      <template #body="{ data }">
        <router-link
          :to="{ name: 'admin-contacts-id', params: { id: data.id } }"
          :class="{
            'pointer-events-none': !canDo('contacts', 'single'),
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
          </div>
        </router-link>
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
              <Icon icon="fa6-solid:envelope" class="text-xl mr-2" />
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
              <Icon
                icon="fa6-solid:mobile-screen-button"
                class="text-xl mr-2"
              />
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
    <Column class="text-center w-2" field="company">
      <template #header>
        <div class="text-center">
          Company ({{ `${$tConfig('CLIENT')}` }}s)
        </div>
      </template>
      <template #body="{ data }">
        <div class="text-center">
          <span
            class="text-gray-900"
            :class="
              data._count?.userClients > 0
                ? 'font-medium cursor-pointer hover:underline'
                : 'pointer-events-none'
            "
            @click="handleClientPageRedirect(data)"
          >
            {{ data._count?.userClients }}
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
