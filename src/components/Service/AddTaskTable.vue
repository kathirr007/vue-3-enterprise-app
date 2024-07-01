<script setup lang="ts">
import type { FieldEntry } from 'vee-validate';
import { Field as VField } from 'vee-validate';
import type {
  TaskTemplate,
  TaskTemplatePayload
} from '@/types/task-template.type';
import type { Ref } from 'vue';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import type { UploadFilesPayload } from '@/types/common.type';
import type {
  Attachment,
  AttachmentContentType,
  AttachmentExtension,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';
import { useMutation } from 'vue-query';
import type { Service } from '@/types/service.type';

interface EmptyTask {
  title: string;
  entityType: string;
  description?: string;
  estimatedTime?: number;
  enableNotifications?: boolean;
  enableBilling?: boolean;
  error?: string;
  attachmentIds?: string[];
  attachments?: Attachment[];
  dueInDays?: number;
  id?: string;
}

type TaskType = 'clientTask' | 'teamTask';

const props = defineProps<{
  fields: FieldEntry<unknown>[];
  values: Record<string, any>;
  errors: Record<string, any>;
  taskType: TaskType;
  currentService?: Service;
}>();

const emit = defineEmits<{
  (e: 'updateRenderKey', val: number): void;
  (e: 'removeFieldError', field: Ref<EmptyTask>): void;
  (e: 'pushTask', taskType: TaskType, data?: EmptyTask): void;
  (e: 'updateTasks', taskType: TaskType, data?: EmptyTask[]): void;
  (e: 'removeTask', id: number, taskType: TaskType): void;
  (
    e: 'showAttachments',
    data: {
      actionType: 'show' | 'hide';
      attachments?: Pick<Attachment, 'id' | 'name'>[];
      idx?: number;
      taskType?: TaskType;
    }
  ): void;
  (
    e: 'updateAttachment',
    index: number,
    taskType: TaskType,
    isUpdate: boolean,
    attachments: AttachmentResponse[]
  ): void;
  (
    e: 'removeAttachment',
    index: number,
    taskType: TaskType,
    data: Pick<Attachment, 'id' | 'name'>
  ): void;
}>();

const { fields: fieldsRef } = toRefs(props);

const listData = computed(() => [...fieldsRef.value]);
const listData2 = ref(
  listData.value.map(item => ({ ...item, value: ref(item.value) }))
);

const attachDialog = ref(false);
const isMultiple = ref(true);
const taskAttachmentsRef = ref<Record<string, any>>();
const currentAttachmentRef = ref<{
  index: number;
  taskType: TaskType;
  isUpdate?: boolean;
}>();
const currentAttachmentRes = ref<AttachmentResponse[]>([]);
const uploadedFiles = ref<File[]>([]);
const isDescDailogVisible = ref(false);
const selectedTaskTemplate = ref<EmptyTask>();
const drag = ref(false);
const fieldsProp = ref<FieldEntry<unknown>[]>();
const reRenderKey = ref(0);

const { defaultBreakpoints, isMedium } = useCommonBreakPoints();
const { createAttachment, fileSelected, attachmentRes } = useAttachments();
const { initToast } = useToasts();
const { canDo } = usePermissions();

function removeFieldError(field: Ref<EmptyTask>) {
  emit('removeFieldError', field);
}

function removeTask(id: number, taskType: TaskType) {
  emit('removeTask', id, taskType);
}

function pushTask(taskType: TaskType, data?: EmptyTask) {
  emit('pushTask', taskType, data);
}

function updateAttachment(index: number,
  taskType: TaskType,
  isUpdate: boolean) {
  emit(
    'updateAttachment',
    index,
    taskType,
    isUpdate,
    currentAttachmentRes.value
  );
  currentAttachmentRes.value = [];
}

function prepareForAttachment(index: number,
  taskType: TaskType,
  isUpdate?: boolean) {
  attachDialog.value = true;
  currentAttachmentRef.value = { index, taskType, isUpdate };
  isMultiple.value = !isUpdate;
}

function prepareAttachmentsList(data: {
  actionType: 'show' | 'hide';
  attachments?: Pick<Attachment, 'id' | 'name'>[];
  idx?: number;
  taskType?: TaskType;
}) {
  emit('showAttachments', data);
  currentAttachmentRef.value = {
    index: data.idx as number,
    taskType: data.taskType as TaskType
  };
}

const { mutateAsync: taskAttactments } = useMutation(
  async (data: { payload: CreateAttachment; file: UploadFilesPayload }) => {
    return createAttachment({
      payloadData: data,
      showToast: false,
      fileUploadRef: taskAttachmentsRef
    });
  },
  {
    onSuccess: (data: { res: AttachmentResponse; file: File }) => {
      uploadedFiles.value.push(data.file);
      attachmentRes.value?.push(data.res);
      currentAttachmentRes.value?.push(data.res);
    }
  }
);

async function makeParallelAPIReq(payloadArr: File[]) {
  if (payloadArr.length === 0) {
    return;
  }
  await Promise.allSettled(
    payloadArr.map(async (item) => {
      // filesSelected.value.push(item);
      fileSelected.value = item;
      const payload: CreateAttachment = {
        filename: item.name,
        contentType: item.type as unknown as AttachmentContentType,
        extension: item.name.split('.').pop() as unknown as AttachmentExtension,
        contentLength: item.size
      };
      // uploadFileRef.value
      await taskAttactments({ payload, file: fileSelected.value });
    })
  );
}

async function onUpload(value: UploadFilesPayload) {
  if (taskAttachmentsRef.value) {
    taskAttachmentsRef.value.isUploading = true;
  }
  if (Array.isArray(value.files)) {
    uploadedFiles.value = [];
    await makeParallelAPIReq(value.files);
    updateAttachment(
      currentAttachmentRef.value?.index as number,
      currentAttachmentRef.value?.taskType as TaskType,
      currentAttachmentRef.value?.isUpdate as boolean
    );
    if (!currentAttachmentRef.value?.isUpdate) {
      initToast({
        actionType: 'Update',
        summary: 'File Upload',
        detail: `Total <strong>${uploadedFiles.value?.length}</strong> File${
          uploadedFiles.value?.length > 1 ? 's' : ''
        } uploaded successfully`
      });
    }
    attachDialog.value = false;
  }
}

function prepareForDesc(field: EmptyTask) {
  selectedTaskTemplate.value = field;
  isDescDailogVisible.value = true;
}

function handleDesc(value: string) {
  if (selectedTaskTemplate.value)
    selectedTaskTemplate.value.description = value;
  isDescDailogVisible.value = false;
}

function refactorField(field: EmptyTask) {
  const newField = { ...field };
  delete newField.id;
  if (newField.title) {
    newField.title = `Copy of ${newField.title}`;
  }
  return newField;
}

const dragOptions = computed(() => {
  return {
    animation: 200,
    disabled: false,
    ghostClass: 'ghost'
  };
});

function onStart() {
  drag.value = true;
}
function onEnd() {
  // reRenderKey.value++;
  drag.value = false;
  emit(
    'updateTasks',
    props.taskType as TaskType,
    listData2.value as unknown as EmptyTask[]
  );
  // emit('updateRenderKey', reRenderKey.value);
}

watchEffect(() => {
  if (fieldsRef.value) {
    fieldsProp.value = fieldsRef.value.map((e) => {
      return { ...e };
    });
  }
  if (listData.value) {
    listData2.value = listData.value.map(e => e);
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div class="p-datatable p-component p-datatable-responsive-scroll">
    <div class="p-datatable-wrapper overflow-x-auto">
      <table
        class="bulk-create-table p-datatable-table w-full"
        role="table"
        cellspacing="0"
        cellpadding="0"
      >
        <thead
          class="bg-gray-50 p-datatable-thead border-bottom-1 default-border-color"
          role="rowgroup"
        >
          <tr class="">
            <th role="cell">
              Task Name
            </th>
            <th v-if="taskType === 'teamTask'" role="cell" class="text-center">
              <i
                v-tooltip.top="'Task Duration in Minutes'"
                class="pi pi-clock text-xl"
              />
            </th>
            <th role="cell" class="text-center text-xl">
              <div class="flex align-items-center justify-content-center">
                <i
                  v-tooltip.top="'Enable Billing'"
                  class="pi pi-dollar text-xl"
                />
              </div>
            </th>
            <th role="cell" class="text-center text-xl">
              <div class="flex align-items-center justify-content-center">
                <i
                  v-tooltip.top="'Enable Notifications'"
                  class="pi pi-bell text-xl"
                />
              </div>
            </th>
            <th role="cell" class="text-xl text-center">
              <i
                v-tooltip.top="'Attachments'"
                class="pi pi-paperclip text-xl"
              />
            </th>
            <th role="cell" class="text-center">
              Description
            </th>
            <th role="cell">
              Order
            </th>
            <th v-if="canDo('services', 'edit')" role="cell" class="text-right">
              Actions
            </th>
          </tr>
        </thead>
        <!-- <draggable
          :itemKey="`${taskType}_${reRenderKey}`"
          :list="fields"
          :key="`${taskType}_${reRenderKey}`"
          :component-data="{
            type: 'transition-group',
            name: !drag ? 'flip-list' : null,
            key: `transition-group_${taskType}`,
          }"
          tag="tbody"
          v-bind="dragOptions"
          class="p-datatable-tbody relative"
          @start="onStart"
          @end="onEnd"
        >
          <template #item="{ element, index }"> -->
        <tbody class="p-datatable-tbody relative">
          <tr v-for="(field, idx) in fields" :key="`${reRenderKey}_${idx}`">
            <td
              role="cell"
              valign="top"
              :class="[
                {
                  'pb-4':
                    (
                      (field as unknown as FieldEntry)
                        .value as unknown as EmptyTask
                    ).error && isMedium,
                },
              ]"
            >
              <label
                :for="`title_${idx}`"
                class="mb-2"
                :class="isMedium ? 'hidden' : 'block'"
              >Title</label>
              <VField
                :id="`title_${idx}`"
                :key="`${taskType}s[${idx}].title_${reRenderKey}`"
                v-tooltip.top="values[`${taskType}s`][`${idx}`].title"
                :vid="`${taskType}s[${idx}].title`"
                :name="`${taskType}s[${idx}].title`"
                class="w-full"
                :as="InputText"
                placeholder="Title"
                @input="removeFieldError(field as unknown as Ref<EmptyTask>)"
              />
              <transition mode="out-in" name="field-slide-down">
                <FormFeedbackMessage
                  :errors="errors"
                  :values="values"
                  :error-key="`${taskType}s[${idx}].title`"
                />
              </transition>
              <div
                v-if="
                  (
                    (field as unknown as FieldEntry)
                      .value as unknown as EmptyTask
                  ).error
                "
                class="p-error api-error"
              >
                {{
                  (
                    (field as unknown as FieldEntry)
                      .value as unknown as EmptyTask
                  ).error
                }}
              </div>
            </td>
            <td
              v-if="taskType === 'teamTask'"
              role="cell"
              valign="top"
              class="text-center to-inline"
            >
              <label
                :for="`estimatedTime_${idx}`"
                class="mb-2"
                :class="isMedium ? 'hidden' : 'block'"
              ><i class="pi pi-clock text-xl" /></label>
              <VField
                :id="`estimatedTime_${idx}`"
                :key="`${taskType}s[${idx}].estimatedTime_${reRenderKey}`"
                v-slot="{ handleChange, value }"
                :vid="`${taskType}s[${idx}].estimatedTime`"
                :name="`${taskType}s[${idx}].estimatedTime`"
              >
                <InputNumber
                  input-class="w-4rem"
                  :value="value"
                  :model-value="value as number"
                  @update:model-value="handleChange"
                />
              </VField>
            </td>
            <td role="cell" valign="top" class="text-center to-inline">
              <label
                :for="`billing_${idx}`"
                class="mb-2"
                :class="isMedium ? 'hidden' : 'block'"
              ><i class="pi pi-dollar text-xl" /></label>
              <VField
                :id="`billing_${idx}`"
                :key="`${taskType}s[${idx}].enableBilling_${reRenderKey}`"
                v-slot="{ handleChange, value, field }"
                :vid="`${taskType}s[${idx}].enableBilling`"
                :name="`${taskType}s[${idx}].enableBilling`"
              >
                <Checkbox
                  :binary="true"
                  :value="true"
                  type="checkbox"
                  v-bind="field"
                  :model-value="value"
                  @update:model-value="handleChange"
                  @change="handleChange"
                />
              </VField>
            </td>
            <td role="cell" valign="top" class="text-center to-inline">
              <label
                :for="`notification_${idx}`"
                class="mb-2"
                :class="isMedium ? 'hidden' : 'block'"
              ><i class="pi pi-bell text-xl" /></label>

              <VField
                :id="`notification_${idx}`"
                :key="`${taskType}s[${idx}].enableNotifications_${reRenderKey}`"
                v-slot="{ handleChange, value, field }"
                :vid="`${taskType}s[${idx}].enableNotifications`"
                :name="`${taskType}s[${idx}].enableNotifications`"
              >
                <Checkbox
                  :binary="true"
                  :value="true"
                  type="checkbox"
                  v-bind="field"
                  :model-value="value"
                  @update:model-value="handleChange"
                  @change="handleChange"
                />
              </VField>
            </td>
            <td role="cell" valign="top" class="text-center">
              <label
                :for="`report-to${idx}`"
                class="mb-2"
                :class="isMedium ? 'hidden' : 'block'"
              ><i class="pi pi-paperclip text-xl" /></label>
              <template
                v-if="(field.value as TaskTemplate).attachments?.length > 0"
              >
                <a
                  href=""
                  tabindex="0"
                  class="underline font-medium"
                  @click.prevent="
                    prepareAttachmentsList({
                      actionType: 'show',
                      attachments: (field.value as TaskTemplate).attachments,
                      idx,
                      taskType,
                    })
                  "
                >View</a>
                <span class="inline-block mx-1">/</span>
                <a
                  href=""
                  tabindex="0"
                  class="underline font-medium"
                  @click.prevent="
                    prepareForAttachment(
                      idx,
                      taskType,
                      !!(field.value as TaskTemplatePayload).id,
                    )
                  "
                >Attach More</a>
              </template>
              <template v-else>
                <a
                  href=""
                  tabindex="0"
                  class="underline font-medium"
                  @click.prevent="
                    prepareForAttachment(
                      idx,
                      taskType,
                      !!(field.value as TaskTemplatePayload).id,
                    )
                  "
                >Attach</a>
              </template>
            </td>
            <td role="cell" valign="top" class="text-center">
              <label
                :for="`description-to${idx}`"
                class="mb-2"
                :class="isMedium ? 'hidden' : 'block'"
              >Description ></label>

              <a
                href=""
                tabindex="0"
                class="underline font-medium"
                @click.prevent="prepareForDesc(field.value as EmptyTask)"
              >{{
                (field.value as EmptyTask)?.description ? 'View/Edit' : 'Add'
              }}</a>
            </td>
            <td role="cell" valign="top">
              <label
                :for="`order-${idx}`"
                class="mb-2"
                :class="isMedium ? 'hidden' : 'block'"
              >
                Order
              </label>
              <VField
                :id="`order-${idx}`"
                :key="`${taskType}s[${idx}].order_${reRenderKey}`"
                v-slot="{ handleChange, value }"
                :vid="`${taskType}s[${idx}].order`"
                :name="`${taskType}s[${idx}].order`"
              >
                <InputNumber
                  input-class="w-3rem"
                  :value="value"
                  :model-value="value as number"
                  :min="1"
                  @update:model-value="handleChange"
                />
              </VField>
            </td>
            <!-- <td role="cell" valign="top">
              <label
                :for="`completion-${idx}`"
                class="mb-2"
                :class="isMedium ? 'hidden' : 'block'"
              >
                Completion Days
              </label>
              <VField
                :id="`completion-${idx}`"
                :vid="`${taskType}s[${idx}].dueInDays`"
                :name="`${taskType}s[${idx}].dueInDays`"
                :key="`${taskType}s[${idx}].dueInDays_${reRenderKey}`"
                v-slot="{ handleChange, value }"
              >
                <InputNumber
                  @update:model-value="handleChange"
                  :value="value"
                  :model-value="value as number"
                  :min="1"
                />
              </VField>
            </td> -->
            <td
              v-if="canDo('services', 'edit')"
              role="cell"
              valign="top"
              class="text-right md:text-left"
            >
              <div class="flex justify-content-end">
                <Button
                  v-if="idx === fields.length - 1"
                  icon="pi pi-plus"
                  aria-label="add-record"
                  class="p-button-sm p-button-rounded p-button-primary mr-2"
                  @click="pushTask(taskType)"
                />
                <Button
                  icon="pi pi-clone"
                  aria-label="clone-record"
                  class="p-button-sm p-button-rounded p-button-primary mr-2"
                  @click="
                    pushTask(taskType, refactorField(field.value as EmptyTask))
                  "
                />
                <Button
                  v-if="
                    fields.length > 1 || (fields[idx].value as TaskTemplate).id
                  "
                  type="button"
                  icon="pi pi-trash"
                  aria-label="delete-record"
                  class="p-button-sm p-button-rounded p-button-danger"
                  @click="removeTask(idx, taskType)"
                />
              </div>
            </td>
          </tr>
        </tbody>
        <!-- </template>
        </draggable> -->
      </table>
    </div>
  </div>
  <Dialog
    v-model:visible="attachDialog"
    :modal="true"
    append-to="body"
    header="Attachments"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
  >
    <p class="mb-2">
      Supported formats: jpeg, jpg, pdf, doc, docx, xls, xlsx, ppt, pptx, txt,
      csv.
      <br>Max size: 5MB.
    </p>
    <CommonFileUpload
      ref="taskAttachmentsRef"
      name="taskAttachments"
      custom-upload
      :multiple="isMultiple"
      :max-file-size="5000000"
      accept="application/pdf, image/png, image/jpeg, image/jpeg, image/gif, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, text/plain, text/csv"
      @uploader="(files: UploadFilesPayload) => onUpload(files)"
    >
      <template #empty>
        <p>Drag and drop files to here to upload.</p>
      </template>
    </CommonFileUpload>
  </Dialog>
  <Dialog
    v-model:visible="isDescDailogVisible"
    :modal="true"
    append-to="body"
    header="Add/Update Description"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
    @hide="isDescDailogVisible = false"
  >
    <ServiceAddDescriptionForm
      :current-desc="selectedTaskTemplate?.description"
      @success="handleDesc"
    />
  </Dialog>
</template>
