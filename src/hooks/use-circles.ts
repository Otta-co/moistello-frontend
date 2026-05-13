"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api-client";
import {
  ApiResponse,
  Circle,
  CircleMember,
  Contribution,
} from "@/types";

interface CircleFilters {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface CreateCirclePayload {
  name: string;
  description?: string;
  circleType: string;
  payoutType: string;
  contributionAmount: number;
  currency: string;
  frequency: string;
  maxMembers: number;
  minMoiScore?: number;
  collateralPercent?: number;
  lateFeePercent: number;
  gracePeriodHours: number;
  maxStrikes: number;
  startDate: string;
}

interface JoinCirclePayload {
  userId?: string;
}

interface ContributePayload {
  amount: number;
  roundNumber?: number;
}

export function useCircles(filters?: CircleFilters) {
  return useQuery({
    queryKey: ["circles", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set("search", filters.search);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.type) params.set("type", filters.type);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const query = params.toString();
      const url = `/circles${query ? `?${query}` : ""}`;
      const response = await get<ApiResponse<Circle[]>>(url);

      return {
        circles: response.data ?? [],
        meta: response.meta ?? {
          page: filters?.page ?? 1,
          limit: filters?.limit ?? 20,
          total: 0,
          totalPages: 0,
        },
      };
    },
  });
}

export function useCircle(id: string) {
  return useQuery({
    queryKey: ["circle", id],
    queryFn: async () => {
      const response = await get<ApiResponse<Circle>>(`/circles/${id}`);
      return response.data ?? null;
    },
    enabled: !!id,
  });
}

export function useCreateCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCirclePayload) =>
      post<ApiResponse<Circle>>("/circles", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
  });
}

export function useJoinCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      circleId,
      payload,
    }: {
      circleId: string;
      payload?: JoinCirclePayload;
    }) => post<ApiResponse<CircleMember>>(`/circles/${circleId}/join`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["circle", variables.circleId] });
      queryClient.invalidateQueries({ queryKey: ["circle-members", variables.circleId] });
    },
  });
}

export function useContribute(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContributePayload) =>
      post<ApiResponse<Contribution>>(
        `/circles/${circleId}/contribute`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
      queryClient.invalidateQueries({ queryKey: ["circle-rounds", circleId] });
    },
  });
}

export function useCircleMembers(circleId: string) {
  return useQuery({
    queryKey: ["circle-members", circleId],
    queryFn: async () => {
      const response = await get<ApiResponse<CircleMember[]>>(
        `/circles/${circleId}/members`
      );
      return response.data ?? [];
    },
    enabled: !!circleId,
  });
}

export function useCircleRounds(circleId: string) {
  return useQuery({
    queryKey: ["circle-rounds", circleId],
    queryFn: async () => {
      const response = await get<ApiResponse<Contribution[]>>(
        `/circles/${circleId}/rounds`
      );
      return response.data ?? [];
    },
    enabled: !!circleId,
  });
}
