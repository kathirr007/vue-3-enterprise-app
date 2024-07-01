import $api from '@/plugins/api';
import type { PaginatedResponse } from '@/types/common.type';
import type {
  HRHolidayCreateInput,
  HRHoliday,
  HRLeaveBalance,
  HRLeaveType,
  HRLeaveBalanceCreateInput,
  HRLeave,
  HRAttendance,
  HRAttendanceCheckInInput,
  HRAttendanceCheckOutInput,
  HRAttendanceCreateInput,
  UserCheckInStatus,
  HRLeaveCreateInput,
  HRLeaveActionsInput,
  HRLeaveBalanceBulkCreateInput,
} from '@/types/hrms.type';

export const useHrmsHolidays = () => {
  const getAll = async ({
    page,
    limit,
    filters,
    sortBy,
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<HRHoliday>>(
      'hrms/holiday',
      {
        params: {
          page,
          limit,
          filters,
          sortBy,
        },
      }
    );
    return data;
  };

  const upcoming = async () => {
    const { data } = await $api.get<HRHoliday>(`hrms/holiday/upcoming`);
    return data;
  };

  const getOne = async (id: string) => {
    const { data } = await $api.get<HRHoliday>(`hrms/holiday/${id}`);
    return data;
  };

  const createOne = async (payload: HRHolidayCreateInput) => {
    const { data } = await $api.post<HRHoliday>('hrms/holiday', payload);
    return data;
  };

  const bulkCreate = async (payload: HRHolidayCreateInput[]) => {
    const { data } = await $api.post<{ count: number }>(
      'hrms/holiday/bulk',
      payload
    );
    return data;
  };

  const remove = async (id: string) => {
    const { data } = await $api.delete<HRHoliday>(`hrms/holiday/${id}`);
    return data;
  };

  const update = async (id: string, payload: Partial<HRHolidayCreateInput>) => {
    const { data } = await $api.patch<HRHoliday>(`hrms/holiday/${id}`, payload);
    return data;
  };

  return {
    getAll,
    upcoming,
    getOne,
    createOne,
    bulkCreate,
    remove,
    update,
  };
};

export const useHrmsLeaveBalance = () => {
  const getAllLeaveTypes = async () => {
    const { data } = await $api.get<HRLeaveType[]>('hrms/leaves/types');
    return data;
  };
  const getAll = async ({
    page,
    limit,
    filters,
    sortBy,
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<HRLeaveBalance>>(
      'hrms/leave-balance',
      {
        params: {
          page,
          limit,
          filters,
          sortBy,
        },
      }
    );
    return data;
  };

  const createOne = async (payload: HRLeaveBalanceCreateInput) => {
    const { data } = await $api.post<HRLeaveBalance>(
      'hrms/leave-balance',
      payload
    );
    return data;
  };

  const createBulk = async (payload: HRLeaveBalanceCreateInput[]) => {
    const { data } = await $api.post('hrms/bulk-leave-balance', payload);
    return data;
  };

  const update = async (
    id: string,
    payload: Partial<HRLeaveBalanceCreateInput>
  ) => {
    const { data } = await $api.patch<HRLeaveBalance>(
      `hrms/leave-balance/${id}`,
      payload
    );
    return data;
  };

  return {
    getAll,
    getAllLeaveTypes,
    createOne,
    update,
    createBulk,
  };
};

export const useHrmsAttendance = () => {
  /* const getAllLeaveTypes = async () => {
    const { data } = await $api.get<HRLeaveType[]>('hrms/leaves/types');
    return data;
  }; */
  const getAllTimesheets = async ({
    page,
    limit,
    filters,
    sortBy,
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<HRAttendance>>(
      'hrms/attendance',
      {
        params: {
          page,
          limit,
          filters,
          sortBy,
        },
      }
    );
    return data;
  };

  const createAttendance = async (payload: HRAttendanceCreateInput) => {
    const { data } = await $api.post<HRAttendance>('hrms/attendance', payload);
    return data;
  };

  const updateAttendance = async (
    id: string,
    payload: Partial<HRAttendanceCreateInput>
  ) => {
    const { data } = await $api.patch<HRAttendance>(
      `hrms/attendance/${id}`,
      payload
    );
    return data;
  };

  const checkStatus = async () => {
    const { data } = await $api.get<UserCheckInStatus>(
      'hrms/attendance/status'
    );
    return data;
  };

  const checkIn = async (payload: HRAttendanceCheckInInput) => {
    const { data } = await $api.post<HRAttendance>(
      'hrms/attendance/checkIn',
      payload
    );
    return data;
  };

  const checkInUpdate = async (
    id: string,
    payload: HRAttendanceCheckInInput
  ) => {
    const { data } = await $api.post<HRAttendance>(
      `hrms/attendance/checkIn/${id}`,
      payload
    );
    return data;
  };

  const checkOut = async (
    id: string,
    payload: Partial<HRAttendanceCheckOutInput>
  ) => {
    const { data } = await $api.post<HRAttendance>(
      `hrms/attendance/${id}/checkOut`,
      payload
    );
    return data;
  };

  const checkOutUpdate = async (
    id: string,
    payload: Partial<HRAttendanceCheckOutInput>
  ) => {
    const { data } = await $api.patch<HRAttendance>(
      `hrms/attendance/${id}/checkOut`,
      payload
    );
    return data;
  };

  const remove = async (id: string) => {
    const { data } = await $api.delete<HRAttendance>(`hrms/attendance/${id}`);
    return data;
  };

  return {
    getAllTimesheets,
    // getAllLeaveTypes,
    createAttendance,
    updateAttendance,
    checkStatus,
    checkIn,
    checkInUpdate,
    checkOut,
    checkOutUpdate,
    remove,
  };
};

export const useHrmsLeaves = () => {
  const getAll = async ({
    page,
    limit,
    filters,
    sortBy,
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<HRLeave>>('hrms/leaves', {
      params: {
        page,
        limit,
        filters,
        sortBy,
      },
    });
    return data;
  };
  const getAllType = async () => {
    const { data } = await $api.get('hrms/leaves/types');
    return data;
  };
  const createOne = async (payload: HRLeaveCreateInput) => {
    const { data } = await $api.post<HRLeave>('hrms/leaves', payload);
    return data;
  };
  const createLeaveBalance = async (payload: {
    leaveTypeId: string;
    userId: string;
  }) => {
    const { data } = await $api.post<HRLeaveBalance>(
      'hrms/leaves/leave-balance',
      payload
    );
    return data;
  };
  const updateStatus = async (id: string, payload: HRLeaveActionsInput) => {
    const { data } = await $api.patch(`hrms/leaves/${id}/status`, payload);
    return data;
  };
  return {
    getAll,
    createOne,
    getAllType,
    createLeaveBalance,
    updateStatus,
  };
};
