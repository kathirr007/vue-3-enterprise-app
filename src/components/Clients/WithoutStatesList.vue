<script setup lang="ts">
import type { Client, CommonClientService } from '@/types/client.type';
import { useQueryClient } from 'vue-query';

const props = withDefaults(
  defineProps<{
    id: string;
    withoutStateServices?: Partial<CommonClientService>[];
  }>(),
  {
    withoutStateServices: () => []
  }
);

const emit = defineEmits<{
  (
    event: 'start-automate',
    state: { name: string },
    isWithoutState: boolean
  ): void;
}>();

const clientDetails: Client = inject('clientDetails') as Client;
const disabledTooltip = inject('disabledTooltip');
const canDoActions = inject('canDoActions');

const { id } = toRefs(props);
const federalList = ref([
  {
    name: 'Without State'
  }
]);
const queryClient = useQueryClient();
const { defaultBreakpoints } = useCommonBreakPoints();
const { canAccessAllMenu } = usePermissions();
const { currentUser } = useCurrentUserData();

const selectedState = ref<{ name: string }>();
const openFederalModal = ref(false);

function updateRowClass() {
  if (props.withoutStateServices) {
    return (
      `${!props.withoutStateServices?.length ? 'bg-red-600' : 'bg-blue-600'
      } text-white`
    );
  }
  return '';
}
</script>

<!-- eslint-disable vue/no-unused-vars -->
<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <ul>
    <li
      v-for="(state, index) in federalList"
      :key="index"
      class="p-3 flex justify-content-between align-items-center md:w-6 border-round-xs"
      :class="updateRowClass()"
    >
      <span>
        {{
          `${
            withoutStateServices && withoutStateServices?.length
              ? withoutStateServices?.length
              : 0
          } Project(s) - ${
            withoutStateServices && withoutStateServices?.length > 0
              ? 'Automated'
              : 'Pending Automation'
          }`
        }}
      </span>
      <span
        v-tooltip.top="`${!canDoActions ? (disabledTooltip as string) : ''}`"
      >
        <span
          v-if="
            canAccessAllMenu
              || clientDetails?.relationshipManager.id === currentUser.id
          "
          class="cursor-pointer font-medium hover:text-blue-100 underline"
          :class="[{ 'opacity-50 pointer-events-none': !canDoActions }]"
          @click="emit('start-automate', state, true)"
        >
          {{
            withoutStateServices && withoutStateServices?.length > 0
              ? 'Review'
              : 'Automate'
          }}
        </span>
      </span>
    </li>
  </ul>
  <Dialog
    key="federal"
    v-model:visible="openFederalModal"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <template #header>
      <div class="text-xl font-medium mb-1">
        Automation
      </div>
    </template>
    <ClientsAddUpdateServiceForm
      key="federal"
      :state="selectedState"
      :review="!!(withoutStateServices && withoutStateServices?.length > 0)"
      :federal="true"
      :client-name="clientDetails?.name"
      @refresh="
        queryClient.invalidateQueries('client-federal-services-list');
        if (withoutStateServices && withoutStateServices?.length === 0) {
          openFederalModal = false;
        }
      "
    />
  </Dialog>
</template>
