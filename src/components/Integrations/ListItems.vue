<script setup lang="ts">
import type { Integration } from '@/types/integrations.type';

const props = defineProps<{
  integrations: Integration[];
  selectedIntegrations?: Integration[];
  isCardClickable?: boolean;
  isButton?: boolean;
  integrationLoading?: boolean;
  canCallIntegrations?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', data: Integration): void;
}>();

const { integrationIcons, recommendedIntegrations } = useIntegrations();
const { allOrgIntegrationIds, isFeatureIntegrated } = usePermissions(
  props.canCallIntegrations
);

const selectedIntegration = ref<Integration>();

function isCardSelectable(card: Integration) {
  return !props.selectedIntegrations?.map((item: Integration) => item.id).includes(card.id);
}
function handleClick(integration: Integration) {
  if (orgType.value === 'BUSINESS' || !isCardSelectable(integration)) {
    return false;
  }
  emit('select', { ...integration, isCardSelected: true });
  selectedIntegration.value = integration;
}

function isModuleIntegrated(integration: Integration) {
  const isFeatIntegrated = isFeatureIntegrated(
    [`${integration.id.toLowerCase()}`],
    allOrgIntegrationIds.value
  );
  if (integration.isExternal) {
    return integration.isCompleted && isFeatIntegrated;
  }
  return isFeatIntegrated;
}
</script>

<template>
  <div class="flex flex-wrap gap-3 overflow-y-auto">
    <div
      v-for="(integration, index) in integrations"
      :key="index"
      class="w-96 p-0 m-0 card integration gap-2"
      @click="if (isCardClickable) handleClick(integration);"
    >
      <div
        class="border-3 border-round border-round-lg p-3 flex flex-column relative align-items-center justify-content-center"
        :class="{
          'cursor-pointer integration-container': isCardClickable,
          'border-primary bg-primary text-white': integration.isCardSelected,
          'default-border-color': !integration.isCardSelected,
          'pointer-events-none': !isCardSelectable(integration),
        }"
      >
        <div class="icon-container">
          <img
            v-if="integrationIcons[integration.id]?.type === 'image'"
            :src="integrationIcons[integration.id]?.value"
            alt="integration-icon"
          >
          <Icon
            v-else-if="integrationIcons[integration.id]?.type === 'iconify'"
            :icon="integrationIcons[integration.id]?.value"
            class="text-7xl"
          />
          <Avatar
            v-else-if="integrationIcons[integration.id]?.type === 'avatar'"
            :label="integrationIcons[integration.id]?.value"
            size="large"
          />
          <span v-else-if="integrationIcons[integration.id]?.type === 'icon'" :class="integrationIcons[integration.id]?.iconClass">{{ integrationIcons[integration.id]?.value }}</span>
          <i
            v-else
            class="pi"
            :class="integrationIcons[integration.id]?.value"
          />
        </div>
        <div class="text-xl font-semibold text-center my-2">
          {{ integration.name }}
        </div>
        <div
          v-if="integration.description"
          class="text-center font-medium flex flex-1"
        >
          {{ integration.description }}
        </div>

        <div
          v-if="integration.isAiModule"
          class="absolute ai-module font-medium"
        >
          AI
        </div>
        <div
          v-if="recommendedIntegrations.includes(integration.id) && !isButton"
          class="absolute recommended font-medium text-sm bg-green-500"
        >
          <span> Recommended</span>
        </div>
        <div v-if="isButton" class="text-center font-md mt-3">
          <Button
            :label="isModuleIntegrated(integration) ? 'Integrated' : 'Start'"
            class="max-w-max mx-auto"
            :class="[
              {
                'bg-green-500 border-green-500':
                  isModuleIntegrated(integration),
              },
            ]"
            :disabled="
              !integration.isExternal && isModuleIntegrated(integration)
            "
            :loading="
              integrationLoading && selectedIntegration?.id === integration.id
            "
            @click.stop="handleClick(integration)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.integration {
  width: 250px;
  // min-height: 300px;
  aspect-ratio: 1/1;

  > div {
    height: auto;
    // box-sizing: content-box;
    min-height: 100%;
  }

  .integration-container {
    align-items: center;
    justify-content: center;
    transition: all 0.25s;

    &:hover {
      box-shadow: inset 0 0 10px 0 #26417082;
    }
  }
}

.card:last-child {
  margin-bottom: auto;
}

.icon-container {
  display: flex;
  align-items: start;
  justify-content: center;
  object-fit: cover;
}

.icon-container > img {
  width: 60px !important;
  aspect-ratio: 1/1 !important;
}

.ai-module {
  top: -2px;
  right: 20px;
  display: flex;
  align-items: start;
  justify-content: center;
  width: 30px;
  aspect-ratio: 1/1.5 !important;
  padding-top: 10px;
  clip-path: polygon(1% 0%, 1% 99%, 51% 78%, 99% 99%, 100% 0%);
  color: white;
  // background-color: $primaryColor;
  background-color: #f97316;
}

.recommended {
  top: 23px;
  left: -35px;
  display: flex;
  align-items: end;
  padding: 8px 30px;
  clip-path: polygon(23% 0, 77% 0, 100% 100%, 0% 100%);
  color: white;
  transform: rotate(-45deg);
}

.start-button {
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}
</style>
