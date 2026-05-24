import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/attendance`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Attendance'],
  endpoints: (builder) => ({
    punchIn: builder.mutation({
      query: (data) => ({ url: '/punch-in', method: 'POST', body: data }),
      invalidatesTags: ['Attendance'],
    }),
    punchOut: builder.mutation({
      query: (data) => ({ url: '/punch-out', method: 'POST', body: data }),
      invalidatesTags: ['Attendance'],
    }),
    getTodayAttendance: builder.query({
      query: () => '/today',
      providesTags: ['Attendance'],
    }),
    getMyAttendance: builder.query({
      query: (params) => ({ url: '/my', params }),
      providesTags: ['Attendance'],
    }),
    getTeamAttendance: builder.query({
      query: (params) => ({ url: '/team', params }),
      providesTags: ['Attendance'],
    }),
    getAllAttendance: builder.query({
      query: (params) => ({ url: '/all', params }),
      providesTags: ['Attendance'],
    }),
    getAttendanceById: builder.query({
      query: (id) => `/${id}`,
      providesTags: ['Attendance'],
    }),
    validateAttendance: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/${id}/validate`, method: 'PATCH', body: data }),
      invalidatesTags: ['Attendance'],
    }),
    getDailyReport: builder.query({
      query: (params) => ({ url: '/report/daily', params }),
      providesTags: ['Attendance'],
    }),
  }),
});

export const {
  usePunchInMutation,
  usePunchOutMutation,
  useGetTodayAttendanceQuery,
  useGetMyAttendanceQuery,
  useGetTeamAttendanceQuery,
  useGetAllAttendanceQuery,
  useGetAttendanceByIdQuery,
  useValidateAttendanceMutation,
  useGetDailyReportQuery,
} = attendanceApi;
