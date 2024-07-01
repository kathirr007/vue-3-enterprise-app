<script setup lang="ts">
const props = defineProps<{
  resources: any;
}>();

const { titleCase } = useVueFilters();
</script>

<template>
  <div class="w-full">
    <table class="w-full">
      <tr class="bg-primary font-semibold text-xl w-full flex p-2">
        <td class="flex-1 flex justify-content-start">
          Feature
        </td>
        <td class="w-3 flex justify-content-center">
          Current Usage
        </td>
        <td class="w-4 flex justify-content-center">
          Limit
        </td>
      </tr>

      <div v-for="data in resources" :key="data.feature" class="row">
        <div class="flex p-2 w-full">
          <div
            class="flex-1 font-semibold text-lg"
            :data-title="`Feature: ${data.feature}`"
          >
            {{ titleCase(data.resource.split('_').join(' ')) }}
          </div>
          <div
            class="w-3 font-semibold text-lg justify-content-center flex"
            :data-title="`Current Usage: ${data.currentUsage}`"
          >
            {{
              data.orgSubscriptionResourceUsages[0]
                ? data.orgSubscriptionResourceUsages[0].usage
                : 0
            }}
          </div>
          <div
            class="w-4 font-semibold text-lg flex justify-content-center"
            :data-title="`Limit: ${data.limit}`"
          >
            {{ data.limit }}
            <span v-if="data.interval === 'MONTHLY'" class="ml-1">
              / month</span>
            <span v-if="data.interval === 'DAILY'" class="ml-1">
              / {{ data.resource === 'DATA_EXTRACTION' ? 'pages' : '' }} day</span>
            <span v-if="data.resource === 'DOCUMENT_MANAGEMENT'" class="ml-1">KB</span>
          </div>
        </div>
      </div>
    </table>
  </div>
</template>

<style scoped>
.row {
  background: #f6f6f6;

  &:nth-of-type(odd) {
    background: #e9e9e9;
  }
}
</style>
