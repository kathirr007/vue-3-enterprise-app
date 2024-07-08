<script setup lang="ts">
// import type { SchemaForm } from '@/types/schemaform.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

import type { EntityType } from '@/types/tasks.type';
import { Field as VField } from 'vee-validate';
import type { DropdownFilterEvent } from 'primevue/dropdown';
import Dropdown from 'primevue/dropdown';
import type { Tag, TagCreatePayload, TagType } from '@/types/tags.type';
import { TagCreatePayloadSchema } from '@/types/tags.type';

const props = defineProps<{
  id?: string;
  tagData?: Tag[];
  tagType: TagType;
  entityType?: EntityType;
  isPortal?: boolean;
  isUploader?: boolean;
  clientId?: string;
  fileId?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'change', data: unknown): void;
  (e: 'success', data: any): void;
}>();

const tagListData = ref<Tag[]>();
const addNew = ref<string>('');
const { tagsList, createTag } = useTags();
const { initToast } = useToasts();
const { addDocumentTag } = useTags();
const { isPortalUser } = useCurrentUserData();
const queryClient = useQueryClient();
const { data: tags, isLoading: tagLoading } = useQuery(
  ['tags-list', props.tagType],
  async () => {
    return await tagsList(
      props.tagType,
      !!props.isPortal || isPortalUser.value
    );
  }
);
const { meta, values, errors } = useForm({
  validationSchema: TagCreatePayloadSchema,
  validateOnMount: false,
  initialValues: {
    isDocument: props.isUploader
  }
});
const { mutateAsync: createProjectTag, isLoading: projectTagLoading }
  = useMutation(
    (payload: { tagId: string }) => {
      return useProjectCreateTags(props.id as string, payload);
    },
    {
      onSuccess: (data) => {
        emit('success', data);
      }
    }
  );
const { mutateAsync: documentAddTag, isLoading: documentIsLoading }
  = useMutation(
    (tagId: string) => {
      return addDocumentTag({
        clientId: props.clientId as string,
        fileId: props.fileId as string,
        tagId
      });
    },
    {
      onSuccess: (data) => {
        emit('success', data);
      }
    }
  );

const { mutateAsync: createTaskTag, isLoading: taskTagLoading } = useMutation(
  (payload: { tagId: string }) => {
    return useTaskCreateTags(
      !!props.isPortal,
      props.id as string,
      props.entityType as EntityType,
      payload
    );
  },
  {
    onSuccess: (data) => {
      emit('success', data);
    }
  }
);
const { mutateAsync: createClientTag, isLoading: clientTagLoading }
  = useMutation(
    (payload: { tagId: string }) => {
      return useClientCreateTags(props.id as string, payload);
    },
    {
      onSuccess: (data) => {
        emit('success', data);
      }
    }
  );

const { mutateAsync: createTags } = useMutation(
  (payload: Tag) => {
    return createTag(payload);
  },
  {
    onSuccess: async (data) => {
      await queryClient.invalidateQueries('tags-list');
      initToast({
        actionType: 'Create',
        summary: `Tag created`,
        detail: `Tag created successfully.`
      });
    }
  }
);

async function onSubmit() {
  const payload: TagCreatePayload = { ...values } as TagCreatePayload;

  if (props.tagType === 'PROJECT')
    await createProjectTag(payload);
  if (props.tagType === 'CLIENT')
    await createClientTag(payload);
  if (props.tagType === 'DOCUMENT')
    await documentAddTag(payload.tagId);
  if (
    props.tagType === 'TASK'
    || props.tagType === 'CLIENTTASK'
    || props.tagType === 'SUPPORTTASK'
  )
    await createTaskTag(payload);
}

function addNewTags(e: DropdownFilterEvent) {
  addNew.value = e?.value as unknown as string;
}
async function handelAddNewTag() {
  const payload = { name: addNew.value, type: props.tagType };
  await createTags(payload as Tag);
  const userAddTag = tags.value?.find(el => el.name === payload.name);
  if (userAddTag) {
    if (props.tagType === 'PROJECT')
      createProjectTag({
        tagId: userAddTag?.id
      } as unknown as TagCreatePayload);
    if (props.tagType === 'CLIENT')
      createClientTag({
        tagId: userAddTag?.id
      } as unknown as TagCreatePayload);
    if (
      props.tagType === 'TASK'
      || props.tagType === 'CLIENTTASK'
      || props.tagType === 'SUPPORTTASK'
    )
      createTaskTag({ tagId: userAddTag?.id } as unknown as TagCreatePayload);
    if (props.tagType === 'DOCUMENT' && !props.isUploader)
      await documentAddTag(userAddTag?.id as string);
  }
}

watchEffect(() => {
  const selectedTags = props.tagData?.map(el => el?.id);
  if (props.tagData && tagLoading) {
    const filterTags = tags.value?.filter(
      (val: any) => !selectedTags?.includes(val?.id)
    );
    tagListData.value = filterTags;
  }
  else {
    tagListData.value = tags.value as unknown as Tag[];
  }
});
</script>

<template>
  <form class="grid formgrid">
    <div class="col-12 py-2">
      <div class="field mb-0">
        <label
          v-if="!isUploader"
          for="tagId"
          class="block font-medium text-900"
        >
          <span>
            Tag
            <span v-if="!isUploader" class="text-red-500">*</span></span>
        </label>
        <div class="w-full">
          <VField v-slot="{ handleChange, value, validate }" name="tagId">
            <Dropdown
              id="id"
              :tabindex="0"
              class="w-full"
              name="tagId"
              :model-value="value"
              :options="tagListData"
              option-label="name"
              option-value="id"
              placeholder="Select tag"
              :show-clear="true"
              :loading="tagLoading"
              filter
              @update:model-value="handleChange"
              @blur="validate()"
              @filter="addNewTags"
              @change="emit('change', (values as TagCreatePayload).tagId)"
            >
              <template #option="slotProps">
                <div class="flex justify-content-between">
                  <div>{{ slotProps.option.name }}</div>
                </div>
              </template>
              <template #emptyfilter>
                <div class="card flex justify-content-center items-center">
                  <div class="text-center">
                    <i class="pi pi-tag" style="font-size: 1.5rem" />
                    <p class="text-base">
                      No tags relevant to your search
                    </p>
                  </div>
                </div>

                <div class="flex w-full justify-content-between mt-1">
                  <span>
                    New Tag : <strong>{{ addNew }}</strong>
                  </span>
                  <Button
                    class="max-w-max font-medium"
                    type="button"
                    label="Create"
                    @click="handelAddNewTag"
                  />
                </div>
              </template>
              <template #empty>
                Searching a term will give option to create Tag
              </template>
            </Dropdown>
          </VField>
        </div>
      </div>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :errors="errors"
          :values="values"
          error-key="tagId"
          :feedback="false"
        />
      </transition>
    </div>
    <div
      v-if="!isUploader"
      class="flex w-full justify-content-between mt-3 ml-auto col-12"
    >
      <Button
        class="p-button-danger max-w-max mr-auto"
        label="Cancel"
        @click="emit('close')"
      />
      <Button
        class="max-w-max ml-auto"
        :disabled="!meta.valid"
        type="submit"
        label="Submit"
        :loading="
          projectTagLoading
            || clientTagLoading
            || taskTagLoading
            || documentIsLoading
        "
        @click.prevent="onSubmit"
      />
    </div>
  </form>
</template>
