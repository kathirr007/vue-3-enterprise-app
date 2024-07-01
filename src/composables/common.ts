import $api from '@/plugins/api';
import app from '@/app';
import type {
  EditorPlaceholderOption,
  EditorPlaceholderScope,
  MetaObj,
  TimelineSteps
} from '@/types/common.type';
import type {
  SchemaForm,
  SchemaFormField,
  SchemaFormRef
} from '@/types/schemaform.type';
import type { FullNameObj, User } from '@/types/teams.type';
import { breakpointsAntDesign as $screen, useBreakpoints } from '@vueuse/core';
import type { ComputedRef, MaybeRef, Ref, VNode } from 'vue';
import { useQuery } from 'vue-query';
import type { EntityType } from '@/types/tasks.type';
import { useEntityPriorityList, useEntityStatusList } from './tasks';
import dayjs from 'dayjs';
import type { TabViewChangeEvent } from 'primevue/tabview';
import type TabView from 'primevue/tabview';
import { useRouteQuery } from '@vueuse/router';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import weekday from 'dayjs/plugin/weekday';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { AccountingPeriodOptions, Client } from '@/types/client.type';
import duration from 'dayjs/plugin/duration';
import type { DurationUnitType } from 'dayjs/plugin/duration';
import type { EntityPriority, EntityStatus } from '@/types/status-entity.type';
import type { LocationQueryRaw, RouteParamsRaw } from 'vue-router';
import type { Card } from '@/types/dashboard.type';

// import { publicIpv4, publicIpv6 } from 'public-ip';

dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(updateLocale);
dayjs.extend(quarterOfYear);
dayjs.extend(weekday);

// dayjs.extend(utc);
const thresholds = [
  { l: 's', r: 30 },
  { l: 'ss', r: 59, d: 'second' },
  { l: 'm', r: 1 },
  { l: 'mm', r: 59, d: 'minute' },
  { l: 'h', r: 1 },
  { l: 'hh', r: 23, d: 'hour' },
  { l: 'd', r: 1 },
  { l: 'dd', r: 29, d: 'day' },
  { l: 'M', r: 1 },
  { l: 'MM', r: 11, d: 'month' },
  { l: 'y' },
  { l: 'yy', d: 'year' }
];
const config = {
  thresholds,
  rounding: Math.floor
};

dayjs.extend(relativeTime, config);
dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    ss: '%d seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years'
  }
});

const { currentUser } = useCurrentUserData();

export const mock = {
  enableGlobalMock: import.meta.env.VITE_APP_ENABLE_MOCK_DATA === 'true',
  enableTeamsMock: import.meta.env.VITE_APP_ENABLE_TEAMS_MOCK_DATA === 'true'
};

export function useCommonBreakPoints() {
  const $screens = useBreakpoints($screen);
  const isExtraSmall = ref($screens.xs); // 480px
  const isSmall = ref($screens.sm); // 576px
  const isMedium = ref($screens.md); // 768px
  const isLarge = ref($screens.lg); // 992px
  const isExtraLarge = ref($screens.xl); // 1200px
  const isDoubleExtraLarge = ref($screens.xxl); // 1600px

  const defaultBreakpoints = {
    [`${$screen.lg}px`]: '60vw',
    [`${$screen.sm}px`]: '90vw'
  };

  const smallBreakPoint = { [`${$screen.sm}px`]: '90vw' };

  const styles = {
    width: '30vw'
  };

  return {
    defaultBreakpoints,
    smallBreakPoint,
    styles,
    $screen,
    $screens,
    isExtraSmall,
    isSmall,
    isMedium,
    isLarge,
    isExtraLarge,
    isDoubleExtraLarge
  };
}

export function useVueFilters() {
  function replaceClient(content: string) {
    if (useUtilityFns().isFalsy(content))
      return '';
    return content.replace('client', `${$tConfig('CLIENT').toLowerCase()}`).replace('Client', `${$tConfig('CLIENT')}`);
  }

  function pluralize(word: string) {
    if (!word)
      return '';
    // Handle common irregular plural forms:
    const irregularPlurals: any = {
      man: 'men',
      woman: 'women',
      child: 'children',
      tooth: 'teeth',
      mouse: 'mice',
      foot: 'feet',
      ox: 'oxen',
      goose: 'geese',
      sheep: 'sheep',
      deer: 'deer',
      fish: 'fish',
      series: 'series',
      species: 'species',
      information: 'information',
      equipment: 'equipment',
      aircraft: 'aircraft',
      software: 'software',
      media: 'media',
      data: 'data'
    };

    // Check for irregular plural forms:
    if (word.toLowerCase() in irregularPlurals) {
      return irregularPlurals[word.toLowerCase()];
    }

    // Handle words ending in "y" preceded by a consonant:
    if (word.endsWith('y') && word[-2] !== 'a' && word[-2] !== 'e' && word[-2] !== 'i' && word[-2] !== 'o' && word[-2] !== 'u') {
      return `${word.slice(0, -1)}ies`;
    }

    // Handle words ending in "o" preceded by a vowel:
    if (word.endsWith('o') && (word[-2] === 'a' || word[-2] === 'e' || word[-2] === 'i' || word[-2] === 'o' || word[-2] === 'u')) {
      return `${word}s`;
    }

    // Handle words ending in a consonant preceded by a vowel:
    if (word.endsWith('ch') || word.endsWith('sh') || word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) {
      return `${word}es`;
    }

    // Otherwise, add "s" for most cases:
    return `${word}s`;
  }

  const toCamelCase = (str: string) => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  };
  const titleCase = (str: string, splitter = ' ', joiner = ' ') => {
    if (!str)
      return '';
    let splitStr = str.toLowerCase().split(splitter);
    splitStr = splitStr.map(
      item => item.charAt(0).toUpperCase() + item.substring(1)
    );
    return splitStr.join(joiner);
  };
  const fullName = (value: Partial<FullNameObj>) => {
    if (value) {
      if (value.firstName || value.lastName) {
        return `${value.firstName ? titleCase(value.firstName) : ''}${
          value.lastName ? ` ${titleCase(value.lastName)}` : ''
        }`;
      }
      if (value.email) {
        return `${value.email}`;
      }
    }

    return '';
  };

  const initials = (val: string) => {
    if (!val)
      return 'NA';
    const parts = val.split(' ');
    let initials = '';
    if (parts[0]) {
      initials += parts[0][0].toString().toUpperCase();
    }
    if (parts[1]) {
      initials += parts[1][0].toString().toUpperCase();
    }
    return initials;
  };

  const ISODatestringToDate = (dateString: string) => {
    if (dateString) {
      const date = new Date(dateString);
      return date as Date | Date[] | undefined;
    }
    return undefined;
  };

  const timeSpent = (
    date1: Date | string,
    unit: DurationUnitType = 'ms',
    date2?: Date | string
  ) => {
    const duration = dayjs.duration(
      date2
        ? dayjs(date2).diff(dayjs(date1), unit)
        : dayjs().diff(dayjs(date1), unit),
      unit
    );

    return duration;
  };

  const getYear = (date: Date | string) => {
    return dayjs(date).year();
  };

  const timeSpentReadable = (args: any) => {
    const { timeDuration, date1, date2, unit, units, day } = args;
    const duration = timeDuration
      ? dayjs.duration(timeDuration, unit)
      : timeSpent(date1, unit, date2);
    let d: string | number = duration.get('d');
    let h: string | number = duration.get('h');
    let m: string | number = duration.get('m');
    let s: string | number = duration.get('s');

    d = String(d).padStart(2, '0');
    h = String(h).padStart(2, '0');
    m = String(m).padStart(2, '0');
    s = String(s).padStart(2, '0');
    let readableTime: string;
    if (units) {
      readableTime = day ? `${d}d:${h}h:${m}m:${s}s` : `${h}h:${m}m:${s}s`;
    }
    else {
      readableTime = day ? `${d}:${h}:${m}:${s}` : `${h}:${m}:${s}`;
    }

    return readableTime;
  };

  const convertMinsToHrsMins = (mins: number) => {
    let h: string | number = Math.floor(mins / 60);
    let m: string | number = mins % 60;
    h = String(h).padStart(2, '0');
    m = String(m).padStart(2, '0');
    return `${h}h:${m}m` || '00h:00m';
  };

  const dateToHumanShort = (date: string, format = 'MMMM D, YYYY') => {
    return dayjs(date).format(format);
  };

  const dateToDateTime = (
    dateString?: string,
    dateFormat = 'MMM D, YYYY',
    timeFormat = 'hh:mm:ss A'
  ) => {
    const date = dateString
      ? dayjs(dateString).format(dateFormat)
      : dayjs().format(dateFormat);
    const time = dateString
      ? dayjs(dateString).format(timeFormat)
      : dayjs().format(timeFormat);
    return {
      date,
      time
    };
  };
  const relativeTime = (date: string) => {
    return dayjs().to(dayjs(date));
  };

  // function to take mins as input and give hours or days as output
  const useHumanDayString = (time: number) => {
    if (time < 60) {
      return `${time} mins`;
    }
    else if (time < 1440) {
      return `${Math.floor(time / 60)} hours`;
    }
    else {
      return `${Math.floor(time / 1440)} days`;
    }
  };

  const fileIcon = (filename: string) => {
    // const images = require.context('@/assets/', false);
    const images = (file: string) => `/images/icons/${file}`;
    let imageUrl = null;
    if (filename) {
      if (filename.endsWith('.png')) {
        imageUrl = images('png_icon.png');
      }
      else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
        imageUrl = images('jpg_icon.png');
      }
      else if (filename.endsWith('.pdf')) {
        imageUrl = images('pdf_icon.png');
      }
      else if (
        filename.endsWith('.xlsx')
        || filename.endsWith('.xls')
        || filename.endsWith('.xlsb')
        || filename.endsWith('.xlsm')
        || filename.endsWith('.xltm')
        || filename.endsWith('.xltx')
      ) {
        imageUrl = images('xls_icon.png');
      }
      else if (filename.endsWith('.ppt') || filename.endsWith('.pptx')) {
        imageUrl = images('ppt_icon.png');
      }
      else if (filename.endsWith('.csv') || filename.endsWith('.tsv')) {
        imageUrl = images('xls_icon.png');
      }
      else if (
        filename.endsWith('.docx')
        || filename.endsWith('.doc')
        || filename.endsWith('.docm')
        || filename.endsWith('.dotx')
        || filename.endsWith('.dotm')
      ) {
        imageUrl = images('doc_icon.png');
      }
      else if (filename.endsWith('.xml')) {
        imageUrl = images('xml_icon.png');
      }
      else if (filename.endsWith('.json')) {
        imageUrl = images('json_icon.png');
      }
      else if (filename.endsWith('.zip') || filename.endsWith('.001')) {
        imageUrl = images('zip_icon.png');
      }
      else if (filename.endsWith('.msi')) {
        imageUrl = images('msi_icon.png');
      }
      else {
        imageUrl = images('file_icon.png');
      }
    }
    return imageUrl;
  };

  const fileKind = (value: string) => {
    if (value) {
      if (value.endsWith('.png')) {
        return 'PNG File';
      }
      if (value.endsWith('.jpg') || value.endsWith('.jpeg')) {
        return 'JPG File';
      }
      if (value.endsWith('.pdf')) {
        return 'PDF File';
      }
      if (
        value.endsWith('.xlsx')
        || value.endsWith('.xls')
        || value.endsWith('.xlsb')
        || value.endsWith('.xlsm')
        || value.endsWith('.xltm')
        || value.endsWith('.xltx')
      ) {
        return 'Excel File';
      }
      if (value.endsWith('.csv') || value.endsWith('.tsv')) {
        return 'Excel Comma Seperated Values File';
      }
      if (
        value.endsWith('.docx')
        || value.endsWith('.doc')
        || value.endsWith('.docm')
        || value.endsWith('.dotx')
        || value.endsWith('.dotm')
      ) {
        return 'Document File';
      }
      if (value.endsWith('.txt') || value.endsWith('.rtf')) {
        return 'Text Document';
      }
      return 'File';
    }
    return 'File folder';
  };
  const getInlCurrencyNumber = (
    val: number,
    currency = 'USD',
    locale = 'en-US'
  ) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(val);
  };

  const formatFileSize = (fileSize: number, precision = 2) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let index = 0;
    let formattedSize = fileSize;

    while (formattedSize >= 1 && index < units.length) {
      if (formattedSize < 1024) {
        break;
      }

      formattedSize /= 1024;
      index++;
    }

    return `${formattedSize.toFixed(precision)} ${units[index]}`;
  };

  return {
    toCamelCase,
    titleCase,
    fullName,
    initials,
    ISODatestringToDate,
    convertMinsToHrsMins,
    dateToHumanShort,
    dateToDateTime,
    relativeTime,
    useHumanDayString,
    timeSpent,
    timeSpentReadable,
    getYear,
    fileIcon,
    fileKind,
    getInlCurrencyNumber,
    formatFileSize,
    pluralize,
    replaceClient
  };
}

export function useUtilityFns() {
  const docViewerSupportedFiles = ['pdf'];

  function formatNumberWithUnit(value: number): string {
    // Define units and their corresponding thresholds
    const units = [
      { unit: 'k', threshold: 1000 },
      { unit: 'M', threshold: 1000000 },
      { unit: 'B', threshold: 1000000000 }
    ];

    // Check for zero or negative values
    if (value === 0) {
      return '0';
    }
    else if (value < 0) {
      return `-${formatNumberWithUnit(Math.abs(value))}`; // Handle negative values
    }

    // Find the appropriate unit based on the threshold
    const matchingUnit = units.find(unit => value >= unit.threshold);

    // Calculate the scaled value and format the output
    const scaledValue = value / (matchingUnit ? matchingUnit.threshold : 1);
    const formattedValue = scaledValue.toFixed(0); // Adjust decimal places as needed

    return `${formattedValue}${matchingUnit?.unit || ''}`;
  }

  function extractValuesOfKey(obj: Record<string, any>, keyToExtract: string) {
    const valuesOfKey: any[] = [];

    function traverse(value: any) {
      if (typeof value === 'object' && value !== null) {
        if (keyToExtract in value) {
          valuesOfKey.push(value.attachmentId);
        }
        else {
          Object.values(value).forEach(traverse);
        }
      }
      else if (Array.isArray(value)) {
        value.forEach(traverse);
      }
    }

    traverse(obj);
    return valuesOfKey;
  }

  const getRandomString = (length = 24): string => {
    let randomString = '';
    const alphanumerics = 'abcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i += 1) {
      randomString
        += alphanumerics[Math.floor(Math.random() * 100) % alphanumerics.length];
    }
    return randomString;
  };

  const transformBulkLeaves = (usersArray: any) => {
    const transformedData = [];
    for (const user of usersArray) {
      for (const userId of user.userId) {
        const transformedObject = {
          userId,
          typeId: user.typeId,
          year: user.year,
          days: user.days
        };
        transformedData.push(transformedObject);
      }
    }
    return transformedData;
  };

  const maskedCode = (code: string, showDigits: number) => {
    if (!code)
      return '';
    const numXs = code.length - showDigits;
    const maskIN = 'x'.repeat(numXs) + code.slice(-showDigits);
    return maskIN;
  };

  const sortCompare
    = ({
      compareProp,
      isDate = false,
      order = 'asc',
      dateFormat = 'DD-MM-YYYY'
    }: {
      compareProp: string | number;
      isDate?: boolean;
      order?: 'asc' | 'desc';
      dateFormat?: string;
    }) =>
      (a: Record<string, any>, b: Record<string, any>) => {
        if (isDate) {
          const x = dayjs(a[`${compareProp}`], dateFormat);
          const y = dayjs(b[`${compareProp}`], dateFormat);
          if (order === 'asc') {
            return x < y ? -1 : 1;
          }
          return x > y ? -1 : 1;
        }
        if (order === 'asc') {
          return a[`${compareProp}`] < b[`${compareProp}`] ? -1 : 1;
        }
        return a[`${compareProp}`] > b[`${compareProp}`] ? -1 : 1;
      };

  const groupArrByProb = (arr: any[], groupProp: string | number) => {
    const result: Record<string, any> = {};
    if (Array.isArray(arr)) {
      arr.forEach((item) => {
        const groupName = item[groupProp];
        if (Object.prototype.hasOwnProperty.call(result, groupName)) {
          result[groupName].push(item);
        }
        else {
          result[groupName] = [];
          result[groupName].push(item);
        }
      });
    }
    return result;
  };

  const metaFilter = (metaObj: MetaObj[], key: string) => {
    return metaObj?.filter(meta => meta.metaKey === key)[0]?.metaValue;
  };

  const isUndefEmptyStr = (val: any): boolean => {
    // 👇️ check for multiple conditions
    if (val === undefined || val === '') {
      return true;
    }
    return false;
  };

  const isNullUndefEmptyStr = (val: any): boolean => {
    // 👇️ check for multiple conditions
    // if (val === null || val === undefined || val === '') {
    if (val === null || isUndefEmptyStr(val)) {
      return true;
    }
    return false;
  };

  const isFalsy = (value: any) => {
    return (
      value === false
      || value === 0
      || value === ''
      || value === null
      || value === undefined
      || (Array.isArray(value) && value.length === 0)
      || (typeof value === 'object' && Object.keys(value).length === 0)
    );
  };

  const isObjNullUndefEmptyStr = (obj: Record<string, any>): boolean =>
    Object.values(obj).every((value) => {
      if (value !== null && typeof value === 'object') {
        if (
          (value.length === undefined && Object.keys(value).length === 0)
          || value.length === 0
        ) {
          return true;
        }
        return isObjNullUndefEmptyStr(value);
      }
      return isNullUndefEmptyStr(value);
    });

  const assignObj1ToObj2 = (
    obj1: any,
    obj2: any,
    replaceEmpty?: boolean,
    replaceVal?: any
  ) => {
    Object.entries(obj1).forEach(([key, val]) => {
      if (replaceEmpty) {
        if (isUndefEmptyStr(obj1[key])) {
          obj2[key] = replaceVal || null;
        }
        if (!isUndefEmptyStr(obj1[key])) {
          obj2[key] = val;
        }
      }
      else {
        if (!isNullUndefEmptyStr(obj1[key])) {
          obj2[key] = val;
        }
      }
    });
    return obj2;
  };

  const filterObjArrByValues = (
    objArrToFilter: Record<string, any>[],
    valuesToCheck: string[],
    nestedArrProp: string,
    keyToCheck: string
  ) => {
    return objArrToFilter.filter((item: any) => {
      if (valuesToCheck.includes(item[keyToCheck])) {
        if (item[nestedArrProp]) {
          // If the menu has items, filter them recursively
          item[nestedArrProp] = filterObjArrByValues(
            item[nestedArrProp],
            valuesToCheck,
            nestedArrProp,
            keyToCheck
          );
        }
        return true;
      }
      return false;
    });
  };

  const filterObjArrByKeyValue = (arr: any[], key: string, val: any): any[] =>
    arr.filter(t => t[key] === val);

  const filterObjByKey = (obj: any, filterProp: any) =>
    Object.fromEntries(
      Object.entries(obj).filter(([prop]) => prop === filterProp)
    );
  const filterObjByKeys = (
    objectToFilter: any,
    keysToInclude: any[],
    isInverse = false
  ) => {
    return Object.entries(objectToFilter).reduce(
      (filteredObject, [key, value]) => {
        if (isInverse) {
          if (!keysToInclude.includes(key)) {
            filteredObject[key] = value;
          }
        }
        else {
          if (keysToInclude.includes(key)) {
            filteredObject[key] = value;
          }
        }
        return filteredObject;
      },
      {} as any
    );
  };
  const filterObjByValue = (obj: any, filterValue: any) =>
    Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value === filterValue)
    );
  const filterObjByValues = (objectToFilter: any, valuesToInclude: any[]) => {
    return Object.entries(objectToFilter).reduce(
      (filteredObject, [key, value]) => {
        if (valuesToInclude.includes(value)) {
          filteredObject[key] = value;
        }
        return filteredObject;
      },
      {} as any
    );
  };

  const objectArrSumTotal = (arr: any[], sumProp: string) => {
    if (!arr.length)
      return 0;
    return arr
      .map((item) => {
        return filterObjByKey(item, sumProp);
      })
      .reduce((prv, cur: any) => prv + cur[sumProp], 0);
  };

  const removeFalsyValues = (
    obj: any,
    except: string[] = [],
    removeKey: string[] = []
  ) => {
    Object.keys(obj).forEach((key) => {
      if (!except.includes(key)) {
        if (!obj[key]) {
          delete obj[key];
        }
      }
      if (removeKey.includes(key)) {
        delete obj[key];
      }
    });
    return obj;
  };

  const arrDiff = (arr1: any[], arr2: any[]) => {
    return arr2.filter(item => !arr1.includes(item));
  };

  function getDifferenceByIndex(arr1: any[], arr2: any[]) {
    if (arr1.length !== arr2.length) {
      throw new Error('Arrays must have the same length for comparison.');
    }

    const difference = [];
    for (let i = 0; i < arr1.length; i++) {
      const obj1 = arr1[i];
      const obj2 = arr2[i];
      const isEqual = JSON.stringify(obj1) === JSON.stringify(obj2);
      if (!isEqual) {
        difference.push(arr2[i]);
      }
    }

    return difference;
  }

  const focusAndBlurInput = async (
    formRef: Ref<SchemaFormRef>,
    field?: string,
    tag?: string,
    blur = true
  ) => {
    const firstInput = formRef.value?.schemaForm.querySelector(
      `${tag || 'input'}[id='${field}']`
    ) as HTMLInputElement;
    firstInput?.focus();
    if (blur) {
      firstInput?.blur();
    }
  };

  const focusFirstInput = (formRef: Ref<SchemaFormRef>) => {
    (
      formRef.value?.schemaForm.getElementsByTagName(
        'input'
      )[0] as HTMLInputElement
    ).focus();
  };

  const getProgressBarColor = (value: number) => {
    /* if (value < 25) {
      return 'red-500';
    } else if (value < 75) {
      return 'orange-500';
    } else {
      return 'green-500';
    } */
    return `progress-${Math.ceil(value / 10) * 10}`;
  };

  const getExtension = (filename: string) => {
    if (!filename)
      return '';
    const parts = filename.split('.');
    return parts[parts.length - 1];
  };

  const getFilename = (filename: string) => {
    if (!filename)
      return '';
    return filename.split('.').slice(0, -1).join('.');
  };

  const getFileIcon = (name: string) => {
    const extension = getExtension(name);
    switch (extension) {
      case 'pdf':
        return 'pi-pdf';
      case 'doc' || 'docx' || 'docm' || 'dotx' || 'dotm':
        return 'pi-doc';
      case 'xls' || 'xlsx' || 'xlsm' || 'xlsb' || 'xltm' || 'xltx' || 'xlt':
        return 'pi-xls';
      case 'ppt' || 'pptx' || 'pptm' || 'potx' || 'potm' || 'ppam' || 'ppsx':
        return 'pi-ppt';
      case 'png':
        return 'pi-png';
      case 'jpg' || 'jpeg':
        return 'pi-jpg';
      case 'gif':
        return 'pi-gif';
      case 'svg':
        return 'pi-svg';
      default:
        return 'pi-unknown-file';
    }
  };

  function isImageExt(fileName: string) {
    const imageExtensions = /\.(jpe?g|png|gif|svg)$/i;
    if (imageExtensions.test(fileName)) {
      return true;
    }
    return false;
  }

  function getIcons(name: string) {
    switch (name) {
      case 'PDF':
        return 'pi-pdf';
      case 'PNG Image':
        return 'pi-png';
      case 'Directory':
        return '';
      case 'JPG Image':
        return 'pi-jpg';
      case 'Spreadsheet':
        return 'pi-excel';
      case 'CSV':
        return 'pi-csv';
      default:
        return 'pi-unknown-file';
    }
  }

  const canOpenDoc = (name: string) => {
    return docViewerSupportedFiles.includes(getExtension(name as string));
  };

  const isJsonStringValid = (str: any) => {
    try {
      JSON.parse(str);
    }
    catch (e) {
      return false;
    }
    return true;
  };

  const removeDuplicatesFromArray = (arr: string[]) => {
    return [...new Set(arr)];
  };

  const getDuplicates = (arr: Record<string, unknown>[], key: string) => {
    return arr.reduce((acc: string[], curr) => {
      const isDuplicate = arr
        .filter(item =>
          typeof item[key] === 'object'
            ? !isObjNullUndefEmptyStr(item[key] as Record<string, any>)
            : !isNullUndefEmptyStr(item[key])
        )
        .filter(item => item[key] === curr[key]).length;

      if (isDuplicate > 1) {
        acc.push(curr[key] as string);
      }
      return acc;
    }, []);
  };

  const openLinkInNewTab = (url: string) => {
    const win = window.open(url, '_blank');
    win?.focus();
  };

  const copyToClipboard = (stringToCopy: string, propToCopy?: string) => {
    useClipboard().copy(stringToCopy);
    if (propToCopy) {
      app.config.globalProperties.$toast.add({
        detail: `${propToCopy} copied to clipboard successfully`,
        severity: 'success',
        life: 3000,
        summary: `Copy ${propToCopy}`
      });
    }
  };

  const getPreviousMonths = (index: number, count: number): string[] => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    const previousMonths = [];
    for (let i = index; i > index - count; i--) {
      if (i < 0) {
        previousMonths.push(months[12 + i]);
      }
      else {
        previousMonths.push(months[i]);
      }
    }
    return previousMonths;
  };

  const getProperValidationDate = (dateString: string) => {
    const [date, ...rest] = dateString.split('T');
    const dateObj = dayjs().toISOString();
    const currentTime = dateObj.split('T')[1];

    return `${date}T${currentTime}`;
  };

  const getBlobFileFromUrl = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return blob;
  };

  const getQueryParams = (url: string) => {
    const params = new URLSearchParams(url.split('?')[1]);
    const entries = params.entries();
    const result: Record<string, any> = {};
    for (const [key, value] of entries) {
      result[key] = value;
    }
    return result;
  };

  const getStringToHTML = (str: string) => {
    return str
      .split(/\\+n+/)
      .map(e => (e ? `<p class="mb-0">${e}</p>` : '<p class="mb-0"></p>'))
      .join('');
  };

  const replaceNewlines = (text: string) => {
    // Split the text by double newlines
    if (!text)
      return '';
    const paragraphs = text.replace(/\*\*(.+)\*\*/gi, `<strong>$1</strong>`).replace(/\\n/g, '\n').split(/\n/);

    // Process each paragraph
    return paragraphs
      .map((paragraph) => {
        if (!paragraph.length) {
          return `<p class="mb-0">&nbsp;</p>`;
        }
        else {
          return `<p class="mb-0">${paragraph}</p>`;
        }
      })
      .join('\n');
  };

  const isImageOrPdf = (fileType: string) => {
    return /(^image\/)|(pdf$)/.test(fileType);
  };

  return {
    extractValuesOfKey,
    getRandomString,
    isImageOrPdf,
    canOpenDoc,
    openLinkInNewTab,
    isJsonStringValid,
    getIcons,
    isImageExt,
    getFileIcon,
    getFilename,
    getExtension,
    getProgressBarColor,
    filterObjArrByValues,
    filterObjByKey,
    filterObjByKeys,
    filterObjByValue,
    filterObjByValues,
    filterObjArrByKeyValue,
    metaFilter,
    isNullUndefEmptyStr,
    isObjNullUndefEmptyStr,
    objectArrSumTotal,
    arrDiff,
    getDifferenceByIndex,
    assignObj1ToObj2,
    groupArrByProb,
    sortCompare,
    focusAndBlurInput,
    focusFirstInput,
    removeFalsyValues,
    removeDuplicatesFromArray,
    getDuplicates,
    copyToClipboard,
    getPreviousMonths,
    getProperValidationDate,
    getBlobFileFromUrl,
    getQueryParams,
    isFalsy,
    docViewerSupportedFiles,
    getStringToHTML,
    transformBulkLeaves,
    maskedCode,
    replaceNewlines,
    formatNumberWithUnit
  };
}

export function useCommonListQueries() {
  const { getAllV2 } = useClientGroups();
  const { getAllStatuses } = useProjectStatus();
  const { getAllLeaveTypes } = useHrmsLeaveBalance();
  const getRoles = (enabled?: boolean | Ref<boolean>, filters?: string) =>
    useQuery('roles-list', () => useRolesList(filters), {
      enabled
    });
  const getUsers = (
    isUserNameMe = false,
    enabled?: boolean | Ref<boolean>,
    filters?: string
  ) => {
    const { data, isLoading, isFetching } = useQuery(
      'users-list',
      () => useUsersListV2({ isUserNameMe, filters }),
      { enabled }
    );

    const myTeamUsers = computed(() => {
      return currentUser.value
        ? data.value?.results.filter((user: User) => {
          return (
            user.manager?.id === currentUser.value?.id
            || user.id === currentUser.value?.id
          );
        })
        : [];
    });

    const activeVerifiedUser = computed(() => {
      return data.value?.results.filter((user: User) => {
        return user.isActive && user.isVerified;
      });
    });
    return {
      data: computed(() => data.value?.results),
      myTeamUsers,
      isLoading,
      isFetching,
      activeVerifiedUser
    };
  };
  const getClients = (enabled?: boolean, filters?: string) => {
    const { data, isLoading, isFetching } = useQuery(
      'client-list',
      () => {
        return useClientListV2({ filters });
      },
      { enabled }
    );
    const clientsWithUsers = computed(() => {
      return data.value?.results.filter((client: Client) => {
        return client._count?.clientUsers;
      });
    });
    return {
      data: computed(() => data.value?.results),
      isLoading,
      isFetching,
      clientsWithUsers
    };
  };

  const getServices = (templates?: boolean) => {
    const { data, isLoading } = useQuery('services-list', () =>
      useServiceListV2({ templates })
    );
    return { data: computed(() => data.value?.results), isLoading };
  };
  const getBroadcastTemplates = ({
    page,
    limit,
    filters,
    sortBy,
    key,
    channel,
    queryKeys
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
    key?: string;
    channel?: string;
    queryKeys?: (Ref<string> | ComputedRef<number>)[];
  }) => {
    return useQuery(
      [
        key || 'broadcast-templates-list',
        ...((queryKeys as (Ref<string> | ComputedRef<number>)[]) || [])
      ],
      () =>
        useBroadcastTemplateListV2({
          page,
          limit,
          filters,
          sortBy,
          channel
        })
    );
  };
  const getBroadcasts = ({
    page,
    limit,
    filters,
    sortBy,
    key,
    queryKeys
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
    key?: string;
    queryKeys?: (Ref<string> | ComputedRef<number>)[];
  }) =>
    useQuery(
      [
        key || 'broadcasts-list',
        ...((queryKeys as (Ref<string> | ComputedRef<number>)[]) || [])
      ],
      () =>
        useBroadcastListV2({
          page,
          limit,
          filters,
          sortBy
        })
    );
  const getTasks = (entityType: EntityType) =>
    useQuery('tasks-list', () => useTasksList({ entityType }));
  const getTimersList = (
    {
      page,
      limit,
      filters,
      isCompleted
    }: {
      page?: number;
      limit?: number;
      filters?: string;
      isCompleted?: boolean;
    },
    restrict: Ref<boolean> = ref(true)
  ) =>
    useQuery(
      'timers-list',
      () =>
        useTimer().timerList({
          page,
          limit,
          isCompleted,
          filters
        }),
      {
        enabled: restrict
      }
    );

  const getCompletedTimersList = (
    {
      page,
      limit,
      filters
    }: {
      page?: number;
      limit?: number;
      filters?: string;
    },
    restrict: Ref<boolean> = ref(true)
  ) =>
    useQuery(
      'completed-timers-list',
      () =>
        useTimer().timerList({
          page,
          limit,
          isCompleted: true,
          filters
        }),
      {
        enabled: restrict
      }
    );

  const getEntitiesUser = (
    clientId = '',
    projectId = '',
    key = 'entities-users'
  ) => useQuery(key, () => useEntitiesUser(clientId, projectId));

  const getProjectList = (
    status: string,
    clientId?: string,
    key = 'projects-list'
  ) => {
    const { data } = useQuery(key, () => useProjectListV2({ status }));
    return { data: computed(() => data.value?.results) };
  };
  const getAllProjectsList = (filters?: string, key = 'all-projects-list') => {
    const { data, isLoading, isFetching } = useQuery(key, () =>
      useProjectListV2({ filters })
    );
    return { data: computed(() => data.value?.results), isLoading, isFetching };
  };
  const getDesignations = (restrict: Ref<boolean> | boolean = true) => {
    const { data } = useQuery(
      'designations-list',
      () => useDesignationListV2({}),
      {
        enabled: restrict
      }
    );

    return { data: computed(() => data.value?.results) };
  };
  const getBusinessEntities = () => {
    const { data } = useQuery('business-entities-list', () =>
      useBusinessEntityListV2({})
    );

    return { data: computed(() => data.value?.results) };
  };
  const getEntityStatuses = ({
    key = 'entity-statuses',
    type,
    successFn,
    enabled,
    isPortal
  }: {
    key: string;
    type: EntityType;
    successFn?: (data: EntityStatus[]) => void;
    enabled?: boolean;
    isPortal?: boolean;
  }) =>
    useQuery(key, () => useEntityStatusList(type, isPortal), {
      onSuccess: (data) => {
        if (successFn) {
          successFn(data);
        }
      },
      enabled
    });

  const getEntityPriorityList = ({
    key = 'entity-priorities',
    type,
    successFn,
    enabled,
    isPortal
  }: {
    key: string;
    type: EntityType;
    enabled?: boolean;
    isPortal?: boolean;
    successFn?: (data: EntityPriority[]) => void;
  }) =>
    useQuery(key, () => useEntityPriorityList(type, isPortal), {
      onSuccess: (data) => {
        if (successFn) {
          successFn(data);
        }
      },
      enabled
    });
  const getCountriesList = (key?: string) =>
    useQuery(key || 'countries-list', () => useCountriesList());
  const getStatesList = (country: Ref, enabled: Ref, key?: string) =>
    useQuery(
      [key || 'states-list', country],
      () => useCountryStatesList({ country: country.value }),
      {
        enabled
      }
    );
  const getClientsWithServices = (key?: string, id?: string) =>
    useQuery(key || 'client-service-list', () =>
      useGetClientsWithService(id as string)
    );
  const getClientsWithBusinessEntity = (
    key?: string,
    id?: string,
    successFn?: (data: Client[]) => void
  ) =>
    useQuery(
      key || 'client-business-entity-list',
      () => useGetClientsWithBusinessEntity(id as string),
      {
        onSuccess: (data) => {
          if (successFn) {
            successFn(data);
          }
        }
      }
    );
  const getUsersWithDesignations = (key?: string, id?: string) =>
    useQuery(key || 'users-designation-list', () =>
      useDesignationUsers(id as string)
    );
  const getGettingStartedSteps = (resourceId: string, key?: string) =>
    useQuery(key || 'getting-started', () => useGettingStartedList(resourceId));
  const getDesignationUsers = (id: string) =>
    useQuery('designations-users', () => useDesignationUsers(id));
  const getClientGroups = (enabled?: MaybeRef<boolean>) =>
    useQuery('client-group-list', () => getAllV2({}), { enabled });
  const getLeaveTypes = () => {
    const { data, isLoading } = useQuery('leave-types-list', () =>
      getAllLeaveTypes()
    );
    return { data: computed(() => data.value), isLoading };
  };
  const getProjectStatuses = () => {
    const { data, isLoading } = useQuery('project-statuses-list', () =>
      getAllStatuses()
    );
    return { data: computed(() => data.value), isLoading };
  };

  return {
    getClients,
    getDesignations,
    getRoles,
    getUsers,
    getServices,
    getBusinessEntities,
    getEntityStatuses,
    getEntityPriorityList,
    getCountriesList,
    getStatesList,
    getGettingStartedSteps,
    getDesignationUsers,
    getBroadcastTemplates,
    getBroadcasts,
    getClientsWithBusinessEntity,
    getClientsWithServices,
    getUsersWithDesignations,
    getTasks,
    getEntitiesUser,
    getCompletedTimersList,
    getProjectList,
    getAllProjectsList,
    getTimersList,
    getClientGroups,
    getLeaveTypes,
    getProjectStatuses
  };
}

export function useUserListOptions(
  makeAPICall: boolean | ComputedRef<boolean> | Ref<boolean> = true,
  filters?: string
) {
  const { data, isLoading, isFetching } = useQuery(
    'users-list',
    () => useUsersListV2({ isUserNameMe: true, filters }),
    {
      enabled: makeAPICall
    }
  );

  return {
    usersListOptions: computed(() => data.value?.results),
    isLoading,
    isFetching
  };
}

export function useAccountingPeriod() {
  const accountingPeriodOptions: AccountingPeriodOptions[] = [
    { value: 'WEEKLY', label: 'WEEKLY', name: 'Week' },
    { value: 'BIWEEKLY', label: 'BIWEEKLY', name: 'Bi-Week' },
    { value: 'MONTHLY', name: 'Month', label: 'MONTHLY' },
    { value: 'QUARTERLY', name: 'Quarter', label: 'QUARTERLY' },
    { value: 'HALFYEARLY', name: 'Bi-Annual', label: 'BIANNUAL' },
    { value: 'YEARLY', name: 'Annual', label: 'ANNUAL' }
  ];

  const weekDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thrusday',
    'Friday',
    'Saturday'
  ];
  const accoutingPeriodLimits = {
    WEEKLY: 6,
    BIWEEKLY: 15,
    MONTHLY: 31,
    QUARTERLY: 92,
    HALFYEARLY: 183,
    YEARLY: 366
  };

  const defaultRemainderDays = {
    WEEKLY: 3,
    BIWEEKLY: 3,
    MONTHLY: 7,
    QUARTERLY: 15,
    HALFYEARLY: 15,
    YEARLY: 15
  };

  let interval: 'month' | 'quarter' | 'year';

  const getExampleDates = ({
    accountingPeriod,
    dueInDays,
    reminderDays
  }: {
    accountingPeriod: string;
    dueInDays: number;
    reminderDays?: number;
  }) => {
    switch (accountingPeriod) {
      case 'WEEKLY': {
        return getWeekDay(dueInDays, reminderDays);
      }
      case 'MONTHLY': {
        interval = 'month';
        return getDates(dueInDays, reminderDays);
      }
      case 'QUARTERLY': {
        interval = 'quarter';
        return getDates(dueInDays, reminderDays);
      }
      case 'YEARLY': {
        interval = 'year';
        return getDates(dueInDays, reminderDays);
      }
      case 'BIWEEKLY': {
        return getBiWeeklyDate(dueInDays, reminderDays);
      }
      case 'HALFYEARLY': {
        return getHalfYearlyDate(dueInDays, reminderDays);
      }
    }
  };

  const getWeekDay = (dueInDays: number, reminderDays = 0) => {
    const weekday = dayjs()
      .startOf('week')
      .add(dueInDays, 'day')
      .subtract(reminderDays, 'day')
      .weekday();

    return `Eg: ${weekDays[weekday]}`;
  };

  const getDates = (dueInDays: number, reminderDays = 0) => {
    const date = dayjs()
      .startOf(interval)
      .add(dueInDays, 'day')
      .subtract(reminderDays, 'day')
      .subtract(1, 'day')
      .format('DD MMM YYYY');
    const nextDate = dayjs()
      .startOf(interval)
      .add(dueInDays, 'day')
      .subtract(reminderDays, 'day')
      .subtract(1, 'day')
      .add(1, interval)
      .format('DD MMM YYYY');
    if (interval === 'year') {
      return `Eg: ${date}`;
    }
    return `Eg: ${date}, ${nextDate}`;
  };

  const getBiWeeklyDate = (dueInDays: number, reminderDays = 0) => {
    if (dayjs().date() <= 15) {
      const date = dayjs()
        .startOf('month')
        .add(dueInDays, 'day')
        .subtract(reminderDays, 'day')
        .subtract(1, 'day')
        .format('DD MMM YYYY');
      const nextDate = dayjs()
        .startOf('month')
        .add(15, 'day')
        .add(dueInDays, 'day')
        .subtract(reminderDays, 'day')
        .subtract(1, 'day')
        .format('DD MMM YYYY');

      return `Eg: ${date}, ${nextDate}`;
    }
    else {
      const date = dayjs()
        .startOf('month')
        .add(15, 'day')
        .add(dueInDays, 'day')
        .subtract(reminderDays, 'day')
        .subtract(1, 'day')
        .format('DD MMM YYYY');
      const nextDate = dayjs()
        .startOf('month')
        .add(1, 'month')
        .add(dueInDays, 'day')
        .subtract(reminderDays, 'day')
        .subtract(1, 'day')
        .format('DD MMM YYYY');

      return `Eg: ${date}, ${nextDate}`;
    }
  };

  const getHalfYearlyDate = (dueInDays: number, reminderDays = 0) => {
    if (dayjs().month() <= 5) {
      const date = dayjs()
        .startOf('year')
        .add(dueInDays, 'day')
        .subtract(reminderDays, 'day')
        .subtract(1, 'day')
        .format('DD MMM YYYY');
      const nextDate = dayjs()
        .startOf('year')
        .add(6, 'month')
        .add(dueInDays, 'day')
        .subtract(reminderDays, 'day')
        .subtract(1, 'day')
        .format('DD MMM YYYY');

      return `Eg: ${date}, ${nextDate}`;
    }
    else {
      const date = dayjs()
        .startOf('year')
        .add(6, 'month')
        .add(dueInDays, 'day')
        .subtract(reminderDays, 'day')
        .subtract(1, 'day')
        .format('DD MMM YYYY');
      const nextDate = dayjs()
        .startOf('year')
        .add(1, 'year')
        .add(dueInDays, 'day')
        .subtract(reminderDays, 'day')
        .subtract(1, 'day')
        .format('DD MMM YYYY');

      return `Eg: ${date}, ${nextDate}`;
    }
  };
  return {
    accountingPeriodOptions,
    accoutingPeriodLimits,
    getExampleDates,
    defaultRemainderDays
  };
}

export function useSchemaForm(
  formData: SchemaForm | Ref<SchemaForm> | ComputedRef<SchemaForm>
) {
  let formDataRef = ref();
  if (isRef(formData)) {
    formDataRef = formData;
  }
  else {
    formDataRef = ref(formData);
  }
  const findFormIndex = (field: string) =>
    formDataRef.value.fields?.findIndex(
      (item: SchemaFormField) => item.name === field
    );

  const updateOptions = (
    list: Ref<undefined> | Ref<any> | any[],
    index: number
  ) => {
    if (isRef(list) ? list.value : list && index !== -1) {
      if (formDataRef.value.fields[index]) {
        formDataRef.value.fields[index].options = isRef(list)
          ? list.value
          : list;
      }
    }
  };

  const updateFieldProp = (prop: string, index: number, value: any) => {
    if (formDataRef.value.fields[index]) {
      formDataRef.value.fields[index][prop] = value;
    }
  };

  const updateFieldsProps = (indexes: number[], prop: string, value: any) => {
    indexes.forEach((fieldIndex: number) => {
      updateFieldProp(prop, fieldIndex, value);
    });
  };

  const updateStartDueDateValidation = (
    val: Record<string, unknown>,
    formRef: Ref<SchemaFormRef>
  ) => {
    const dueDateIndex = findFormIndex('dueDate');
    const startDate = dayjs(`${val.startDate}`);
    const dueDate = val.dueDate ? dayjs(`${val.dueDate}`) : undefined;
    updateFieldProp(
      'minDate',
      dueDateIndex,
      dayjs(`${val.startDate}`).toDate()
    );
    if (dueDate && startDate.isAfter(dueDate.toDate())) {
      formRef.value?.setValues({
        ...formRef.value?.schemaFormValues,
        dueDate: dayjs(`${val.startDate}`).toDate()
      });
    }
  };

  return {
    findFormIndex,
    updateOptions,
    updateFieldProp,
    updateFieldsProps,
    updateStartDueDateValidation
  };
}

export function useSteps(routeName?: string) {
  const { getQueryParams } = useUtilityFns();
  const activeIndex = useRouteQuery('activeIndex', '', {
    transform: Number
  });
  const nestedActiveIndex = useRouteQuery('nestedActiveIndex', '', {
    transform: Number
  });
  const route = useRoute();
  const activeTabIndex = ref(0);
  const activeNestedTabIndex = ref(0);
  const router = useRouter();
  const tabRef = ref<(InstanceType<typeof TabView> & { tabs: VNode[] }) | null>(
    null
  );
  const nestedTabRef = ref<
    (InstanceType<typeof TabView> & { tabs: VNode[] }) | null
      >(null);

  const activeTab = computed(() => {
    return (tabRef?.value?.tabs as VNode[])
      ? (
          (tabRef?.value?.tabs as VNode[])[
            activeTabIndex.value
          ] as unknown as VNode
        )?.props?.header
      : '';
  });

  const handleStep = (
    step: number | TimelineSteps | string,
    query: LocationQueryRaw = {},
    params: RouteParamsRaw = {}
  ) => {
    if (typeof step === 'number') {
      router.push({ query: { activeIndex: step } });
    }
    else {
      if (tabRef.value) {
        const tabHeader
          = typeof step === 'string'
            ? step
            : `${((step as TimelineSteps).route as string).split('?')[0]}`;
        const currentTabIndex = tabRef.value?.tabs.findIndex(
          (item: VNode) => item.props?.header === tabHeader
        );
        const stepTitle = (step as TimelineSteps).title;
        const routeQueryParams = getQueryParams(
          typeof step === 'string'
            ? step
            : ((step as TimelineSteps).route as string)
        );

        router.push({
          query: {
            ...query,
            ...routeQueryParams,
            activeIndex: currentTabIndex
          },
          params
        });
      }
    }
  };
  const handleTabChange = (e: TabViewChangeEvent, isNested?: boolean) => {
    if (e.index !== activeIndex.value) {
      route.query.filters = null;
    }
    router.push({
      name: routeName,
      query: {
        activeIndex: isNested ? activeIndex.value : e.index,
        nestedActiveIndex: isNested ? e.index : undefined
      }
    });
  };

  watchEffect(() => {
    if (activeIndex.value) {
      activeTabIndex.value = +activeIndex.value;
    }
    if (nestedActiveIndex.value) {
      activeNestedTabIndex.value = +nestedActiveIndex.value;
    }
  });

  return {
    activeIndex,
    nestedActiveIndex,
    activeTabIndex,
    activeNestedTabIndex,
    activeTab,
    tabRef,
    nestedTabRef,
    handleStep,
    handleTabChange
  };
}

export function useTooltip() {
  const handleTooltip = (
    isActive: boolean,
    tooltipText: string,
    disabledTooltipText?: string
  ) => {
    if (isActive)
      return tooltipText;
    return disabledTooltipText;
  };

  return {
    handleTooltip
  };
}
// Tile Color
export function useOverDueColor() {
  const overDue = (cards: Card[]) => {
    const result = cards.find((val: any) => val.id === 'overDueTasks');
    if ((result?.value as any) === 0) {
      return 'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400';
    }
    else {
      return 'text-3xl text-red-500 bg-white hover:text-white hover:bg-red-500 transition-all transition-duration-400';
    }
  };
  return {
    overDue
  };
}

export function useDomUtils() {
  const getParents = (
    el: HTMLElement,
    parentSelector: string | HTMLElement
  ) => {
    const parents = [];
    if (parentSelector === null) {
      parentSelector = document.documentElement;
    }

    let p = el.parentNode;
    while (!(p as HTMLElement).classList.contains(parentSelector as string)) {
      const o = p;
      parents.push(o);
      p = o?.parentNode as ParentNode;
    }
    parents.push(p);
    return parents;
  };

  const getParentEl = (
    el: HTMLElement,
    parentSelector: string | HTMLElement
  ) => {
    const parents = getParents(el, parentSelector);
    return parents[parents.length - 1];
  };

  return {
    getParents,
    getParentEl
  };
}

export function useDownloadFile() {
  const handleDownloadFile = (
    fileName: string,
    fileContent: string,
    fileType: string
  ) => {
    const element = document.createElement('a');
    const file = new Blob([fileContent], { type: fileType });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };
  return {
    handleDownloadFile
  };
}

export function useAiInfo() {
  const notValidData = ref<boolean>(false);
  const isRobotDialog = ref<boolean>(false);
  const failedMsg = ref<string>(
    'Apologies, but in order to process your request through BrightAssistant. Could you please provide more details about the request?'
  );
  const showDialog = computed({
    get() {
      return isRobotDialog.value || notValidData.value;
    },
    set(val) {
      isRobotDialog.value = val;
      notValidData.value = val;
    }
  });
  return {
    notValidData,
    isRobotDialog,
    showDialog,
    failedMsg
  };
}

export function useCustomEditor() {
  const clientShortCodes = [
    {
      label: 'Client Name',
      id: 'client_name'
    },
    {
      label: 'Client Portal Login URL',
      id: 'clientportal_url'
    }
  ];
  const clientUsersShortCodes = [
    { label: 'Full Name', id: 'contact_full_name' },
    { label: 'First name', id: 'contact_first_name' },
    { label: 'Last name', id: 'contact_last_name' },
    { label: 'Phone number', id: 'contact_phone_no' },
    { label: 'Country', id: 'contact_country' },
    { label: 'City', id: 'contact_city' },
    { label: 'State / Province', id: 'contact_state' },
    { label: 'Zip / Postal code', id: 'contact_zipcode' },
    { label: 'Email', id: 'contact_email' }
  ];
  const cpaFirmShortCodes = [
    { label: 'Signature CPA Organization', id: 'firm_signature' },
    { label: 'Signature Sender', id: 'sender_signature' },
    { label: 'Sender First Name', id: 'sender_first_name' },
    { label: 'Sender Last name', id: 'sender_last_name' },
    { label: 'Relationship Manager First Name', id: 'rm_first_name' },
    { label: 'Relationship Manager Last Name', id: 'rm_last_name' },
    { label: 'Firm Street Address ', id: 'firm_address' },
    { label: 'Firm State  ', id: 'firm_state' },
    { label: 'Firm City ', id: 'firm_city' },
    { label: 'Firm ZipCode', id: 'firm_zipcode' },
    { label: 'HelpDesk Email ', id: 'helpdesk_email' },
    { label: 'Firm Email', id: 'firm_email' },
    { label: 'Firm Website', id: 'firm_website' },
    { label: 'Firm Linkedin', id: 'firm_linkedin' },
    { label: 'Firm Twitter', id: 'firm_twitter' },
    { label: 'Firm Logo', id: 'firm_logo' }
  ];

  const getPlaceholderOptions = async (scope: EditorPlaceholderScope) => {
    const { data } = await $api.get<EditorPlaceholderOption[]>(
      `${`orgs/short-codes?scope=${scope}`}`
    );
    return data;
  };

  return {
    clientShortCodes,
    clientUsersShortCodes,
    cpaFirmShortCodes,
    getPlaceholderOptions
  };
}
