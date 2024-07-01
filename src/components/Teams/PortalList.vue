<script setup lang="ts">
import { useQuery } from 'vue-query';
import type { UserPortal } from '@/types/teams.type';

const props = defineProps<{
  clientId?: string;
}>();

const teamList = ref<UserPortal[]>();
const { getAttachmentUrl } = useAttachments();
const { isLarge } = useCommonBreakPoints();
const { fullName, initials } = useVueFilters();
const { metaFilter } = useUtilityFns();

const { isLoading: loadingTeams, data } = useQuery(
  'client-portal-teams-list',
  async () => {
    return await useUserPortalList();
  },
  {
    onSuccess: (data: UserPortal[]) => {
      teamList.value = data.map((item: UserPortal) => ({
        ...item,
        role: item.role,
        user: item.user,
      }));
    },
  }
);

const getAdmin = (val: string) => {
  if (val) {
    return val.charAt(0).toUpperCase() + val.substring(1);
  }
};
const { filters, searchText } = useDatatableFilters();
</script>

<template>
  <DataTable
    :value="teamList"
    :loading="loadingTeams"
    responsiveLayout="scroll"
    breakpoint="768px"
    v-model:filters="filters"
    :globalFilterFields="[
      'firstName',
      'lastName',
      'email',
      'user.firstName',
      'user.lastName',
      'user.email',
    ]"
    :paginator="true"
    :rows="15"
    :alwaysShowPaginator="false"
    :page-link-size="isLarge ? 5 : 3"
  >
    <template #header>
      <div class="flex justify-content-end">
        <div class="p-input-icon-left mr-auto">
          <i class="pi pi-search" />
          <InputText
            aria-label="Search List"
            v-model="searchText"
            placeholder="Search Team Members"
            type="search"
          />
        </div>
      </div>
    </template>
    <template #empty>
      <div class="text-center">No teams record found.</div>
    </template>
    <Column header="Name" class="w-3">
      <template #body="{ data }">
        <div
          class="flex flex-shrink-1 align-items-center text-gray-900 hover:text-gray-600"
        >
          <Avatar
            class="mr-2 relative"
            :class="{ 'bg-primary': !data.user.picture }"
            size="large"
            shape="circle"
          >
            <img
              v-if="data.user.picture"
              class="text-sm"
              :src="getAttachmentUrl(data.user.picture.path)"
              style="vertical-align: middle"
              :alt="`Profile Picture`"
            />
            <template v-else>
              {{ initials(fullName(data.user) as string) }}
            </template>
            <CommonUserStatus
              :user="{ ...data.user, isActive: data.isActive }"
            />
          </Avatar>
          <div class="flex flex-column flex-1">
            <span
              class="user-name-not-active"
              :class="{
                'bg-gray-300 opacity-50  py-1 px-2 ':
                  !data.isActive && !data.user.isVerified,
              }"
              >{{ fullName(data.user) }}
            </span>
          </div>
        </div>
      </template>
    </Column>
    <Column class="w-2" header="Profile">
      <template #body="{ data }">
        <strong class="user-team block">{{ getAdmin(data.role.name) }} </strong>
      </template>
    </Column>
    <Column class="w-3" header="Email">
      <template #body="{ data }">
        <div class="space-y-1.5">
          <div class="flex align-items-center break-all">
            <a
              :href="`mailto:${data.user.email}`"
              class="flex align-items-center"
              :aria-label="data.user.email"
            >
              <!-- <Icon icon="fa6-solid:envelope" class="text-xl mr-2"/> -->
              {{ data.user.email }}
            </a>
          </div>
        </div>
      </template>
    </Column>
    <Column class="w-3" header="Mobile">
      <template #body="{ data }">
        <div class="space-y-1.5">
          <div
            class="flex align-items-center"
            v-if="metaFilter(data.user.meta, 'mobile')"
          >
            <a
              :href="`tel:${metaFilter(data.user.meta, 'mobile')}`"
              class="flex align-items-center"
              :aria-label="metaFilter(data.user.meta, 'mobile')"
            >
              <!-- <Icon icon="fa6-solid:mobile-screen-button" class="text-xl mr-2"/> -->
              {{ metaFilter(data.user.meta, 'mobile') }}
            </a>
          </div>
          <div
            class="flex align-items-center"
            v-else-if="metaFilter(data.user.meta, 'phone')"
          >
            <a
              :href="`tel:${metaFilter(data.user.meta, 'phone')}`"
              class="flex align-items-center"
              :aria-label="metaFilter(data.user.meta, 'phone')"
            >
              <!-- <Icon icon="fa6-solid:phone" class="text-xl mr-2"/> -->
              {{ metaFilter(data.user.meta, 'phone') }}
            </a>
          </div>
        </div>
      </template>
    </Column>
    <Column class="w-1" header="Authorized Member">
      <template #body="{ data }">
        <span class="align-items-center"
          >{{ data.isOwner ? 'Yes' : 'No' }}
        </span>
      </template>
    </Column>
  </DataTable>
</template>
<style lang="scss">
.user-name-not-active {
  border-radius: 1rem !important;
}
</style>
