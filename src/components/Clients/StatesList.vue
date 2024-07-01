<script setup lang="ts">
import type { CommonClientState } from '@/types/client.type';

const props = defineProps<{
  id: string;
  states: CommonClientState[];
}>();

const emit = defineEmits<{
  (event: 'details', state: CommonClientState, federal: boolean): void;
}>();

const clientDetails = inject<any>('clientDetails', () => null);

const disabledTooltip = inject('disabledTooltip');
const canDoActions = inject('canDoActions');

const { canAccessAllMenu } = usePermissions();
const { currentUser } = useCurrentUserData();
const { states } = toRefs(props);
// const clientDetails: Client = inject('clientDetails') as Client;
// const { defaultBreakpoints } = useCommonBreakPoints();
// const { filters } = useDatatableFilters();
// const { isLarge } = useCommonBreakPoints();
// const selectedState = ref<CommonClientState>();
// const openClientStateModal = ref(false);

const updateRowClass = (data: CommonClientState) =>
  (!data.serviceCount ? 'bg-red-600' : 'bg-blue-600 text-white') +
  ' text-white';
</script>
<!-- eslint-disable vue/no-unused-vars -->

<template>
  <ul class="space-y-2.5">
    <li
      v-for="(state, index) in states"
      :key="index"
      class="p-3 flex justify-content-between align-items-center md:w-6 border-round-xs"
      :class="updateRowClass(state)"
    >
      <span>
        {{ state.name }} -
        {{
          `${
            state?.serviceCount && state.serviceCount ? state?.serviceCount : 0
          } Project(s) -  ${
            state?.serviceCount ? 'Automated' : 'Pending Automation'
          }`
        }}
      </span>
      <span
        v-if="
          canAccessAllMenu ||
          clientDetails?.relationshipManager.id === currentUser.id
        "
        v-tooltip.top="`${!canDoActions ? disabledTooltip : ''}`"
      >
        <span
          @click="emit('details', state, false)"
          class="cursor-pointer font-medium hover:text-blue-100 underline"
          :class="[{ 'opacity-50 pointer-events-none': !canDoActions }]"
        >
          {{ state.serviceCount ? 'Review' : 'Automate' }}</span
        >
      </span>
    </li>
  </ul>
</template>
