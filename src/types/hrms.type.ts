import { array, boolean, date, number, object, string } from 'yup';
import type { InferType } from 'yup';
import dayjs from 'dayjs';
import type { User } from './teams.type';
import type { CommonLocation } from './common.type';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import dayjsBusinessDays from 'dayjs-business-days2';

dayjs.extend(isSameOrAfter);
dayjs.extend(dayjsBusinessDays);

export type LeaveStatus = 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PENDING';
export interface HRHoliday {
  id: string;
  name: string;
  orgId: string;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface HRLeaveType {
  id: string;
  name: string;
  code: string;
  isDisabled: boolean;
  isPaid: boolean;
  isPreDefined: boolean;
  maxDays: string;
}
export interface HRLeave {
  id: string;
  startDate: string;
  endDate: string;
  description: string;
  days: string;
  status: string;
  approvedBy: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'picture'>;
  approverComment: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'picture'>;
  leaveType: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string;
}
export interface HRActivities {
  id: string;
  checkIn: string;
  checkOut: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'picture'>;
  isBreak: boolean;
  checkInLocation: string;
  checkOutLocation: string;
  checkInNote: string;
  checkOutNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface HRLeaveBalance {
  id: string;
  year: number;
  days: number;
  type: HRLeaveType;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'picture'>;
  typeId: string;
  userId: string;
  approvedLeaves: number;
  pendingLeaves: number;
  remainingLeaveBalance: number;
  totalLeaveBalance: number;
}

export interface HRAttendance {
  id: string;
  checkIn: string;
  checkOut: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'picture'>;
  isBreak?: boolean;
  checkInLocation?: CommonLocation;
  checkOutLocation?: CommonLocation;
  checkInNote?: string;
  checkOutNote?: string;
  createdAt: string;
  updatedAt: string;
  totalTask: number;
  actualTimeSpent: number;
}

export type CheckInStatus = 'CHECKED_IN' | 'CHECKED_OUT' | 'NOT_AVAILABLE';

export interface UserCheckInStatus {
  status: CheckInStatus;
  attendance: {
    id: string;
    checkIn: string;
    checkOut: string;
    isBreak: boolean;
  };
}

export const HRHolidayCreateInputSchema = object({
  name: string().required().min(3).label('Name'),
  description: string().optional().max(255).label('Description'),
  date: date().required().label('Date')
});

export type HRHolidayCreateInput = InferType<typeof HRHolidayCreateInputSchema>;

export const HRLeaveBalanceBulkPayloadSchema = object().shape({
  users: array().of(
    object().shape({
      userId: array().min(1).of(string()).required().label('Team Member'),
      typeId: string().required().label('Leave Type'),
      year: number().nullable().required().label('Year'),
      days: number().nullable().required().label('Number of days')
    })
  )
});

export interface BulkLeavePayload {
  userId: string[];
  typeId: string;
  year: number | null;
  days: number | null;
}

export type HRLeaveBalanceBulkCreateInput = InferType<
  typeof HRLeaveBalanceBulkCreateInputSchema
>;

export const HRLeaveBalanceBulkCreateInputSchema = object({
  userId: array().of(string()).required().min(3).label('Team Member'),
  typeId: string().required().min(3).label('Leave Type'),
  year: number().required().label('Year'),
  days: number().required().nullable().label('Number of days')
});

export const HRLeaveBalanceCreateInputSchema = object({
  userId: string().required().min(3).label('Team Member'),
  typeId: string().required().min(3).label('Leave Type'),
  year: number().required().label('Year'),
  days: number().required().nullable().label('Number of days')
});

export type HRLeaveBalanceCreateInput = InferType<
  typeof HRLeaveBalanceCreateInputSchema
>;

export interface HRAttendance {
  id: string;
  checkIn: string;
  checkOut: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'picture'>;
  isBreak?: boolean;
  checkInLocation?: CommonLocation;
  checkOutLocation?: CommonLocation;
  checkInNote?: string;
  checkOutNote?: string;
  createdAt: string;
  updatedAt: string;
}
export const HRHolidayUpdateInputSchema = object({
  id: string().required(),
  name: string().required().min(1).max(255).label('Name'),
  description: string().required().optional().label('Description'),
  date: date().required().label('Date')
});

export type HRHolidayUpdateInput = InferType<typeof HRHolidayUpdateInputSchema>;

export const HRHolidaySingleInputSchema = object({
  id: string().required()
});

export type HRHolidaySingleInput = InferType<typeof HRHolidaySingleInputSchema>;

export const HRAttendanceCreateInputSchema = object({
  userId: string().required().nullable().label('Team Member'),
  checkIn: date().required().label('Check In'),
  checkOut: date().required().label('Check Out'),
  isBreak: boolean().optional(),
  activityTypeId: string().optional().label('Activity Type'),
  checkInNote: string().optional().label('Check In Note'),
  checkOutNote: string().optional().label('Check Out Note')
}).test({
  name: 'checkOutisAfterCheckIn',
  test: (values, { createError }) => {
    const { checkIn, checkOut } = values;
    if (checkIn && checkOut) {
      return !dayjs(checkOut).isSameOrAfter(dayjs(checkIn))
        ? createError({
          message: 'Check Out time must be after Check In time',
          path: 'checkOut' // Fieldname
        })
        : true;
    }
    return true; // Validation passes if either checkIn or checkOut is missing
  }
});

export type HRAttendanceCreateInput = InferType<
  typeof HRAttendanceCreateInputSchema
>;

export const HRAttendanceCheckInInputSchema = object({
  checkIn: date().required().label('Check In'),
  checkInLocation: object({
    lat: string().required(),
    lng: string().required()
  })
    .optional()
    .label('Check In Location'),
  isBreak: boolean().optional(),
  activityTypeId: string().optional().label('Activity Type'),
  checkInNote: string().optional().label('Check In Note')
});

export type HRAttendanceCheckInInput = InferType<
  typeof HRAttendanceCheckInInputSchema
>;

export const HRAttendanceCheckOutInputSchema = object({
  id: string().required(),
  checkOut: date().required().label('Check Out'),
  checkOutLocation: object({
    lat: string().required(),
    lng: string().required()
  })
    .optional()
    .label('Check Out Location'),
  checkOutNote: string().optional().label('Checkout Note')
});

export type HRAttendanceCheckOutInput = InferType<
  typeof HRAttendanceCheckOutInputSchema
>;

export const HRLeaveCreateInputSchema = object({
  leaveTypeId: string().required().label('Leave Type'),
  startDate: date().required().label('Start Date'),
  endDate: date().required().label('End Date'),
  description: string().required().label('Description'),
  remainingLeaves: number().optional(),
  holidaysInSelectedRange: number().optional(),
  validateRemainingLeaves: boolean().optional()
}).test({
  name: 'remainingLeavesValidation',
  test: (values, { createError }) => {
    const {
      remainingLeaves = 0,
      endDate,
      startDate,
      holidaysInSelectedRange = 0
    } = values;
    if (startDate && endDate) {
      const validWeekdays = dayjs(endDate).businessDiff(dayjs(startDate)) + 1;
      return remainingLeaves + holidaysInSelectedRange - validWeekdays < 0
        ? createError({
          message: `Selected days are more than the available leaves (Excluding holidays and Saturdays & Sundays in the selected date range).`,
          path: 'leaveTypeId' // Fieldname
        })
        : true;
    }
    return true; // Validation passes if either checkIn or checkOut is missing
  }
});

export type HRLeaveCreateInput = InferType<typeof HRLeaveCreateInputSchema>;

export const HRLeaveUpdateInputSchema = object({
  id: string().required(),
  leaveTypeId: string().required().optional(),
  startDate: date().required().optional().label('Date'),
  endDate: date().required().optional().label('Date'),
  description: string().optional().label('Description')
}).when(['startDate', 'endDate'], {
  is: (startDate: number, endDate: number) => {
    if (startDate && endDate) {
      return startDate <= endDate;
    }
    return string;
  },
  then: schema => schema.required('End date must be after Start date')
});

export type HRLeaveUpdateInput = InferType<typeof HRLeaveUpdateInputSchema>;

export const HRLeaveActionsInputSchema = object({
  // id: string().required(),
  // status: string().required().label('Status'),
  isReject: boolean().optional(),
  approverComment: string()
    .optional()
    .when('isReject', (isReject, schema) =>
      isReject
        ? schema.required().label('Reason For Rejection')
        : schema.optional()
    )
});

export type HRLeaveActionsInput = InferType<typeof HRLeaveActionsInputSchema>;

export const HRBreakCreateInputSchema = object({
  activityTypeId: string().required(),
  isBreak: boolean().required().default(true),
  checkIn: date().required().default(new Date()),
  checkInLocation: object({
    lat: string().required(),
    lng: string().required()
  }).optional()
});

export type HRBreakCreateInput = InferType<typeof HRBreakCreateInputSchema>;
export const HRTimesheetsFetchInputSchema = object({
  userId: array().of(string()).optional().label('User Id'),
  startDate: date().optional().label('Start Date'),
  endDate: date().optional().label('End Date')
});

export type HRTimesheetsFetchInput = InferType<
  typeof HRTimesheetsFetchInputSchema
>;

export const HRTimeSheetsBreakDownFilterInputSchema = object({
  userId: string().optional(),
  startDate: date().default(
    dayjs().subtract(1, 'week').startOf('day').toDate()
  ),
  endDate: date().default(dayjs().endOf('day').toDate())
});

export type HRTimeSheetsBreakDownFilterInput = InferType<
  typeof HRTimeSheetsBreakDownFilterInputSchema
>;
