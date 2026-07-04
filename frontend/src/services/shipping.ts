import apiClient from "./apiClient";
import type { ShippingQuoteResponse } from "./types";

export type GhnProvince = {
  ProvinceID: number;
  ProvinceName: string;
};

export type GhnDistrict = {
  DistrictID: number;
  DistrictName: string;
  ProvinceID: number;
};

export type GhnWard = {
  WardCode: string;
  WardName: string;
  DistrictID: number;
};

export const shippingAPI = {
  getProvinces: (): Promise<GhnProvince[]> =>
    apiClient.get("/shipping/provinces").then((res) => res.data),
  getDistricts: (province_id: number): Promise<GhnDistrict[]> =>
    apiClient.get("/shipping/districts", { params: { province_id } }).then((res) => res.data),
  getWards: (district_id: number): Promise<GhnWard[]> =>
    apiClient.get("/shipping/wards", { params: { district_id } }).then((res) => res.data),
  quote: (to_district_id: number, to_ward_code: string): Promise<ShippingQuoteResponse> =>
    apiClient.post("/shipping/quote", { to_district_id, to_ward_code }).then((res) => res.data),
};

export type { ShippingQuoteResponse };
