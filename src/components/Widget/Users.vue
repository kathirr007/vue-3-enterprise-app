<script setup lang="ts">
import type { Attachment } from '@/types/attachment.type';
import type { User } from '@/types/teams.type';

const router = useRouter();
const props = withDefaults(
  defineProps<{
    users: User[];
    loading?: boolean;
  }>(),
  {
    users: () => [],
  }
);
const items = computed(() => props.users?.slice(0, 7) || []);
const { fullName, initials } = useVueFilters();
const { getAttachmentUrl } = useAttachments();
const { canDo } = usePermissions();
</script>

<template>
  <div class="box-shadow card team widget-radius">
    <div class="card-header">
      <div class="card-title">
        <h6>My Team</h6>
        <p class="subtitle mt-3">{{ users?.length }} active team members</p>
      </div>
    </div>
    <div class="peoples">
      <i class="pi pi-spinner pi-spin" v-if="props.loading" />
      <div
        v-else
        v-for="(user, index) in items"
        :key="index"
        v-tooltip.top="`${fullName(user)}`"
        class="cursor-pointer"
        :class="{ 'pointer-events-none': !canDo('users', 'single') }"
        @click="
          router.push({ name: 'admin-teams-id', params: { id: user.id } })
        "
      >
        <div
          v-if="!user.picture"
          class="no-picture"
          style="background: #ffc3a2"
        >
          <span>{{ initials(fullName(user) as string) }}</span>
        </div>
        <img
          v-else
          :src="`${getAttachmentUrl(
            (user.picture as Attachment).path as string
          )}`"
          :alt="`${fullName(user)}`"
        />
      </div>
      <div v-if="users?.length > 7" class="no-picture">
        <span>
          <router-link
            :to="{ name: 'admin-teams-hrms' }"
            class="font-normal text-900 hover:text-500 mb-5"
            >+{{ users?.length - 7 }}</router-link
          >
        </span>
      </div>
    </div>
  </div>
  <!-- <div class="widget-shadow">
  </div> -->
</template>

<style lang="scss" scoped>
.team {
  display: -ms-flexbox;
  display: flex;
  -ms-flex-align: center;
  align-items: center;
  -ms-flex-pack: justify;
  justify-content: space-between;
}
.team .card-header {
  padding: 0;
  min-width: 70px;
  min-height: 65px;
}
.team .peoples {
  display: -ms-flexbox;
  display: flex;
  -ms-flex-align: center;
  align-items: center;
  flex-wrap: wrap;
}
.team .peoples img {
  -moz-border-radius: 10px;
  -webkit-border-radius: 10px;
  border-radius: 10px;
  margin: 8px 8px;
  width: 32px;
  height: 32px;
  object-fit: cover;
}
.team .peoples .no-picture {
  cursor: pointer;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-align: center;
  align-items: center;
  -ms-flex-pack: center;
  justify-content: center;
  -moz-border-radius: 10px;
  -webkit-border-radius: 10px;
  border-radius: 10px;
  margin: 8px 8px;
  width: 32px;
  height: 32px;
  background: rgba(41, 50, 65, 0.1);
  color: rgba(41, 50, 65, 0.8);
  font-size: 12px;
  -moz-transition: background 0.2s;
  -o-transition: background 0.2s;
  -webkit-transition: background 0.2s;
  transition: background 0.2s;
}
.team .peoples .no-picture:hover {
  background: rgba(41, 50, 65, 0.2);
}
</style>
