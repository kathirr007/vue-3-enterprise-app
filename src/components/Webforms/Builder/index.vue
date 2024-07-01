<script setup lang="ts">
import EmptyField from '@/components/Webforms/Builder/EmptyField.vue';
import AvailableFields from '@/components/Webforms/Builder/AvailableFields.vue';
import FieldInjector from '@/components/Webforms/Builder/FieldInjector.vue';
import BaseDatePicker from '@/components/Webforms/Builder/BaseDatepicker.vue';
import BaseInput from '@/components/Webforms/Builder/BaseInput.vue';
import BaseTextArea from '@/components/Webforms/Builder/BaseTextarea.vue';
import BaseSelect from '@/components/Webforms/Builder/BaseSelect.vue';
import BaseEditor from '@/components/Webforms/Builder/BaseEditor.vue';
import BaseRadioButton from '@/components/Webforms/Builder/BaseRadioButton.vue';
import BaseCheckbox from '@/components/Webforms/Builder/BaseCheckbox.vue';
import BaseSwitch from '@/components/Webforms/Builder/BaseSwitch.vue';
import BaseFileUpload from '@/components/Webforms/Builder/BaseFileUpload.vue';
import BaseHeading from '@/components/Webforms/Builder/BaseHeading.vue';
import BaseDivider from '@/components/Webforms/Builder/BaseDivider.vue';

// import BaseTable from '@/components/Webforms/Builder/base-table.vue';
// import StaticTable from '@/components/Webforms/Builder/static-table.vue';
import { InputAttrType } from '@/types/webforms.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import draggable from 'vuedraggable';
import type {
  FieldType,
  RigidTemplateSchema,
  TemplateField,
  TemplateRow,
  Webform,
  WebformType
} from '@/types/webforms.type';
import type { Attachment } from '@/types/attachment.type';
import type { VueformComponent } from '@vueform/vueform';
import type { InstantJSON } from '@/types/esignature.type';

const props = defineProps<{
  webformType: WebformType;
  webformId?: string;
  webform?: Webform;
  isFromClient?: boolean;
  isTemplate?: boolean;
  isClientWebformCreate?: boolean;
  hideValues?: boolean;
  disableForm?: boolean;
}>();

const emit = defineEmits<{
  (e: 'success', data: Webform): void;
  (e: 'update', data: Webform): void;
  (e: 'back'): void;
}>();

const { webform: webformProp, webformId: webformIdProp } = toRefs(props);
const route = useRoute();
const router = useRouter();
const { updateBreadcrumb } = useBreadcrumbs();
const { initToast } = useToasts();
const { getRandomString } = useUtilityFns();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const {
  availableFields,
  getOne: getWebformTemplateDetails,
  update,
  schemaToVueformSchema,
  getAttachmentIds
} = useWebformTemplates();
const { update: updateClientWebform, getOne: getWebformDetails }
  = useWebforms();
const queryClient = useQueryClient();

const fieldSetRef = ref();
const currentWebformId = ref(
  route.name === 'admin-webform-templates-id'
    ? (route.params.id as string)
    : (route.query.webformId as string)
    || (webformIdProp?.value as string)
    || (webformProp?.value?.id as string)
);
const builderComponents: Record<string, any> = {
  EmptyField,
  AvailableFields,
  FieldInjector,
  BaseDatePicker,
  BaseInput,
  BaseTextArea,
  BaseSelect,
  BaseEditor,
  BaseRadioButton,
  BaseCheckbox,
  BaseSwitch,
  BaseFileUpload,
  BaseHeading,
  BaseDivider
};

const isESignWebform = ref(route.query.isESignWebform === 'true');
const drag = ref(false);
const showPreview = ref(false);
const sendToClient = ref(false);
const isWebformFill = ref(false);
const builderView = ref<'contractView' | 'formView'>('contractView');
const templateName = ref('');
const maxBlocks = ref(3); // TODO: CSS-Grid is not working for maxBlocks > 3, ?
// To keep track of which block is clicked
const selectedBlockIndex = ref(-1);
const selectedRowIndex = ref(-1);
const showInjectionForm = ref(false);
const showAvailableFields = ref(false);
const showAvailableFieldsForTable = ref(false);
const isFirstColumn = ref(true);
const confirmDeleteBlock = ref(false);
const currentServiceModel = ref();
// Store payload that comes from the backend
let rawTablePayload: any;
// Store already added predefined fields
const addedPredefinedFields = ref<Set<string>>(new Set());

// Store ids after making a call instead of relying on url params. // TODO: rethink?
const currentModelName = ref('');
const totalFetchedRows = ref(-1);
const injectionPayload = ref({
  is: 'EmptyField'
} as TemplateField);
const vueformRef = ref(null);
const vueformKey = ref(0);
const availableFieldsForTable = ref<FieldType[]>([]);
const documentMeta = ref();
const schemaLessRow = reactive({
  rowSelected: false,
  blocks: [] as TemplateField[]
});
const schema = ref<RigidTemplateSchema>({
  rows: []
});
const toggleSchema = ref({
  formView: {
    type: 'radiogroup',
    items: [
      {
        value: 'contractView',
        label: 'Contract'
      },
      {
        value: 'formView',
        label: 'Form'
      }
    ],
    view: 'tabs',
    default: 'contractView'
  }
});
const toggleViewRef = ref(null);

const dragOptions = computed(() => {
  return {
    animation: 200,
    group: 'rows',
    disabled: false,
    ghostClass: 'rows-ghost',
    scrollSensitivity: 200,
    forceFallback: true
  };
});
const vueformSchema = computed(() => {
  vueformKey.value++;
  return {
    schema: schemaToVueformSchema(schema.value)
  };
});
const filteredFields = computed(() => {
  if (webformDetails.value?.type === 'CONTRACT') {
    const fieldsToExclude = ['BaseFileUpload', 'BaseEditor'];
    return availableFields.value.filter(
      (field: FieldType) => !fieldsToExclude.includes(field.is)
    );
  }
  return availableFields.value;
});

const isFormView = computed(() => {
  if (props.webformType === 'CONTRACT') {
    return builderView.value === 'formView';
  }
  return true;
});

const { data: webformDetails, isFetching: loadingWebform } = useQuery(
  ['get-webform-details'],
  () => {
    return webformProp?.value
      ? { ...webformProp.value }
      : props.isFromClient
        ? getWebformDetails(currentWebformId.value)
        : getWebformTemplateDetails(currentWebformId.value);
  },
  {
    onSuccess: (data: Webform) => {
      templateName.value = data.name;
      schema.value = data.data || { rows: [] };
      // const removedTextType = removeTextTypeForSelectTag(schema.value);
      // schema.value.rows = cleanRows(removedTextType.rows);
      totalFetchedRows.value = schema.value.rows.length;

      if (!props.isFromClient) {
        updateBreadcrumb({
          breadcrumbs: [
            {
              label: 'Administration',
              to: { name: 'admin-administration' }
            },
            {
              label: 'Webform Templates',
              to: { name: 'admin-webform-templates' }
            },
            {
              label: data.name
            }
          ]
        });
      }
    }
  }
);

provide('webformDetails', webformDetails);

function editBlock(payload: TemplateField) {
  if (payload.predefinedType) {
    addedPredefinedFields.value.add(payload.predefinedType);
  }
  schema.value.rows[selectedRowIndex.value].blocks[selectedBlockIndex.value]
    = payload;
  selectedRowIndex.value = -1;
  selectedBlockIndex.value = -1;
  showInjectionForm.value = false;
}

function deleteBlock() {
  if (selectedRowIndex.value !== -1)
    schema.value.rows[selectedRowIndex.value].blocks[
      selectedBlockIndex.value
    ].is = 'EmptyField';
  else schemaLessRow.blocks[selectedBlockIndex.value].is = 'EmptyField';
  confirmDeleteBlock.value = false;
  if (
    schema.value.rows[selectedRowIndex.value]?.blocks[selectedBlockIndex.value]
      .predefinedType
  ) {
    addedPredefinedFields.value.delete(
      schema.value.rows[selectedRowIndex.value].blocks[selectedBlockIndex.value]
        .predefinedType as string
    );
  }
}

function initiateInjectionForTable(payload: TemplateField) {
  showAvailableFieldsForTable.value = false;
  // add auto-mapping for new table
  payload.props.autoMapping = [];
  rawTablePayload.props.columns = [payload];
  injectionPayload.value = structuredClone(rawTablePayload);
  showInjectionForm.value = true;
}

function initiateInjection(payload: TemplateField) {
  showAvailableFields.value = false;
  if (payload.is === 'BaseTable') {
    showAvailableFieldsForTable.value = true;
    isFirstColumn.value = true;
  }
  // Add table with columns names from backend if it is a bank statement
  else if (payload.predefinedType === 'TRANSACTIONS') {
    payload.attrs = { type: InputAttrType.text };
    payload.id = payload.fieldId;
    payload.props.columns?.forEach((column) => {
      column.fieldId = column.id;
    });
    // Directly add it to the schema
    addField(payload);
  }
  else {
    injectionPayload.value = payload;
    showInjectionForm.value = true;
  }
}

function initializeSchemaLessRow(blockCount: number) {
  schemaLessRow.rowSelected = true;
  for (let i = 0; i < blockCount; i += 1) {
    schemaLessRow.blocks.push({ is: 'EmptyField' } as TemplateField);
  }
}

function cleanRows(rows: TemplateRow[]) {
  /*
    Only accept the rows that has no empty blocks. This is to avoid any empty blocks being rendered on UI.
  */
  return rows.filter(
    row => row.blocks !== undefined && row.blocks.length !== 0
  );
}

function resetRow() {
  schemaLessRow.rowSelected = false;
  schemaLessRow.blocks = [] as TemplateField[];
  selectedBlockIndex.value = -1;
}

function addRefIds(schema?: RigidTemplateSchema): RigidTemplateSchema {
  // console.log('adding');
  schema?.rows.forEach((row) => {
    row.blocks.forEach((block) => {
      if (!block.refId && !block.predefinedType) {
        block.refId = getRandomString();
      }
    });
  });
  return schema as RigidTemplateSchema;
}

function checkPush() {
  /*
    Final push that updates the schema.value.
    Exits prematurely if the row still contains empty-field.
    Only those rows that do not have empty-fields are pushed to schema.value.
  */
  for (let i = 0; i < schemaLessRow.blocks.length; i += 1) {
    if (schemaLessRow.blocks[i].is === 'EmptyField')
      return;
  }
  schema.value.rows.push({ blocks: schemaLessRow.blocks });
  resetRow();
  schemaLessRow.blocks = [] as TemplateField[];
  schemaLessRow.rowSelected = false;
  selectedBlockIndex.value = -1;
  addRefIds();
  // console.log(schema);
  nextTick(() => {
    const fieldSetEl = document.querySelector('fieldset');
    fieldSetEl?.scrollTo({
      top: (fieldSetEl as HTMLElement).scrollHeight,
      behavior: 'smooth'
    });
  });
}

function addField(payload: TemplateField) {
  if (payload.predefinedType) {
    addedPredefinedFields.value.add(payload.predefinedType);
  }
  showInjectionForm.value = false;
  // check if the field that is being added is new or replace (deleted block)
  if (selectedRowIndex.value !== -1) {
    if (payload.is === 'BaseTable') {
      schema.value.rows[selectedRowIndex.value].blocks[
        selectedBlockIndex.value
      ].props.columns?.push((payload.props.columns as TemplateField[])[0]);
    }
    else {
      schema.value.rows[selectedRowIndex.value].blocks[
        selectedBlockIndex.value
      ] = payload;
    }
    selectedRowIndex.value = -1;
    return;
  }
  schemaLessRow.blocks[selectedBlockIndex.value] = payload;
  // document
  //   .querySelector('fieldset')
  //   ?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  // fieldSetRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  checkPush();
}

function initiateEditBlock(rowIndex: number, blockIndex: number) {
  selectedRowIndex.value = rowIndex;
  selectedBlockIndex.value = blockIndex;
  showInjectionForm.value = true;
  // Check if the edit needs to happen on predefined+filled rows or schema less row
  if (rowIndex !== -1)
    injectionPayload.value = {
      ...toRaw(schema.value.rows[rowIndex].blocks[blockIndex]),
      isEditing: true
    };
  else
    injectionPayload.value = {
      ...toRaw(schemaLessRow.blocks[blockIndex]),
      isEditing: true
    };
}

const { mutateAsync: updateWebform, isLoading: updatingWebform } = useMutation(
  ({ id, payload }: { id: string; payload?: Partial<Webform> }) =>
    props.webform || props.isFromClient
      ? updateClientWebform({
        id,
        payload: payload as Partial<Webform>,
        sendToClient: sendToClient.value
      })
      : update({ id, payload: payload as Partial<Webform> }),
  {
    onSuccess: (data) => {
      initToast({
        actionType: 'Update',
        title: 'Webform',
        detail: `Webform <strong>${templateName.value}</strong> updated successfully.`
      });
      queryClient.invalidateQueries('get-webform-details');
      if (sendToClient.value) {
        emit('success', data);
      }
      else {
        emit('update', data);
      }
    }
  }
);

async function handleInstantJSON(data: {
  instantJSON: InstantJSON;
  sendToClient: boolean;
}) {
  documentMeta.value = {
    instantJSON: { ...data.instantJSON }
  };
  handleUpdateTemplate(data.sendToClient);
}

async function handleUpdateTemplate(isFromClient = false) {
  // vueformKey.value++;
  // vueformSchema.value = { schema: schemaToVueformSchema(schema) };
  // const payload = addTextTypeForSelectTag(schema);
  sendToClient.value = isFromClient;
  const webformPayload = addRefIds(schema.value);
  const { attachments } = webformDetails.value as Webform;
  const payload: Partial<Webform> = {
    ...webformDetails.value,
    data: { ...webformPayload },
    ...vueformSchema.value,
    // sendToClient: props.isFromClient,
    clientId: props.webform?.client ? props.webform?.client.id : undefined,
    attachments: attachments?.length
      ? (getAttachmentIds(attachments as Attachment[]) as string[])
      : []
  };

  if (documentMeta.value) {
    payload.documentMeta = { ...documentMeta.value };
  }

  await updateWebform({
    id: currentWebformId.value as string,
    payload
  });
}

function setAlreadyAddedPredefinedFields() {
  schema.value.rows.forEach((row) => {
    row.blocks.forEach((block) => {
      if (block.predefinedType) {
        addedPredefinedFields.value.add(block.predefinedType);
      }
    });
  });
}

function ejectColumnFromTable(
  rowIndex: number,
  blockIndex: number,
  columnIndex: number
) {
  schema.value.rows[rowIndex].blocks[blockIndex].props.columns?.splice(
    columnIndex,
    1
  );
}

function initiateEditColumn(
  rowIndex: number,
  colIndex: number,
  tableColumn: number
) {
  selectedRowIndex.value = rowIndex;
  selectedBlockIndex.value = colIndex;
  // console.log(rowIndex, colIndex, tableColumn);
  injectionPayload.value = (schema.value.rows as any[])[rowIndex].blocks[
    colIndex
  ].props.columns[tableColumn];
  injectionPayload.value.tableColumnIndex = tableColumn;
  injectionPayload.value.name = 'Edit Column';
  showInjectionForm.value = true;
}

function editTableColumn(injectField: any, tableColumnNumber: number) {
  (schema.value.rows as any[])[selectedRowIndex.value].blocks[
    selectedBlockIndex.value
  ].props.columns[tableColumnNumber] = injectField;
  selectedRowIndex.value = -1;
  selectedBlockIndex.value = -1;
  showInjectionForm.value = false;
}

function toggleFormView(data: Record<string, any>) {
  vueformKey.value++;
  isWebformFill.value = false;
  builderView.value = data.formView;
}

function handleWebformFill() {
  isWebformFill.value = true;
}

function handleWebFormSubmit() {
  router.push({
    query: {
      ...route.query,
      isESignWebform: 'true',
      webformId: webformDetails.value?.id
    }
  });
}

onMounted(async () => {
  // await loadTemplateAndFields();
  setAlreadyAddedPredefinedFields();
  vueformKey.value++;
});

const disableTemplateUpdation = ref(false);
watch(
  () => [schema.value.rows, schemaLessRow.blocks],
  () => {
    /*
      Disable submitting template if any block contains empty-field
    */
    disableTemplateUpdation.value = false;

    for (const row of schema.value.rows) {
      for (const block of row.blocks) {
        if (block.is === 'EmptyField') {
          disableTemplateUpdation.value = true;
          return;
        }
        if (
          block.is === 'BaseTable'
          && (block.props.columns as TemplateField[])?.length < 1
        ) {
          disableTemplateUpdation.value = true;
        }
      }
    }
    // eslint-disable-next-line
    for (const block of schemaLessRow.blocks) {
      if (block.is === 'EmptyField')
        disableTemplateUpdation.value = true;
      return;
    }
  },
  { deep: true }
);
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonPage :key="route.fullPath" content-class="pb-0">
    <template v-if="templateName" #title>
      <h1 class="font-medium text-3xl text-primary mb-0">
        {{ templateName || 'Webform test 01' }}
      </h1>
    </template>
    <template
      v-if="
        webformType === 'CONTRACT'
          && webformDetails?.status !== 'APPROVED'
          && !(isESignWebform || isWebformFill)
      "
      #helpActions
    >
      <div class="flex justify-content-end">
        <Vueform
          ref="toggleViewRef"
          :schema="toggleSchema"
          @change="toggleFormView"
        />
      </div>
    </template>
    <template v-if="isFormView || webformType === 'ORGANIZER'" #actions>
      <div class="flex justify-content-end">
        <div
          class="flex p-button align-items-center p-1 px-2 gap-2 border border-1 border-round-lg"
        >
          <label
            class="mb-0 text-white cursor-pointer text-lg text-primary"
            for="showPreview"
          >
            Show Preview
          </label>
          <InputSwitch
            v-model="showPreview"
            input-id="showPreview"
            data-v-if="canDo('webforms', 'edit')"
          />
        </div>
      </div>
      <transition name="slide-up" mode="out-in">
        <div v-if="showPreview" class="font-medium text-base text-primary">
          Please scroll down to check the preview.
        </div>
      </transition>
    </template>
    <template v-if="loadingWebform">
      <CommonLoading />
    </template>

    <template v-else>
      <template v-if="!isFormView">
        <CommonVueFormWrapper
          v-if="isWebformFill"
          :webform="webformDetails"
          hide-title
          is-from-client
          is-submit-form
          @back="emit('back')"
          @submit="handleWebFormSubmit"
        />
        <template v-else>
          <Message
            v-if="!isClientWebformCreate"
            severity="info"
            class="mt-1 p-custom-message"
          >
            <p class="text-base">
              If the document is not loaded. Try
              <a href="#" class="font-medium underline">reloading the page</a>.
            </p>
          </Message>
          <PSPDFKitContainer
            :key="vueformKey"
            is-webform
            contract-view
            :is-webform-template="isTemplate"
            :file-id="(webformDetails?.attachments as Attachment[])[0]?.id"
            class="pdf-container-wrapper"
            @back="emit('back')"
            @map-fields="handleInstantJSON"
            @fill:webform="handleWebformFill"
          />
        </template>
      </template>
      <div v-else class="grid gap-3">
        <!-- <WebformsBuilderDraggableExample /> -->
        <div class="col-12 pb-0">
          <form>
            <fieldset
              ref="fieldSetRef"
              disabled
              class="rows-wrapper card"
              :class="{
                'request-wrapper':
                  route.name === 'admin-webform-templates-id'
                  && webformType === 'ORGANIZER',
                'contract-wrapper':
                  route.name === 'admin-webform-templates-id'
                  && webformType === 'CONTRACT',
                'py-2': schema.rows.length,
                'shadow-3': !schema.rows.length,
              }"
            >
              <!-- Pre-defined + newly added fields -->
              <draggable
                v-if="schema.rows.length"
                :list="schema.rows"
                class="list-group min-h-full"

                v-bind="dragOptions"
                :scrollable="true"
                item-key="order"
                :component-data="{
                  tag: 'div',
                  type: 'transition-group',
                  name: !drag ? 'flip-list' : null,
                }"
                handle=".short-schema-rows"
                @start="drag = true"
                @end="drag = false"
              >
                <template #item="{ element: row, index: rowIndex }">
                  <div :key="rowIndex" class="w-full">
                    <!-- <pre>{{ row }}</pre> -->
                    <WebformsBuilderRow
                      :key="rowIndex"
                      class="p-2 pl-3 pr-7"
                      :cols="row.blocks.length"
                      draggable
                      @clear-row="schema.rows.splice(rowIndex, 1)"
                    >
                      <!-- Each block - Field -->
                      <!-- :deletable="rowIndex >= totalFetchedRows" -->
                      <template
                        v-for="(block, blockIndex) in row.blocks"
                        :key="block.refId"
                      >
                        <component
                          :is="builderComponents[`${block.is}`]"
                          :class="{
                            'cursor-not-allowed': block.is !== 'EmptyField',
                          }"
                          v-bind="
                            block.is === 'EmptyField'
                              ? null
                              : { ...block.attrs }
                          "
                          :readonly="block.is === 'BaseEditor'"
                          :columns="
                            ['BaseTable', 'StaticTable'].includes(block.is)
                              ? block.props.columns
                              : false
                          "
                          :label="
                            block.is === 'EmptyField'
                              ? null
                              : block.props.label || block.name
                          "
                          :placeholder="
                            block.is === 'EmptyField'
                              ? null
                              : block.props.placeholder
                          "
                          :name="`${blockIndex}${rowIndex}`"
                          :options="
                            [
                              'BaseSelect',
                              'BaseRadioButton',
                              'BaseCheckbox',
                            ].includes(block.is) && block.props.options
                          "
                          @selected="
                            [selectedRowIndex, selectedBlockIndex] = [
                              rowIndex,
                              blockIndex,
                            ];
                            showAvailableFields = true;
                          "
                          @add-column="
                            isFirstColumn = false;
                            showAvailableFieldsForTable = true;
                            [selectedRowIndex, selectedBlockIndex] = [
                              rowIndex,
                              blockIndex,
                            ];
                          "
                          @eject-column="
                            (columnIndex: number) =>
                              ejectColumnFromTable(
                                rowIndex,
                                blockIndex,
                                columnIndex,
                              )
                          "
                          @table:column:edit="
                            (col: number) =>
                              initiateEditColumn(rowIndex, blockIndex, col)
                          "
                        >
                          <template #edit>
                            <WebformsBuilderEditableBlockMeta
                              :key="rowIndex"
                              :label="block.props.label || block.name"
                              :block="block"
                              @editable:edit="
                                initiateEditBlock(rowIndex, blockIndex)
                              "
                              @editable:remove="
                                [selectedRowIndex, selectedBlockIndex] = [
                                  rowIndex,
                                  blockIndex,
                                ];
                                confirmDeleteBlock = true;
                              "
                            />
                          </template>
                        </component>
                      </template>
                    </WebformsBuilderRow>
                  </div>
                </template>
              </draggable>
              <p
                v-else
                class="text-center font-medium shadow-3 p-3 border-round-lg"
              >
                There is no form field added to this form. Please use the below
                buttons to add rows and form fields.
              </p>
            </fieldset>
            <!-- <Divider class="my-2" v-if="schema.rows.length !== 0" /> -->
            <!-- display the blocks to select -->
            <WebformsBuilderRow
              v-if="!schemaLessRow.rowSelected"
              class="py-3"
              :cols="maxBlocks"
              :deletable="false"
            >
              <div class="flex w-full justify-content-around gap-3">
                <WebformsBuilderEmptyBlock
                  v-for="i in maxBlocks"
                  :key="i"
                  :block-number="i"
                  @selected="initializeSchemaLessRow(i)"
                />
              </div>
            </WebformsBuilderRow>
            <WebformsBuilderRow
              v-else
              class="p-3 px-3"
              :cols="schemaLessRow.blocks.length"
              :deletable="false"
            >
              <component
                :is="builderComponents[`${block.is}`]"
                v-for="(block, i) in schemaLessRow.blocks"
                :key="i"
                class="p-2"
                :label="
                  block.is === 'EmptyField'
                    ? null
                    : block.props.label || block.name
                "
                :placeholder="
                  block.is === 'EmptyField' ? null : block.props.placeholder
                "
                :columns="
                  ['BaseTable', 'StaticTable'].includes(block.is)
                    ? block.props.columns
                    : false
                "
                v-bind="block.is === 'EmptyField' ? null : block.attrs"
                :name="`c${i}`"
                :options="
                  ['BaseSelect', 'BaseRadioButton', 'BaseCheckbox'].includes(
                    block.is,
                  ) && block.props.options
                "
                @selected="
                  [selectedRowIndex, selectedBlockIndex] = [-1, i];
                  showAvailableFields = true;
                "
              >
                <template #edit>
                  <WebformsBuilderEditableBlockMeta
                    :label="block.props.label || block.name"
                    @editable:edit="initiateEditBlock(-1, i)"
                    @editable:remove="
                      [selectedRowIndex, selectedBlockIndex] = [-1, i];
                      confirmDeleteBlock = true;
                    "
                  />
                </template>
              </component>
            </WebformsBuilderRow>
            <div class="flex justify-content-between mt-2">
              <Button
                class="p-button-text p-button button-primary"
                icon="pi pi-chevron-left"
                label="Back"
                @click.prevent="emit('back')"
              />
              <div class="flex flex-row-reverse gap-3 ml-auto">
                <Button
                  v-if="
                    webformType === 'ORGANIZER'
                      && webformDetails?.status !== 'CANCELLED'
                      && webformDetails?.client
                  "
                  class="button button-primary"
                  :loading="updatingWebform && sendToClient"
                  :disabled="disableTemplateUpdation"
                  :label="isFromClient ? 'Send to Client' : 'Update Template'"
                  @click.prevent="handleUpdateTemplate(isFromClient)"
                />
                <Button
                  class="button button-primary"
                  :loading="updatingWebform && !sendToClient"
                  :disabled="disableTemplateUpdation"
                  :label="webformDetails?.client ? 'Save' : 'Update Template'"
                  @click.prevent="handleUpdateTemplate()"
                />
                <Button
                  :disabled="!schemaLessRow.rowSelected"
                  class="button button-primary"
                  @click.prevent="resetRow"
                >
                  Reset Columns
                </Button>
              </div>
            </div>
            <CommonVueFormWrapper
              v-if="showPreview && vueformSchema"
              :key="vueformKey"
              :webform="
                {
                  ...webformDetails,
                  data: {
                    ...webformDetails?.data,
                    ...schema,
                  },
                } as Webform
              "
              :webform-id="webformIdProp"
              :show-divider="isFromClient"
              :is-from-client="isFromClient"
              :form-key="vueformKey"
              is-preview
              hide-buttons
              :disable-form="disableForm"
              :hide-values="hideValues"
              class="mt-4"
            />
          </form>
        </div>
      </div>
    </template>
  </CommonPage>

  <!-- <div v-if="showPreview && vueformSchema">
    <Divider align="center">
      <h3 class="mb-2 text-primary">{{ templateName }} (Preview)</h3>
    </Divider>
    <div class="card">
      <Vueform ref="vueformRef" :key="vueformKey" v-bind="vueformSchema" />
      <div class="flex justify-content-end" v-if="isDevBuild">
        <Button label="Submit " class="mt-3" @click="handleVueFormData" />
      </div>
    </div>
  </div> -->

  <Dialog
    v-model:visible="showInjectionForm"
    :modal="true"
    append-to="body"
    :header="injectionPayload.name || 'Add Field'"
    content-class="border-round-bottom-md"
    :breakpoints="{ ...defaultBreakpoints, '960px': '85vw' }"
    :style="styles"
    @hide="
      showInjectionForm = false;
      showAvailableFieldsForTable = false;
    "
  >
    <WebformsBuilderFieldInjector
      :to-inject="injectionPayload"
      :selected-row-index="selectedRowIndex"
      :is-first-column="isFirstColumn"
      :table-column-index="
        injectionPayload.tableColumnIndex === undefined
          ? -1
          : (injectionPayload.tableColumnIndex as number)
      "
      @inject:add="addField"
      @inject:edit="editBlock"
      @inject:column:edit="editTableColumn"
    />
  </Dialog>
  <Dialog
    v-model:visible="showAvailableFields"
    :modal="true"
    append-to="body"
    header="Available Fields"
    content-class="border-round-bottom-md"
    :breakpoints="{ ...defaultBreakpoints, '960px': '85vw' }"
    :style="styles"
    @hide="showAvailableFields = false"
  >
    <template #header>
      <div>
        <h3 class="text-2xl mb-0">
          Available Fields
        </h3>
        <p class="text-sm text-gray-500">
          Select the field that you want to add to the Form Builder.
        </p>
      </div>
    </template>
    <WebformsBuilderAvailableFields
      :fields="filteredFields"
      :service-model="currentServiceModel"
      :already-added-predefined-fields="addedPredefinedFields"
      :model-name="currentModelName"
      @payload="initiateInjection"
    />
  </Dialog>
  <Dialog
    v-model:visible="showAvailableFieldsForTable"
    :modal="true"
    append-to="body"
    header="Available Fields For Table"
    @hide="showAvailableFieldsForTable = false"
  >
    <template #header>
      <h3 class="text-2xl mb-0">
        Available Fields For Table
      </h3>
      <p class="text-sm text-gray-500">
        Select the field that you want to add to the Table.
      </p>
    </template>
    <WebformsBuilderAvailableFields
      :fields="availableFieldsForTable"
      :model-name="currentModelName"
      @payload="initiateInjectionForTable"
    />
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="confirmDeleteBlock"
    v-model:visible="confirmDeleteBlock"
    title="Remove Field"
    @confirm="deleteBlock"
    @hide="confirmDeleteBlock = false"
  >
    Are you sure you want to remove this field?
  </CommonConfirmRemoveDialog>
</template>

<style scoped lang="scss">
fieldset {
  padding: 0;
  margin: 0;
  border: none;
}

:deep(*) {
  .p-inputswitch.p-inputswitch-checked .p-inputswitch-slider {
    background: $primaryDarkColor;
  }
}

.rows-wrapper {
  max-height: 300px;
  overflow-y: auto;

  &.request-wrapper {
    max-height: calc(100vh - 450px);
  }

  &.contract-wrapper {
    max-height: calc(100vh - 480px);
  }
}
</style>
