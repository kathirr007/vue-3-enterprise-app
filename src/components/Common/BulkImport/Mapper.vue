<script setup lang="ts">
import type { BulkImportColumn } from '@/types/bulkimport.type';

const props = defineProps<{
  columns: BulkImportColumn[];
  headers: string[];
  rows: Record<string, any>[];
  loading?: boolean;
}>();

const emits = defineEmits(['import', 'back']);

function predictHeader(column: BulkImportColumn) {
  const header = props.headers.find((header) => {
    return (
      header.toLowerCase().includes(column.name.toLowerCase())
      || header
        .toLowerCase()
        .includes(column.name.toLowerCase().replace(/ /g, '_'))
    );
  });
  return header;
}

const mappedColumns = ref<BulkImportColumn[]>([]);

mappedColumns.value = props.columns.map((column) => {
  return {
    ...column,
    mappedHeader: predictHeader(column)
  };
});

const finalRows = computed<Record<string, any>[]>(() => {
  const computedRows = props.rows.map((row) => {
    const newRow: Record<string, any> = {};
    mappedColumns.value.forEach((mappedHeader) => {
      if (!mappedHeader.mappedHeader)
        return;
      newRow[mappedHeader.name] = row[mappedHeader.mappedHeader];
    });
    let isAllRequiredFieldsFilled = true;
    mappedColumns.value.forEach((mappedHeader) => {
      if (mappedHeader.required && !newRow[mappedHeader.name]) {
        isAllRequiredFieldsFilled = false;
      }
    });
    return isAllRequiredFieldsFilled ? newRow : undefined;
  });
  return computedRows.filter(row => row) as Record<string, any>[];
});

function handleMapRows(header: string, column: string) {
  const index = mappedColumns.value.findIndex(
    mappedHeader => mappedHeader.name === header
  );
  mappedColumns.value[index].mappedHeader = column;
}

function handleImport() {
  emits('import', finalRows.value);
}

const mappingOptions = computed(() => {
  return props.headers.map((pc) => {
    return {
      label: pc,
      value: pc
    };
  });
});

const isAllFieldsValid = computed(() => {
  for (const i of finalRows.value) {
    for (const j of props.columns) {
      if (j.validate && i[j.name] && j.validate(i[j.name]) !== true) {
        return false;
      }
    }
  }
  return true;
});
</script>

<template>
  <div class="p-datatable p-component p-datatable-responsive-scroll">
    <!-- shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg max-h-[500px] overflow-auto -->
    <div class="p-datatable-wrapper overflow-x-auto">
      <table class="bulk-create-table p-datatable-table w-full">
        <thead class="bg-gray-50 p-datatable-thead" role="rowgroup">
          <tr>
            <th role="cell">
              Import Field
            </th>
            <th v-for="column in mappedColumns" :key="column.name" role="cell">
              {{ column.label }}
              <span v-if="column.required" class="text-red-500">*</span>
            </th>
          </tr>
          <tr>
            <th role="cell">
              Map Column
            </th>
            <th v-for="column in mappedColumns" :key="column.name" role="cell">
              <Dropdown
                v-model="column.mappedHeader"
                :options="mappingOptions"
                option-label="label"
                option-value="value"
                class="w-full"
                @input="
                  handleMapRows(
                    column.name,
                    ($event.target as HTMLSelectElement)?.value,
                  )
                "
              />
            </th>
          </tr>
        </thead>
        <tbody class="p-datatable-tbody relative" role="rowgroup">
          <tr v-for="(row, index) in finalRows" :key="row.id" role="row">
            <td role="cell">
              {{ index + 1 }}
            </td>
            <td v-for="column in columns" :key="column.name">
              <span>{{ row[column.name] }}</span>
              <p
                v-if="
                  column.validate
                    && row[column.name]
                    && column.validate(row[column.name]) !== true
                "
                class="text-red-500 text-xs"
              >
                {{ column.validate(row[column.name]) }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="flex justify-content-between mt-4">
    <Button @click.prevent="emits('back')">
      Back
    </Button>
    <Button
      :loading="loading"
      :disabled="!isAllFieldsValid"
      @click.prevent="handleImport"
    >
      Import
    </Button>
  </div>
</template>
