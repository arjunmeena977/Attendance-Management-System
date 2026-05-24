import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const overtimeApi = createApi({
  reducerPath: 'overtimeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/overtime`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Overtime'],
  endpoints: (builder) => ({
    requestOvertime: builder.mutation({
      query: (data) => ({ url: '/request', method: 'POST', body: data }),
      invalidatesTags: ['Overtime'],
    }),
    getMyOvertime: builder.query({
      query: () => '/my',
      providesTags: ['Overtime'],
    }),
    getPendingOvertime: builder.query({
      query: (params) => ({ url: '/pending', params }),
      providesTags: ['Overtime'],
    }),
    getAllOvertime: builder.query({
      query: (params) => ({ url: '/all', params }),
      providesTags: ['Overtime'],
    }),
    reviewOvertime: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/${id}/review`, method: 'PATCH', body: data }),
      invalidatesTags: ['Overtime'],
    }),
  }),
});

export const {
  useRequestOvertimeMutation,
  useGetMyOvertimeQuery,
  useGetPendingOvertimeQuery,
  useGetAllOvertimeQuery,
  useReviewOvertimeMutation,
} = overtimeApi;
