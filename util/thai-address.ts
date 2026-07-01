import { getAllData } from "thai-data";

export interface Province {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  provinceId: string;
}

export interface SubDistrict {
  id: string;
  name: string;
  districtId: string;
  provinceId: string;
}

let _provinces: Province[] | null = null;
let _districts: District[] | null = null;
let _subDistricts: SubDistrict[] | null = null;
let _zipMap: Map<string, string> | null = null;

function init() {
  if (_provinces) return;

  const provinceMap = new Map<string, Province>();
  const districtMap = new Map<string, District>();
  const subDistrictMap = new Map<string, SubDistrict>();
  const zipMap = new Map<string, string>();

  for (const entry of getAllData()) {
    const { zipCode, provinceList, districtList, subDistrictList } = entry;

    for (const p of provinceList ?? []) {
      if (!provinceMap.has(p.provinceId)) {
        provinceMap.set(p.provinceId, { id: p.provinceId, name: p.provinceName });
      }
    }

    for (const d of districtList ?? []) {
      if (!districtMap.has(d.districtId)) {
        districtMap.set(d.districtId, {
          id: d.districtId,
          name: d.districtName,
          provinceId: d.proviceId,
        });
      }
    }

    for (const s of subDistrictList ?? []) {
      if (!subDistrictMap.has(s.subDistrictId)) {
        subDistrictMap.set(s.subDistrictId, {
          id: s.subDistrictId,
          name: s.subDistrictName,
          districtId: s.districtId,
          provinceId: s.provinceId,
        });
        zipMap.set(s.subDistrictId, zipCode);
      }
    }
  }

  _provinces = Array.from(provinceMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "th")
  );
  _districts = Array.from(districtMap.values());
  _subDistricts = Array.from(subDistrictMap.values());
  _zipMap = zipMap;
}

export function getProvinces(): Province[] {
  init();
  return _provinces!;
}

export function getDistrictsByProvince(provinceId: string): District[] {
  init();
  return _districts!.filter((d) => d.provinceId === provinceId);
}

export function getSubDistrictsByDistrict(districtId: string): SubDistrict[] {
  init();
  return _subDistricts!.filter((s) => s.districtId === districtId);
}

export function getZipCode(subDistrictId: string): string {
  init();
  return _zipMap!.get(subDistrictId) ?? "";
}
