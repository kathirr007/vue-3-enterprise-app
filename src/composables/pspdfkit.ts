import $api from '@/plugins/api';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import type { APIActions } from '@/types/common.type';
import {
  Annotation,
  type Instance,
  type List,
  type Rect,
  type WidgetAnnotation,
  type AnnotationsUnion,
} from 'pspdfkit';
import PSPDFKit from 'pspdfkit';
import type { PSPDFKey } from '@/types/esignature.type';

export type OmittedPSPDFKitFormFields =
  | 'toSerializableObject'
  | 'fromSerializableObject';

export type PSPDFKitFormFieldKeys = Exclude<
  keyof typeof PSPDFKit.FormFields,
  OmittedPSPDFKitFormFields
>;

type WidgetDimension = {
  width: number;
  height: number;
};

const { isPortalUser } = useCurrentUserData();
const { initToast } = useToasts();
const { isFalsy } = useUtilityFns();

export function usePSPDFKit(instance: Instance) {
  const annotations = ref(0);
  const removeAnnotationDialog = ref(false);
  const annotationToRemove = ref<Annotation>();
  const annotationsCount = computed({
    get: () => {
      return annotations.value;
    },
    set: (value: number) => {
      annotations.value = value;
    },
  });

  const getPSPDFKitKey = async (isPortalUser?: boolean) => {
    const { data } = await $api.get<PSPDFKey>(
      `${isPortalUser ? `portal/integrations/pspdf` : `integrations/pspdf`}`
    );
    return data;
  };

  const getSignatureWidgets = async (
    instance: Instance,
    isSignatureAnn = false
  ) => {
    const pagesPromises = Array.from({ length: instance.totalPageCount }).map(
      (_, index) => {
        return instance.getAnnotations(index);
      }
    );
    const annotationsByPage = await Promise.all(pagesPromises);

    const formFields = await instance.getFormFields();
    const signatureWidgetAnnotations = annotationsByPage.reduce(
      (acc, pageAnnotations) => {
        const pageWidgetAnnotations = pageAnnotations.filter((annotation) =>
          isSignatureAnn
            ? annotation.formFieldName || annotation.isSignature
            : annotation.formFieldName
        );
        const pageSignatureWidgetAnnotations = pageWidgetAnnotations.filter(
          (annotation) =>
            isSignatureAnn
              ? pageAnnotations.find(
                  (ann: AnnotationsUnion) => ann.name === annotation.name
                )
              : formFields.find(
                  (formField) =>
                    formField.name === annotation.formFieldName &&
                    formField instanceof PSPDFKit.FormFields.SignatureFormField
                )
        );
        return pageSignatureWidgetAnnotations.size > 0
          ? (acc.concat(
              pageSignatureWidgetAnnotations.toArray() as never[]
            ) as never[])
          : acc;
      },
      []
    );
    // console.log('signatureWidgetAnnotations', signatureWidgetAnnotations);

    return signatureWidgetAnnotations;
  };

  const getSignatureWidgetOfSign = async (
    instance: Instance,
    annotationToCheck: AnnotationsUnion
  ) => {
    const signatureWidgets = await getSignatureWidgets(instance);

    return (
      signatureWidgets.length &&
      signatureWidgets.find((annotation: AnnotationsUnion) => {
        if (annotationToCheck.isSignature) {
          return (
            annotationToCheck.pageIndex === annotation.pageIndex &&
            annotation.boundingBox.isRectOverlapping(
              annotationToCheck.boundingBox
            )
          );
        }
        return annotation.name === annotationToCheck.name;
      })
    );
  };

  const getSignatureOfWidget = async (
    instance: Instance,
    annotationToCheck: AnnotationsUnion
  ) => {
    const signatureWidgets = await getSignatureWidgets(instance, true);

    return (
      signatureWidgets.length &&
      signatureWidgets.find(
        (annotation: AnnotationsUnion) =>
          annotation.name === annotationToCheck.name && annotation.isSignature
      )
    );
  };

  const fitIn = (size: WidgetDimension, containerSize: WidgetDimension) => {
    const { width, height } = size;

    const widthRatio = containerSize.width / width;
    const heightRatio = containerSize.height / height;

    const ratio = Math.min(widthRatio, heightRatio);

    return {
      width: width * ratio,
      height: height * ratio,
    };
  };

  const showToast = (actionType: APIActions, title: string, data: any) => {
    initToast({
      actionType,
      title,
    });
  };

  const prepareRemoveAnnotation = (
    annotation: Annotation,
    currentInstance: Instance
  ) => {
    instance = currentInstance;
    removeAnnotationDialog.value = true;
    annotationToRemove.value = annotation;
  };

  const removeAnnotation = (annotation: Annotation) => {
    instance.delete(annotation.id).then((annotation: any[]) => {
      // showToast('Remove', 'Annotation', annotation[0]);
    });
  };
  const createFormField = async ({
    pageIndex,
    pageRect,
    formField,
    value,
    isDateField,
    customData,
  }: {
    pageRect: Rect;
    pageIndex: number;
    formField: PSPDFKitFormFieldKeys;
    isDateField?: boolean;
    value?: any;
    customData?: any;
  }) => {
    // Create a new text form field.

    let widget: WidgetAnnotation;
    let createdFormField: any;
    // const formFieldId = PSPDFKit.generateInstantId();
    const currentDatetime = new Date().toISOString().slice(0, 19);
    const formFieldId = `${nanoid().toUpperCase()}_${currentDatetime}`;

    widget = new PSPDFKit.Annotations.WidgetAnnotation({
      id: formFieldId,
      pageIndex,
      boundingBox: pageRect,
      formFieldName: `${formField}_${formFieldId}`,
      name: `${formField}_${formFieldId}`,
      // borderWidth: formField !== 'SignatureFormField' ? 10 : 0,
      // borderStyle: formField !== 'SignatureFormField' ? 'solid' : undefined,
      // borderColor: PSPDFKit.Color.TRANSPARENT,
      creatorName: customData ? customData.creatorName : null,
      customCreatedDate: dayjs(),
      customData,
      fontSize: 14,
    });

    createdFormField = new PSPDFKit.FormFields[formField]({
      formFieldName: `${formField}_${formFieldId}`,
      name: `${formField}_${formFieldId}`,
      annotationIds: PSPDFKit.Immutable.List([widget.id]),
      value,
      creatorName: customData ? customData.creatorName : null,
      customCreatedDate: dayjs(),
      customData,
    });

    if (isDateField) {
      widget = new PSPDFKit.Annotations.WidgetAnnotation({
        // borderWidth: formField !== 'SignatureFormField' ? 10 : 0,
        // borderStyle: formField !== 'SignatureFormField' ? 'solid' : undefined,
        // borderColor: PSPDFKit.Color.TRANSPARENT,
        id: formFieldId,
        pageIndex,
        formFieldName: `DateFormField_${formFieldId}`,
        name: `DateFormField_${formFieldId}`,
        boundingBox: pageRect,
        creatorName: customData ? customData.creatorName : null,
        customCreatedDate: dayjs(),
        customData,
        fontSize: 14,
        additionalActions: {
          onFormat: new PSPDFKit.Actions.JavaScriptAction({
            script: 'AFDate_FormatEx("mm/dd/yyyy")',
          }),
        },
      });

      createdFormField = new PSPDFKit.FormFields[formField]({
        name: `DateFormField_${formFieldId}`,
        group: `DateFormField_${formFieldId}`,
        annotationIds: PSPDFKit.Immutable.List([widget.id]),
        creatorName: customData ? customData.creatorName : null,
        customCreatedDate: dayjs(),
        customData,
        value,
      });
    }

    instance.create([widget, createdFormField]).then(async (annotations) => {
      // console.log(annotations[0]);

      if (formField !== 'SignatureFormField') {
        instance.setSelectedAnnotations(
          annotations[0] as unknown as List<AnnotationsUnion>
        );
      }
      /* else {
        instance.setSelectedAnnotation(
          annotations[0] as unknown as AnnotationsUnion
        );
      } */
    });
  };

  const createTextAnnotation = async ({
    pageIndex,
    pageRect,
    textValue,
    customData,
    label,
    fieldName,
  }: {
    pageRect: Rect;
    pageIndex: number;
    fieldName: string;
    textValue?: any;
    label?: any;
    customData?: any;
  }) => {
    // Create a new text form field.

    // let textAnnotation: Annotation;
    // const formFieldId = PSPDFKit.generateInstantId();
    const currentDatetime = new Date().toISOString().slice(0, 19);
    const formFieldId = `${nanoid().toUpperCase()}_${currentDatetime}`;

    const textContent = !isFalsy(textValue)
      ? `<p><span data-field="${fieldName}" style="display: block; font-weight:bold;">${textValue}</span></p>`
      : `<p><span data-label="${label}" style="display: block;font-weight:bold;">${label}</span></p><p style="display: none;"><span data-field="${fieldName}" style="display: none;"></span></p>`;

    const textElement = document.createElement('div');
    textElement.style.fontSize = '12px';
    textElement.style.width = '220px';
    textElement.style.height = 'auto';
    textElement.style.position = 'absolute';
    textElement.style.visibility = 'hidden';
    textElement.innerHTML = textContent;
    document.body.appendChild(textElement);
    const textContentHeight = textElement.offsetHeight;
    document.body.removeChild(textElement);

    const { width, left, top } = pageRect;

    const newBoundingBox = new PSPDFKit.Geometry.Rect({
      width,
      left,
      top,
      height: textContentHeight,
    });

    let textAnnotation = new PSPDFKit.Annotations.TextAnnotation({
      id: formFieldId,
      pageIndex,
      boundingBox: newBoundingBox,
      formFieldName: `${formFieldId}`,
      name: `${fieldName}`,
      creatorName: customData ? customData.creatorName : null,
      customCreatedDate: dayjs(),
      createdAt: dayjs().toDate(),
      customData,
      fontSize: 10,
      text: {
        format: 'xhtml',
        value: textContent,
      },
    });

    textAnnotation = textAnnotation.set('lockedContents', true);
    textAnnotation = textAnnotation.set('readOnly', true);

    instance.create([textAnnotation]).then(async (annotations) => {
      // console.log('textAnnotation', annotations[0]);

      instance.setSelectedAnnotations(
        annotations[0] as unknown as List<AnnotationsUnion>
      );
    });
  };

  return {
    annotationsCount,
    removeAnnotationDialog,
    annotationToRemove,
    getPSPDFKitKey,
    getSignatureWidgetOfSign,
    getSignatureOfWidget,
    fitIn,
    createFormField,
    createTextAnnotation,
    prepareRemoveAnnotation,
    removeAnnotation,
  };
}
