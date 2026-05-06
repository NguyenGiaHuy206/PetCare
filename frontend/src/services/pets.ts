import apiClient from "./apiClient";
import type { PetResponse } from "./types";

export const petAPI = {
  getAll: (owner_id?: string): Promise<PetResponse[]> =>
    apiClient.get("/pets", { params: { owner_id } }).then((res) => res.data),

  getAllAdmin: (owner_id?: string): Promise<PetResponse[]> =>
    apiClient.get("/pets/admin/all", { params: { owner_id } }).then((res) => res.data),

  getMine: (): Promise<PetResponse[]> =>
    apiClient.get("/pets").then((res) => res.data),

  getById: (id: string): Promise<PetResponse> =>
    apiClient.get(`/pets/${id}`).then((res) => res.data),

  create: (data: {
    name: string;
    species: string;
    breed: string;
    age?: string;
    weight?: number;
    color?: string;
    gender?: string;
    microchip_id?: string;
    notes?: string;
    photo_url?: string;
  }): Promise<PetResponse> => apiClient.post("/pets", data).then((res) => res.data),

  update: (
    id: string,
    data: Partial<{
      name: string;
      species: string;
      breed: string;
      age: string;
      weight: number;
      color: string;
      gender: string;
      microchip_id: string;
      notes: string;
      photo_url: string;
    }>
  ): Promise<PetResponse> => apiClient.put(`/pets/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/pets/${id}`).then(() => undefined),
};

export type { PetResponse };
