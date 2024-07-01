<script setup lang="ts">
import type { Client } from '@/types/client.type';
import type { MetaObj } from '@/types/common.type';
import type { FullNameObj } from '@/types/teams.type';

const props = defineProps<{
  clientId?: string;
  clientDetails?: Client;
}>();

const route = useRoute();
const { fullName } = useVueFilters();
const { metaFilter } = useUtilityFns();
</script>

<template>
  <div class="box-shadow card mx-auto">
    <h6 class="text-500 font-medium">
      {{ `${$tConfig('CLIENT')}` }} Information
    </h6>
    <div class="card-container">
      <h1 class="mb-2">
        <div class="flex flex-column font-normal md:flex-row text-base mt-1">
          <div v-if="clientDetails" class="inline-flex align-items-center">
            <span class="border-gray-400 text-sm"> Tags: </span>

            <div
              v-if="clientDetails && clientDetails?.tags"
              class="flex flex-wrap gap-1 ml-1"
            >
              <CommonTags
                :current-id="clientId"
                :data="clientDetails"
                tag-type="CLIENT"
              />
            </div>
          </div>
        </div>
        <div class="flex flex-column font-normal md:flex-row text-base mt-1">
          <span
            v-if="clientDetails?.relationshipManager"
            class="pr-2 border-gray-400 text-sm"
          >
            Relationship Manager:
            {{ fullName(clientDetails?.relationshipManager as FullNameObj) }}
          </span>
          <!-- <span class="hidden md:inline-block mx-2">|</span> -->
        </div>
      </h1>
      <div
        v-if="clientDetails?.businessEntity?.name"
        class="w-full inline-flex align-items-center space-x-2.5"
      >
        <i class="pi pi-briefcase text-2xl text-primary text-center" />
        <span class="text-gray-800 text-lg flex-1">
          {{ clientDetails?.businessEntity?.name }}
        </span>
      </div>
      <div
        v-if="clientDetails?.balance"
        class="w-full inline-flex align-items-center space-x-2.5"
      >
        <i class="pi pi-dollar text-2xl text-primary text-center" />
        <span class="text-gray-800 text-lg flex-1">
          {{ metaFilter(clientDetails?.meta as MetaObj[], 'balance') }}
        </span>
      </div>
      <div
        v-if="clientDetails?.mobile || clientDetails?.email"
        class="flex-column md:flex-row w-full inline-flex align-items-start md:align-items-center space-y-2.5 md:space-y-0 md:space-x-2.5"
      >
        <div
          v-if="clientDetails?.mobile"
          class="inline-flex align-items-center mr-2"
        >
          <a
            :href="`tel:${metaFilter(
              clientDetails?.meta as MetaObj[],
              'mobile',
            )}`"
            class="flex align-items-center space-x-2.5"
            :aria-label="metaFilter(clientDetails?.meta as MetaObj[], 'mobile')"
          >
            <Icon
              class="text-2xl text-primary"
              icon="fa6-solid:mobile-screen-button"
            />
            <span class="text-gray-800 text-lg flex-1">{{
              metaFilter(clientDetails?.meta as MetaObj[], 'mobile')
            }}</span>
          </a>
        </div>
        <div v-if="clientDetails?.email" class="inline-flex align-items-center">
          <a
            :href="`mailto:${clientDetails?.email}`"
            class="flex align-items-center space-x-2.5"
            :aria-label="clientDetails?.email"
          >
            <Icon class="text-2xl text-primary" icon="fa6-solid:envelope" />
            <span class="text-gray-800 text-lg flex-1 break-all">{{
              clientDetails?.email
            }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
