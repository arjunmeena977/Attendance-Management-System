import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/auth`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (data) => ({ url: '/register', method: 'POST', body: data }),
    }),
    login: builder.mutation({
      query: (data) => ({ url: '/login', method: 'POST', body: data }),
    }),
    getMe: builder.query({
      query: () => '/me',
    }),
    updateProfile: builder.mutation({
      query: (data) => ({ url: '/profile', method: 'PUT', body: data }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useGetMeQuery, useUpdateProfileMutation } = authApi;
