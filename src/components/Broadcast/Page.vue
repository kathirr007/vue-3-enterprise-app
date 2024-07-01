<script setup lang="ts">
import type { TabViewChangeEvent } from 'primevue/tabview';
import TabView from 'primevue/tabview';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import { useRouteQuery } from '@vueuse/router';
import type { Broadcast, BroadcastTemplate } from '@/types/broadcast.type';
import router from '@/router';

const props = defineProps<{
  broadcastTo: string;
}>();

const { broadcastTo } = toRefs(props);
provide('broadcastTo', broadcastTo.value);
const type = useRouteQuery<'create' | 'revisit' | null>('type');
const templateId = useRouteQuery<string>('templateId');
const queryActiveIndex = useRouteQuery<string>('activeIndex');
const { initToast } = useToasts();
const { titleCase } = useVueFilters();
const { canDo, featureSubscribed } = usePermissions();
const { isPortalUser } = useCurrentUserData();

const { activeIndex, activeTabIndex, tabRef, handleTabChange } = useSteps(
  'admin-broadcasts-type'
);
const queryClient = useQueryClient();
const { defaultBreakpoints } = useCommonBreakPoints();
const isBroadcastDialogVisible = ref(false);
const currentBroadcastOp = ref<'update' | 'clone'>('update');
const broadcastHeader = ref(`Create ${broadcastTo.value} Broadcast`);
const selectedTemplate = ref<BroadcastTemplate>();
const selectedBroadcast = ref<Broadcast>();
const fetchedBroadcast = ref<Broadcast>();
const isCreateOrRevisit = ref(false);
const currentRoute = useRoute();

async function resetBroadcast() {
  isBroadcastDialogVisible.value = false;
  fetchedBroadcast.value = undefined;
  selectedBroadcast.value = undefined;
  broadcastHeader.value = `Create ${broadcastTo.value} Broadcast`;
  currentBroadcastOp.value = 'update';
  queryClient.invalidateQueries('broadcasts-list');
}

function handleBroadcastUpdate(data: BroadcastTemplate,
  op: 'update' | 'clone') {
  selectedBroadcast.value = { ...data } as Broadcast;
  currentBroadcastOp.value = op;
  currentBroadcastOp.value === 'clone'
    ? (broadcastHeader.value = `Clone Email`)
    : (broadcastHeader.value = `Update Email`);
  queryClient.invalidateQueries('broadcast-details');
  isBroadcastDialogVisible.value = true;
}
function handleTemplateDelete(id: string) {
  deleteBroadcastTemplate(id);
}
function handleBroadcasteDelete(id: string) {
  deleteBroadcast(id);
}

function sendFetchedBroadcast() {
  if (currentBroadcastOp.value === 'clone') {
    delete fetchedBroadcast.value?.id;
  }
  return fetchedBroadcast.value ? fetchedBroadcast.value : undefined;
}

const { mutateAsync: deleteBroadcastTemplate } = useMutation(
  (id: string) => {
    return useBroadcastTemplateDelete(id);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Delete',
        severity: 'error',
        summary: 'Delete Broadcast Template',
        detail: 'Broadcast Template Deleted Successfully'
      });
      queryClient.invalidateQueries('broadcast-templates-list');
    }
  }
);
const { mutateAsync: deleteBroadcast } = useMutation(
  (id: string) => {
    return useBroadcastDelete(id);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Delete',
        severity: 'error',
        summary: 'Delete Broadcast',
        detail: 'Broadcast Deleted Successfully'
      });
      queryClient.invalidateQueries('broadcasts-list');
    }
  }
);

/* const { data: broadcastLimits } = useQuery('broadcast-limit', () => {
  return getResourceLimits({ resource: ResourceType['bulk email'] });
}, {
  enabled: broadcastTo.value === 'client'
});

const broadcastResource = computed(() => {
  const limitComputed = broadcastLimits.value?.[0].limit === -1 ? 0 : broadcastLimits.value?.[0].limit;
  const usageComputed = broadcastLimits.value?.[0].orgSubscriptionResourceUsages && broadcastLimits.value?.[0].orgSubscriptionResourceUsages.length > 0 ? broadcastLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
  return { limit: limitComputed, usage: usageComputed };
}); */

const { resourceUsage: broadcastResource } = useUsageLimit({
  enabled: broadcastTo.value === 'client',
  isPortalUser: isPortalUser.value,
  resource: 'bulk email',
  queryKey: 'broadcast-limit'
});

const createBroadcastTooltip = computed(() => {
  if (broadcastTo.value === 'client') {
    if (broadcastResource.value?.limit && (broadcastResource.value?.usage >= broadcastResource.value?.limit)) {
      return `Can't create more than available limit ${broadcastResource.value?.limit}`;
    }
    else if (!(broadcastResource.value?.usage >= broadcastResource.value?.limit)) {
      return `Available limit of ${broadcastResource.value?.limit} emails already created`;
    }
    else {
      return 'Compose';
    }
  }
  else {
    return 'Compose';
  }
});

useQuery(
  'broadcast-details',
  () => {
    return selectedBroadcast.value
      ? useBroadcastDetails(selectedBroadcast.value?.id as string)
      : undefined;
  },
  {
    onSuccess: (data) => {
      fetchedBroadcast.value = data;
    }
  }
);
function handleTemplateTitle() {
  return type.value === 'create'
    ? 'Compose Email Template'
    : titleCase(
      isCreateOrRevisit.value
        ? `${selectedTemplate?.value?.name ?? ''}`
        : 'Email Templates'
    );
}
function handleTitle() {
  return type.value === 'create'
    ? 'Compose Email'
    : titleCase(
      isCreateOrRevisit.value ? `${selectedBroadcast?.value?.name}` : 'Emails'
    );
}

function handleTabClick(event: TabViewChangeEvent) {
  router.push({
    name: 'admin-broadcasts-type',
    params: { type: broadcastTo.value },
    query: { activeIndex: event.index }
  });
}
watchEffect(() => {
  if (activeIndex.value) {
    activeTabIndex.value = +activeIndex.value;
  }
});

onMounted(() => {
  if (queryActiveIndex.value) {
    activeTabIndex.value = Number(queryActiveIndex.value);
  }
  else activeTabIndex.value = 0;
  if (type.value) {
    isCreateOrRevisit.value = true;
  }
});

// watch(
//   () => [currentRoute, broadcastTemplatesList.value],
//   ([route, templates]) => {
//     if (route && broadcastTemplatesList.value) {
//       if (templateId.value) {
//         selectedTemplate.value = (templates as BroadcastTemplate[])?.find(
//           (template: BroadcastTemplate) => template.id === templateId.value
//         );
//       }
//     }
//   },
//   { immediate: true, deep: true }
// );
</script>

<template>
  <div v-if="featureSubscribed('bulk_email', `email_to_${broadcastTo}`) === false" class="card">
    <Common426 :feature="`bulk email to ${broadcastTo}`" />
  </div>
  <div v-else>
    <TabView
      ref="tabRef"
      v-model:activeIndex="activeTabIndex"
      lazy
      @tab-click="handleTabClick"
    >
      <TabPanel header="Emails">
        <CommonPage :title="handleTitle()">
          <!-- <template v-if="!isCreateOrRevisit" #description>
          {{
            `Manage Your Broadcasts to your ${
              broadcastTo === 'team' ? 'Team Member' : 'Client'
            }(s).`
          }}
        </template>
        <template v-else #description>
          {{
            `${titleCase(type)} Broadcast ${
              (selectedTemplate?.name as unknown as string) || ''
            }`
          }}
        </template> -->
          <template #actions>
            <span
              v-tooltip.left="createBroadcastTooltip"
            >
              <Button
                v-if="canDo('broadcasts', 'create') && !isCreateOrRevisit" icon="pi pi-plus"
                class="p-button-rounded"
                :disabled="broadcastTo === 'client' && broadcastResource.limit && broadcastResource.usage >= broadcastResource.limit"
                @click="
                  router.push({
                    name: 'admin-broadcasts-type',
                    params: { type: broadcastTo },
                    query: { type: 'create', activeIndex: '0' },
                  })
                "
              />
            </span>
          </template>
          <div class="card">
            <BroadcastList
              v-if="!isCreateOrRevisit"
              @update="(() => handleBroadcastUpdate)()"
              @delete="handleBroadcasteDelete"
            />
            <BroadcastAddBroadcast
              v-else
              :broadcast="sendFetchedBroadcast()"
              :current-op="currentBroadcastOp"
              @success="resetBroadcast"
            />
          </div>
        </CommonPage>
      </TabPanel>
      <TabPanel header="Templates">
        <CommonPage :title="handleTemplateTitle()">
          <!-- <template v-if="!isCreateOrRevisit" #description>
          List of all the existing templates. You can also add more templates.
        </template>
        <template v-else #description>
          {{
            `${titleCase(type)} Template ${
              (selectedTemplate?.name as unknown as string) || ''
            }`
          }}
        </template> -->
          <template #actions>
            <Button
              v-if="
                !isCreateOrRevisit && canDo('broadcast_templates', 'create')
              "
              v-tooltip.left="'Compose Template'"
              icon="pi pi-plus"
              class="p-button-rounded"
              @click="
                router.push({
                  name: `admin-broadcasts-type`,
                  params: { type: broadcastTo },
                  query: { type: 'create', activeIndex: '1' },
                })
              "
            />
          </template>

          <div class="card">
            <BroadcastTemplateList
              v-if="!isCreateOrRevisit"
              @delete="handleTemplateDelete"
            />

            <BroadcastTemplateCreate
              v-else
              :template="templateId"
              :revisit="type === 'revisit'"
              @template="(data: BroadcastTemplate) => (selectedTemplate = data)"
            />
          </div>
        </CommonPage>
      </TabPanel>
    </TabView>
    <Dialog
      v-model:visible="isBroadcastDialogVisible"
      :modal="true"
      append-to="body"
      :breakpoints="defaultBreakpoints"
      :style="{ width: '60vw' }"
      content-class="border-round-bottom-md"
      @hide="resetBroadcast"
    >
      <template #header>
        <span class="capitalize p-dialog-title">{{ broadcastHeader }}</span>
      </template>
      <CommonLoading v-if="!fetchedBroadcast" />
      <BroadcastAddBroadcast
        v-else
        :broadcast="sendFetchedBroadcast()"
        :current-op="currentBroadcastOp"
        @success="resetBroadcast"
      />
    </Dialog>
  </div>
</template>

<style lang="scss" scoped></style>
