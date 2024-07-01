<script setup lang="ts">
import type { Client, CommonClientService } from '@/types/client.type';
import { useQueryClient } from 'vue-query';

const props = withDefaults(
  defineProps<{
    id: string;
    clientServices: Partial<CommonClientService>[];
  }>(),
  {
    clientServices: () => [],
  }
);

const emit = defineEmits<{
  (event: 'details', state: { name: string }, federal: boolean): void;
}>();

const clientDetails: Client = inject('clientDetails') as Client;
const disabledTooltip = inject('disabledTooltip');
const canDoActions = inject('canDoActions');

const { id } = toRefs(props);
const federalList = ref([
  {
    name: 'Federal',
  },
]);
const queryClient = useQueryClient();
const { defaultBreakpoints } = useCommonBreakPoints();
const { canAccessAllMenu } = usePermissions();
const { currentUser } = useCurrentUserData();

const selectedState = ref<{ name: string }>();
const openFederalModal = ref(false);

const updateRowClass = () => {
  if (props.clientServices) {
    return (
      (!props.clientServices?.length ? 'bg-red-600' : 'bg-blue-600') +
      ' text-white'
    );
  }
  return '';
};
</script>
<!-- eslint-disable vue/no-unused-vars -->
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
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
            clientServices && clientServices?.length
              ? clientServices?.length
              : 0
          } Project(s) -  ${
            clientServices && clientServices?.length > 0
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
            canAccessAllMenu ||
            clientDetails?.relationshipManager.id === currentUser.id
          "
          @click="emit('details', state, true)"
          class="cursor-pointer font-medium hover:text-blue-100 underline"
          :class="[{ 'opacity-50 pointer-events-none': !canDoActions }]"
        >
          {{
            clientServices && clientServices?.length > 0 ? 'Review' : 'Automate'
          }}
        </span>
      </span>
    </li>
  </ul>
  <Dialog
    :modal="true"
    appendTo="body"
    v-model:visible="openFederalModal"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    :contentClass="'border-round-bottom-md'"
    key="federal"
  >
    <template #header>
      <div class="text-xl font-medium mb-1">Automation</div>
    </template>
    <ClientsAddUpdateServiceForm
      key="federal"
      :state="selectedState"
      :review="!!(clientServices && clientServices?.length > 0)"
      :federal="true"
      :clientName="clientDetails?.name"
      @refresh="
        queryClient.invalidateQueries('client-federal-services-list');
        if (clientServices && clientServices?.length === 0) {
          openFederalModal = false;
        }
      "
    />
  </Dialog>
</template>
