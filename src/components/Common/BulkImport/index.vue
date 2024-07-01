<script setup lang="ts">
import { parse } from 'papaparse';
import type { BulkImportConfig } from '@/types/bulkimport.type';

const props = defineProps<{
  config: BulkImportConfig;
  loading?: boolean;
  isBack?: boolean;
  importType: 'Clients' | 'Holidays';
  templateUrl: string;
}>();

const emits = defineEmits(['import', 'back']);

const { pluralize, replaceClient } = useVueFilters();

const stage = ref<number>(1);
const fileInput = ref<HTMLInputElement>();
const isProcessingFile = ref(false);
const isErrored = ref(false);
const errorMessage = ref();
const headers = ref<string[]>([]);
const rows = ref<Record<string, any>[]>([]);

// function resetComponent() {
//   stage.value = 1;
//   isProcessingFile.value = false;
//   isErrored.value = false;
//   errorMessage.value = undefined;
//   headers.value = undefined;
// }

function showFilePicker() {
  fileInput.value?.click();
}

function handleFileSelect() {
  const selectedFile = fileInput.value?.files?.[0];
  if (!selectedFile) {
    return;
  }

  isProcessingFile.value = true;
  parse<Record<string, any>>(selectedFile, {
    skipEmptyLines: true,
    header: true,
    complete: (result: any) => {
      headers.value = result.meta.fields as string[];
      rows.value = result.data.map((t: any) => {
        const newObj: any = {};
        for (const key in t) {
          newObj[key] = t[key].trim();
        }
        return newObj;
      });
      stage.value = 2;
    },
    error: (err: any) => {
      isErrored.value = true;
      errorMessage.value = err.message;
      isProcessingFile.value = false;
    }
  });
}
function handleImport(rows: Record<string, any>[]) {
  emits('import', rows);
}

const requiredFields = computed(() => {
  return props.config.columns
    .filter(column => column.required)
    .map(column => column.label);
});
</script>

<template>
  <div>
    <div v-if="stage === 1">
      <div>
        <p class="text-lg font-medium">
          Your can import all your {{ importType === 'Clients' ? `${pluralize($tConfig('CLIENT'))}` : importType }} using a CSV file. Follow the
          steps below
        </p>
        <ul class="flex flex-column row-gap-1">
          <li>
            Download {{ importType === 'Clients' ? `${pluralize($tConfig('CLIENT'))}` : importType }} Import Template -
            <a class="text-blue-500" :href="templateUrl" target="_blank">Download</a>
          </li>
          <li>Open downloaded CSV file in Excel</li>
          <li>Do not change any column names (1st line)</li>
          <li>
            Fill the template with the required information and save the file as
            CSV
          </li>
          <li>Upload the saved CSV file</li>
          <li v-if="requiredFields.length">
            <strong>{{ requiredFields.join(', ') }}</strong>
            {{ requiredFields.length > 1 ? 'are' : 'is' }} required field,
            insufficient data rows will be excluded.
          </li>
        </ul>
      </div>

      <h3 class="text-lg text-center font-medium my-2">
        Select a file to import
      </h3>
      <div class="flex-1 text-center">
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept=".csv"
          @change="handleFileSelect"
        >
        <Button
          class="text-white rounded-md border-blue-800"
          @click.prevent="showFilePicker"
        >
          Select File
        </Button>
      </div>
      <Button v-if="isBack" label="Back" @click="emits('back')" />
    </div>
    <div v-if="stage === 2">
      <CommonBulkImportMapper
        v-if="rows && headers"
        :columns="config.columns"
        :rows="rows"
        :headers="headers"
        :loading="loading"
        @import="handleImport"
        @back="stage = 1"
      />
    </div>
    <slot name="header" />
    <slot name="footer" />
  </div>
</template>
