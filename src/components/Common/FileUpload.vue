<script>
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import { DomHandler } from 'primevue/utils';
import Ripple from 'primevue/ripple';
import { usePermissions } from '@/composables/permissions';

export default {
  name: 'FileUpload',
  components: {
    FileUploadButton: Button,
    FileUploadProgressBar: ProgressBar,
    FileUploadMessage: Message
  },
  directives: {
    ripple: Ripple
  },
  props: {
    name: {
      type: String,
      default: null
    },
    id: {
      type: String,
      default: null
    },
    inputId: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: null
    },
    mode: {
      type: String,
      default: 'advanced'
    },
    multiple: {
      type: Boolean,
      default: false
    },
    accept: {
      type: String,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    },
    auto: {
      type: Boolean,
      default: false
    },
    maxFileSize: {
      type: Number,
      default: null
    },
    invalidFileSizeMessage: {
      type: String,
      default: '{0}: Invalid file size, file size should be smaller than {1}.'
    },
    invalidFileTypeMessage: {
      type: String,
      default: '{0}: Invalid file type, allowed file types: {1}.'
    },
    fileLimit: {
      type: Number,
      default: null
    },
    invalidFileLimitMessage: {
      type: String,
      default: 'Maximum number of files exceeded, limit is {0} at most.'
    },
    withCredentials: {
      type: Boolean,
      default: false
    },
    previewWidth: {
      type: Number,
      default: 150
    },
    chooseLabel: {
      type: String,
      default: null
    },
    hideChooseButtonLabel: {
      type: Boolean,
      default: false
    },
    hideFileUploadMessages: {
      type: Boolean,
      default: false
    },
    uploadLabel: {
      type: String,
      default: null
    },
    cancelLabel: {
      type: String,
      default: null
    },
    customUpload: {
      type: Boolean,
      default: false
    },
    showUploadButton: {
      type: Boolean,
      default: true
    },
    showCancelButton: {
      type: Boolean,
      default: true
    },
    chooseIcon: {
      type: String,
      default: 'pi pi-plus'
    },
    uploadIcon: {
      type: String,
      default: 'pi pi-upload'
    },
    cancelIcon: {
      type: String,
      default: 'pi pi-times'
    },
    style: null,
    class: null,
    isDocument: {
      type: Boolean,
      default: false
    },
    aiSettings: {
      type: Object,
      required: false
    },
    isPortalUser: {
      type: Boolean
    },
    currentUser: {
      type: Object
    },
    isGalleryUpload: {
      type: Boolean,
      required: false
    },
    isFromExtraction: {
      type: Boolean,
      required: false
    }
  },
  emits: [
    'select',
    'uploader',
    'before-upload',
    'progress',
    'upload',
    'error',
    'before-send',
    'clear',
    'remove',
    'file-error-messages'
  ],
  setup() {
    const { featureSubscribed } = usePermissions();
    return {
      featureSubscribed
    };
  },
  duplicateIEEvent: false,
  data() {
    return {
      uploadedFileCount: 0,
      files: [],
      messages: [],
      focused: false,
      progress: null,
      isUploading: false,
      isLarge: window.innerWidth > 992,
      subscribeDialog: false,
      upgradeFeature: ''
    };
  },
  computed: {
    isAdvanced() {
      return this.mode === 'advanced';
    },
    isBasic() {
      return this.mode === 'basic';
    },
    advancedChooseButtonClass() {
      return [
        'p-button p-component p-fileupload-choose',
        this.class,
        {
          'p-disabled': this.disabled,
          'p-focus': this.focused
        }
      ];
    },
    basicChooseButtonClass() {
      return [
        'p-button p-component p-fileupload-choose',
        this.class,
        {
          'p-fileupload-choose-selected': this.hasFiles,
          'p-disabled': this.disabled,
          'p-focus': this.focused
        }
      ];
    },
    advancedChooseIconClass() {
      return ['p-button-icon p-button-icon-left pi-fw', this.chooseIcon];
    },
    basicChooseButtonIconClass() {
      return [
        'p-button-icon p-button-icon-left',
        !this.hasFiles || this.auto ? this.uploadIcon : this.chooseIcon
      ];
    },
    basicChooseButtonLabel() {
      return this.auto
        ? this.chooseButtonLabel
        : this.hasFiles
          ? this.files.map(f => f.name).join(', ')
          : this.chooseButtonLabel;
    },
    hasFiles() {
      return this.files && this.files.length > 0;
    },
    chooseDisabled() {
      return (
        this.disabled
        || (this.fileLimit
        && this.fileLimit <= this.files.length + this.uploadedFileCount)
      );
    },
    uploadDisabled() {
      return (
        this.disabled
        || !this.hasFiles
        || (this.fileLimit && this.fileLimit < this.files.length)
      );
    },
    cancelDisabled() {
      return this.disabled || !this.hasFiles;
    },
    chooseButtonLabel() {
      return this.chooseLabel || this.$primevue.config.locale.choose;
    },
    uploadButtonLabel() {
      return this.uploadLabel || this.$primevue.config.locale.upload;
    },
    cancelButtonLabel() {
      return this.cancelLabel || this.$primevue.config.locale.cancel;
    },
    chooseStyle() {
      return !this.isLarge ? { width: '36px', height: '37px' } : '';
    }
  },
  watch: {
    // whenever question changes, this function will run
    messages() {
      this.$emit('file-error-messages', this.messages);
    }
  },
  methods: {
    onFileSelect(event) {
      if (event.type !== 'drop' && this.isIE11() && this.duplicateIEEvent) {
        this.duplicateIEEvent = false;
        return;
      }

      this.messages = [];
      this.files = this.files || [];
      const files = event.dataTransfer
        ? event.dataTransfer.files
        : event.target.files;

      for (const file of files) {
        if (!this.isFileSelected(file)) {
          if (this.validate(file)) {
            if (this.isImage(file)) {
              file.objectURL = window.URL.createObjectURL(file);
            }
            if (this.isDocument) {
              file.isAutoExtraction
                = this.isImageOrPdf(file) && this.aiSettings.enableExtraction;

              file.isAutoTag
                = this.isImageOrPdf(file) && this.aiSettings.enableClassification;
              file.disableAutoTag
                = !this.isImageOrPdf(file) || file.isAutoExtraction;
            }
            file.modifiedName = file.name.split('.').slice(0, -1).join('');
            if (this.multiple) {
              this.files.push(file);
            }
            else {
              this.files = [file];
            }
          }
        }
      }

      this.$emit('select', { originalEvent: event, files: this.files });

      if (this.fileLimit) {
        this.checkFileLimit();
      }

      if (this.auto && this.hasFiles && !this.isFileLimitExceeded()) {
        this.upload();
      }

      if (event.type !== 'drop' && this.isIE11()) {
        this.clearIEInput();
      }
      else {
        this.clearInputElement();
      }
    },
    choose() {
      this.$refs.fileInput.click();
    },
    upload() {
      if (this.customUpload) {
        if (this.fileLimit) {
          this.uploadedFileCount += this.files.length;
        }

        this.$emit('uploader', { files: this.files });
        this.clear();
      }
      else {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        this.$emit('before-upload', {
          xhr,
          formData
        });

        for (const file of this.files) {
          formData.append(this.name, file, file.name);
        }

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            this.progress = Math.round((event.loaded * 100) / event.total);
          }

          this.$emit('progress', {
            originalEvent: event,
            progress: this.progress
          });
        });

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            this.progress = 0;

            if (xhr.status >= 200 && xhr.status < 300) {
              if (this.fileLimit) {
                this.uploadedFileCount += this.files.length;
              }

              this.$emit('upload', {
                xhr,
                files: this.files
              });
            }
            else {
              this.$emit('error', {
                xhr,
                files: this.files
              });
            }

            this.clear();
          }
        };

        xhr.open('POST', this.url, true);

        this.$emit('before-send', {
          xhr,
          formData
        });

        xhr.withCredentials = this.withCredentials;

        xhr.send(formData);
      }
    },
    clear() {
      this.files = [];
      this.messages = null;
      this.$emit('clear');

      if (this.isAdvanced) {
        this.clearInputElement();
      }
    },
    onFocus() {
      this.focused = true;
    },
    onBlur() {
      this.focused = false;
    },
    isFileSelected(file) {
      if (this.files && this.files.length) {
        for (const sFile of this.files) {
          if (
            sFile.name + sFile.type + sFile.size
            === file.name + file.type + file.size
          )
            return true;
        }
      }

      return false;
    },
    isIE11() {
      return !!window.MSInputMethodContext && !!document.documentMode;
    },
    validate(file) {
      if (this.accept && !this.isFileTypeValid(file)) {
        this.messages.push(
          this.invalidFileTypeMessage
            .replace('{0}', file.name)
            .replace('{1}', this.accept)
        );

        return false;
      }

      if (this.maxFileSize && file.size > this.maxFileSize) {
        this.messages.push(
          this.invalidFileSizeMessage
            .replace('{0}', file.name)
            .replace('{1}', this.formatSize(this.maxFileSize))
        );

        return false;
      }

      return true;
    },
    isFileTypeValid(file) {
      const acceptableTypes = this.accept.split(',').map(type => type.trim());

      for (const type of acceptableTypes) {
        const acceptable = this.isWildcard(type)
          ? this.getTypeClass(file.type) === this.getTypeClass(type)
          : file.type === type
          || this.getFileExtension(file).toLowerCase() === type.toLowerCase();

        if (acceptable) {
          return true;
        }
      }

      return false;
    },
    getTypeClass(fileType) {
      return fileType.substring(0, fileType.indexOf('/'));
    },
    isWildcard(fileType) {
      return fileType.includes('*');
    },
    getFileExtension(file) {
      return `.${file.name.split('.').pop()}`;
    },
    isImage(file) {
      return /^image\//.test(file.type);
    },
    isImageOrPdf(file) {
      return /(^image\/)|(pdf$)/.test(file.type);
    },
    onDragEnter(event) {
      if (!this.disabled) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
    onDragOver(event) {
      if (!this.disabled) {
        DomHandler.addClass(this.$refs.content, 'p-fileupload-highlight');
        event.stopPropagation();
        event.preventDefault();
      }
    },
    onDragLeave() {
      if (!this.disabled) {
        DomHandler.removeClass(this.$refs.content, 'p-fileupload-highlight');
      }
    },
    onDrop(event) {
      if (!this.disabled) {
        DomHandler.removeClass(this.$refs.content, 'p-fileupload-highlight');
        event.stopPropagation();
        event.preventDefault();

        const files = event.dataTransfer
          ? event.dataTransfer.files
          : event.target.files;
        const allowDrop = this.multiple || (files && files.length === 1);

        if (allowDrop) {
          this.onFileSelect(event);
        }
      }
    },
    onBasicUploaderClick() {
      if (this.hasFiles)
        this.upload();
      else this.$refs.fileInput.click();
    },
    remove(index) {
      this.clearInputElement();
      const removedFile = this.files.splice(index, 1)[0];

      this.files = [...this.files];
      this.$emit('remove', {
        file: removedFile,
        files: this.files
      });
    },
    clearInputElement() {
      this.$refs.fileInput.value = '';
    },
    clearIEInput() {
      if (this.$refs.fileInput) {
        this.duplicateIEEvent = true; // IE11 fix to prevent onFileChange trigger again
        this.$refs.fileInput.value = '';
      }
    },
    formatSize(bytes) {
      if (bytes === 0) {
        return '0 B';
      }

      const k = 1000;
      const dm = 3;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
    },
    isFileLimitExceeded() {
      if (
        this.fileLimit
        && this.fileLimit <= this.files.length + this.uploadedFileCount
        && this.focused
      ) {
        this.focused = false;
      }

      return (
        this.fileLimit
        && this.fileLimit < this.files.length + this.uploadedFileCount
      );
    },
    checkFileLimit() {
      if (this.isFileLimitExceeded()) {
        this.messages.push(
          this.invalidFileLimitMessage.replace('{0}', this.fileLimit.toString())
        );
      }
    },
    onMessageClose() {
      this.messages = null;
    },
    handleFileNameEdit(file) {
      file.isEdit = !file.isEdit;
      this.$forceUpdate();
    },
    handleNameChange(file, name, index) {
      const isAutoTag = file.isAutoTag;
      const isAutoExtraction = file.isAutoExtraction;

      const renamedFile = new File([file], name + this.getFileExtension(file), {
        type: file.type
      });
      if (this.isImage(renamedFile)) {
        renamedFile.objectURL = window.URL.createObjectURL(renamedFile);
      }
      renamedFile.modifiedName = renamedFile.name
        .split('.')
        .slice(0, -1)
        .join('');
      renamedFile.isAutoExtraction = isAutoExtraction;
      renamedFile.isAutoTag = isAutoTag;
      renamedFile.disableAutoTag = !isAutoTag || isAutoExtraction;
      this.files[index] = renamedFile;
      this.$emit('select', { files: this.files });
      this.$forceUpdate();
    },
    handleTagChange(file, tag) {
      file.tagId = tag;
    },
    handleToggleTag(file, newValue) {
      if (newValue) {
        if (!this.featureSubscribed('document_managment', 'auto_tag')) {
          this.upgradeFeature = 'auto tag';
          this.subscribeDialog = true;
          file.isAutoTag = false;
        }
        else file.tagId = undefined;
      }
    },
    handleToggleExtraction(file, newValue) {
      if (newValue) {
        const prevAutoTag = file.isAutoTag;
        if (!this.featureSubscribed('document_managment', 'auto_extraction')) {
          this.upgradeFeature = 'auto extraction';
          this.subscribeDialog = true;
          file.isAutoExtraction = false;
          file.isAutoTag = prevAutoTag;
        }
        else {
          file.isAutoTag = true;
          file.disableAutoTag = true;
        }
      }
      else {
        file.disableAutoTag = false;
      }
    }
  }
};
</script>

<template>
  <div v-if="isAdvanced" class="p-fileupload p-fileupload-advanced p-component">
    <div class="p-fileupload-buttonbar" :class="{ 'grid-container': isLarge }">
      <span
        v-ripple
        :class="[
          ...advancedChooseButtonClass,
          { 'p-2 border-circle': !isLarge },
        ]"
        tabindex="0"
        :style="chooseStyle"
        @click="choose"
        @keydown.enter="choose"
        @focus="onFocus"
        @blur="onBlur"
      >
        <input
          ref="fileInput"
          type="file"
          :multiple="multiple"
          :accept="accept"
          :disabled="chooseDisabled"
          @change="onFileSelect"
        >
        <span
          :class="[
            ...advancedChooseIconClass,
            { 'my-0 mx-auto w-auto': !isLarge },
          ]"
        />
        <span v-if="isLarge" class="p-button-label">{{
          chooseButtonLabel
        }}</span>
      </span>
      <FileUploadButton
        v-if="showUploadButton && !isFromExtraction"
        :label="isLarge ? uploadButtonLabel : undefined"
        :class="{ 'border-circle': !isLarge }"
        :icon="uploadIcon"
        :disabled="uploadDisabled"
        @click="upload"
      />
      <FileUploadButton
        v-if="showCancelButton"
        :label="isLarge ? cancelButtonLabel : undefined"
        :class="{ 'border-circle': !isLarge }"
        :icon="cancelIcon"
        :disabled="cancelDisabled"
        @click="clear"
      />
    </div>
    <div
      ref="content"
      class="p-fileupload-content"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <FileUploadProgressBar
        v-if="hasFiles || isUploading"
        :mode="isUploading ? 'indeterminate' : ''"
      />
      <template v-if="!hideFileUploadMessages">
        <FileUploadMessage
          v-for="msg of messages"
          :key="msg"
          severity="error"
          @close="onMessageClose"
        >
          {{ msg }}
        </FileUploadMessage>
      </template>
      <div
        v-if="hasFiles"
        class="p-fileupload-files"
        :class="{
          'max-h-30rem overflow-y-scroll overflow-x-hidden': files.length > 4,
        }"
      >
        <template
          v-for="(file, index) of files"
          :key="file.name + file.type + file.size"
        >
          <div class="p-fileupload-row border-1 border-gray-100">
            <div>
              <img
                v-if="isImage(file)"
                role="presentation"
                :alt="file.name"
                :src="file.objectURL"
                :width="previewWidth"
              >
              <div class="p-fileupload-filename">
                <InputText
                  v-if="file.isEdit"
                  :model-value="file.modifiedName"
                  class="w-15rem md:w-20rem"
                  @change="(e) => handleNameChange(file, e.target.value, index)"
                />
                <span v-else>
                  {{ file.name }}
                </span>
                <i
                  class="pi ml-1 cursor-pointer"
                  :class="file.isEdit ? 'pi-check' : 'pi-pencil'"
                  @click="handleFileNameEdit(file)"
                />
              </div>

              <div>
                {{ formatSize(file.size) }}
              </div>
              <template
                v-if="isDocument && !isGalleryUpload && !isFromExtraction"
              >
                <div class="flex gap-1 mt-1">
                  <div class="flex flex-column gap-1 pb-1">
                    <div class="flex column-gap-1 align-items-center mt-1">
                      <span class="font-medium w-8rem">Auto Extraction:</span>
                      <InputSwitch
                        v-model="file.isAutoExtraction"
                        :disabled="
                          !aiSettings.enableExtraction
                            || isPortalUser
                            || !isImageOrPdf(file)
                        "
                        @click="$forceUpdate()"
                        @input="handleToggleExtraction(file, $event)"
                      />
                    </div>
                    <div class="flex column-gap-1 align-items-center mt-1">
                      <span class="font-medium w-8rem">Auto Tag:</span>
                      <InputSwitch
                        v-model="file.isAutoTag"
                        :disabled="
                          file.disableAutoTag
                            || isPortalUser
                            || !aiSettings.enableClassification
                            || !isImageOrPdf(file)
                        "
                        @click="$forceUpdate()"
                        @input="handleToggleTag(file, $event)"
                      />
                    </div>
                  </div>
                  <div class="">
                    <span>
                      <img
                        src="/images/robot-icon.png"
                        alt="app assistant robot"
                        class="w-4rem ml-1"
                      >
                    </span>
                  </div>
                </div>
                <Message
                  v-if="
                    currentUser?.orgRole?.name === 'Level 1'
                      && !aiSettings.enableExtraction
                      && !aiSettings.enableClassification
                  "
                  :closable="false"
                  severity="info"
                  class="mt-1 p-custom-message"
                >
                  Enable the Auto Tag and Extract Data feature in the
                  Administrator settings for AI-powered document auto tagging
                  and data extraction.
                </Message>
                <Message
                  v-else-if="
                    currentUser?.orgRole?.name !== 'Level 1'
                      && !aiSettings.enableExtraction
                      && !aiSettings.enableClassification
                  "
                  :closable="false"
                  severity="info"
                  class="mt-1 p-custom-message"
                >
                  Request admin to enable Auto Tag and Extract Data for
                  AI-driven document data extraction.
                </Message>
                <Message
                  v-else-if="!file.disableAutoTag && !isPortalUser"
                  :closable="false"
                  severity="info"
                  class="mt-1 p-custom-message"
                >
                  {{
                    file.isAutoTag
                      ? `BrightAssistant identifies document
                  types, tags them, and extracts essential data from the
                  documents.
                  `
                      : `Enable Auto tag/extraction to automatically add tags to this
                  document.`
                  }}
                  <a
                    v-if="file.isAutoTag"
                    href="https://brightreturn.com/blog/document-extraction-with-ai/?nocache=47487"
                    target="_blank"
                    class="font-medium underline mt-2"
                  >
                    Learn more
                  </a>
                </Message>
                <TagsAddTag
                  v-if="!file.isAutoTag"
                  tag-type="DOCUMENT"
                  is-uploader
                  @change="handleTagChange(file, $event)"
                />
              </template>
            </div>
            <div>
              <FileUploadButton
                type="button"
                icon="pi pi-times"
                class="p-button-danger"
                @click="remove(index)"
              />
            </div>
          </div>
          <!-- <Divider v-if="index !== files.length - 1" /> -->
        </template>
      </div>
      <div v-if="$slots.empty && !hasFiles" class="p-fileupload-empty">
        <slot name="empty" />
      </div>
    </div>
  </div>
  <div v-else-if="isBasic" class="p-fileupload p-fileupload-basic p-component">
    <template v-if="!hideFileUploadMessages">
      <FileUploadMessage
        v-for="msg of messages"
        :key="msg"
        severity="error"
        @close="onMessageClose"
      >
        {{ msg }}
      </FileUploadMessage>
    </template>
    <span
      v-ripple
      :class="basicChooseButtonClass"
      :style="style"
      tabindex="0"
      @mouseup="onBasicUploaderClick"
      @keydown.enter="choose"
      @focus="onFocus"
      @blur="onBlur"
    >
      <span :class="basicChooseButtonIconClass" />
      <span v-if="!hideChooseButtonLabel" class="p-button-label">{{
        basicChooseButtonLabel
      }}</span>
      <input
        v-if="!hasFiles"
        ref="fileInput"
        type="file"
        :accept="accept"
        :disabled="disabled"
        :multiple="multiple"
        @change="onFileSelect"
        @focus="onFocus"
        @blur="onBlur"
      >
    </span>
  </div>
  <CommonSubscribeDialog
    v-if="subscribeDialog"
    :visible="subscribeDialog"
    :feature="upgradeFeature"
    @hide="subscribeDialog = false"
  />
</template>

<style lang="scss" scoped>
.p-fileupload-content {
  position: relative;
}

.p-fileupload-row {
  display: flex;
  align-items: center;

  @media (width <= 768px) {
    flex-direction: column;
  }
}

.p-fileupload-row > div {
  flex: 1 1 auto;
  width: auto;
}

.p-fileupload-row > div:last-child {
  text-align: right;
}

.p-fileupload-content .p-progressbar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.p-button.p-fileupload-choose {
  position: relative;
  overflow: hidden;
}

.p-button.p-fileupload-choose input[type='file'] {
  display: none;
}

.p-fileupload-choose.p-fileupload-choose-selected input[type='file'] {
  display: none;
}

.p-fileupload-filename {
  word-break: break-all;
}

.p-fluid .p-fileupload .p-button {
  width: auto;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, 110px);
  row-gap: 7px;
}
</style>
