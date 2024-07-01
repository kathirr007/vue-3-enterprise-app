declare namespace Intl {
  type Key =
    | 'calendar'
    | 'collation'
    | 'currency'
    | 'numberingSystem'
    | 'timeZone'
    | 'unit';

  function supportedValuesOf(input: Key): string[];
}

declare module 'quill-image-uploader';
declare module 'vue-star-rating';
