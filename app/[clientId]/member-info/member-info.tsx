"use client";
import Input from "@/components/input";
import ThemedSelect from "@/components/themed-select";
import { useApp } from "@/components/providers/app-provider";
import { isErrorResponse } from "@/types/request";
import {
  getDistrictsByProvince,
  getProvinces,
  getSubDistrictsByDistrict,
  getZipCode,
  type District,
  type Province,
  type SubDistrict,
} from "@/util/thai-address";
import { IconChevronLeft, IconPhone, IconUser } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconMail, IconCalendar } from "@tabler/icons-react";

const GENDER_OPTIONS = [
  { id: "M", name: "ชาย" },
  { id: "F", name: "หญิง" },
  { id: "O", name: "ไม่ระบุ" },
];

export default function MemberInfo() {
  const {
    clientConfig,
    userProfile,
    appUserProfile,
    backendClient,
    openAlert,
    setFullLoading,
    setIsShowNavbar,
    setAppUserProfile,
  } = useApp();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "O" | "">(
    (appUserProfile?.gender as "M" | "F" | "O") || "",
  );
  const [email, setEmail] = useState(appUserProfile?.email || "");
  const [phone, setPhone] = useState(appUserProfile?.phone || "");
  const [birthDate, setBirthDate] = useState(appUserProfile?.birth_date || "");

  const addressJson = appUserProfile?.address
    ? JSON.parse(appUserProfile.address)
    : {};

  const [addressLine, setAddressLine] = useState(
    addressJson.address_line || "",
  );
  const [provinceId, setProvinceId] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [subDistrictId, setSubDistrictId] = useState("");
  const [subDistrictName, setSubDistrictName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const termAndCondition = `ข้าพเจ้ายินยอมให้บริษัทเก็บ รวบรวม ใช้ และจัดเก็บข้อมูลส่วนบุคคลของข้าพเจ้า ได้แก่ หมายเลขโทรศัพท์ อีเมล เพศ วันเดือนปีเกิด และที่อยู่ เพื่อบันทึกในระบบบริหารจัดการลูกค้าสัมพันธ์ (CRM) โดยมีวัตถุประสงค์ดังต่อไปนี้
จัดเก็บและบริหารข้อมูลลูกค้า
ติดต่อสื่อสารเกี่ยวกับการให้บริการ การตอบข้อซักถาม และการแจ้งข้อมูลที่เกี่ยวข้อง
ให้บริการหลังการขายและดูแลความสัมพันธ์กับลูกค้า
นำเสนอข่าวสาร สิทธิประโยชน์ โปรโมชั่น หรือกิจกรรมต่าง ๆ (หากผู้ใช้ให้ความยินยอม)
วิเคราะห์และพัฒนาคุณภาพการให้บริการ

บริษัทจะดำเนินการเก็บรักษาและใช้ข้อมูลส่วนบุคคลตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) และจะไม่เปิดเผยข้อมูลแก่บุคคลภายนอก เว้นแต่ได้รับความยินยอมจากเจ้าของข้อมูล หรือมีเหตุอันชอบด้วยกฎหมาย

เจ้าของข้อมูลสามารถถอนความยินยอม ขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลได้ ตามสิทธิที่กฎหมายกำหนด โดยติดต่อบริษัทผ่านช่องทางที่บริษัทกำหนด`;
  const shortTerm =
    termAndCondition.length > 80
      ? termAndCondition.slice(0, 80) + "..."
      : termAndCondition;

  const provinces: Province[] = getProvinces();
  const districts: District[] = provinceId
    ? getDistrictsByProvince(provinceId).sort((a, b) =>
        a.name.localeCompare(b.name, "th"),
      )
    : [];
  const subDistricts: SubDistrict[] = districtId
    ? getSubDistrictsByDistrict(districtId).sort((a, b) =>
        a.name.localeCompare(b.name, "th"),
      )
    : [];

  const handleProvinceChange = (id: string, name: string) => {
    setProvinceId(id);
    setProvinceName(name);
    setDistrictId("");
    setDistrictName("");
    setSubDistrictId("");
    setSubDistrictName("");
    setPostalCode("");
  };

  const handleDistrictChange = (id: string, name: string) => {
    setDistrictId(id);
    setDistrictName(name);
    setSubDistrictId("");
    setSubDistrictName("");
    setPostalCode("");
  };

  const handleSubDistrictChange = (id: string, name: string) => {
    setSubDistrictId(id);
    setSubDistrictName(name);
    setPostalCode(getZipCode(id));
  };

  const handleSubmit = async () => {
    if (!userProfile?.userId) return;

    setFullLoading(true);
    const address = {
      address_line: addressLine.trim(),
      province: provinceName,
      district: districtName,
      sub_district: subDistrictName,
      postal_code: postalCode,
    };
    const response = await backendClient.updateUserInfo(clientConfig.slug, {
      // first_name: firstName.trim(),
      // last_name: lastName.trim(),
      gender: gender as "M" | "F" | "O",
      birth_date: birthDate,
      address: JSON.stringify(address),
    });
    setFullLoading(false);

    if (isErrorResponse(response)) {
      openAlert({ title: "เกิดข้อผิดพลาด", message: response.message });
      return;
    }

    const appProfile = await backendClient.getUserInfo(clientConfig.slug);
    if (isErrorResponse(appProfile)) {
      openAlert({ title: "เกิดข้อผิดพลาด", message: appProfile.message });
      return;
    }

    setAppUserProfile(appProfile);

    router.push(`/${clientConfig.slug}/member`);
  };

  useEffect(() => {
    if (!addressJson.province) return;
    const allProvinces = getProvinces();
    const province = allProvinces.find((p) => p.name === addressJson.province);
    if (!province) return;
    setProvinceId(province.id);
    setProvinceName(province.name);

    if (!addressJson.district) return;
    const allDistricts = getDistrictsByProvince(province.id);
    const district = allDistricts.find((d) => d.name === addressJson.district);
    if (!district) return;
    setDistrictId(district.id);
    setDistrictName(district.name);

    if (!addressJson.sub_district) return;
    const allSubDistricts = getSubDistrictsByDistrict(district.id);
    const subDistrict = allSubDistricts.find(
      (s) => s.name === addressJson.sub_district,
    );
    if (!subDistrict) return;
    setSubDistrictId(subDistrict.id);
    setSubDistrictName(subDistrict.name);
    setPostalCode(addressJson.postal_code || getZipCode(subDistrict.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsShowNavbar(false);

    return () => {
      setIsShowNavbar(true);
    };
  }, [setIsShowNavbar]);

  if (!userProfile) return null;

  return (
    <div className="min-h-screen flex flex-col px-5 pb-10">
      <div className="flex flex-col items-center pt-8 pb-6">
        <div
          className={`w-full flex ${appUserProfile?.is_updated_user_info ? "justify-start" : "justify-center"} items-center gap-4`}
        >
          {appUserProfile?.is_updated_user_info && (
            <button
              type="button"
              aria-label="Previous advertisement"
              onClick={() => router.push(`/${clientConfig.slug}/member`)}
              className="rounded-full border border-white/12 bg-black/45 p-2 text-white shadow-lg backdrop-blur-sm"
            >
              <IconChevronLeft size={24} />
            </button>
          )}
          <p
            className="font-bodoni text-xl font-medium"
            style={{ color: clientConfig.ui.text_color }}
          >
            {appUserProfile?.is_updated_user_info
              ? "แก้ไขข้อมูลสมาชิก"
              : "กรอกข้อมูลสมาชิก"}
          </p>
        </div>

        <img
          src={userProfile.pictureUrl}
          alt="logo"
          className="h-16 w-auto rounded-full bg-white mt-6"
          style={{
            boxShadow: `0 0 0 0.5px rgba(255,255,255,0.06), 0 4px 18px -4px color-mix(in oklch, ${clientConfig.ui.primary_color} 60%, transparent)`,
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        {/* <div className="flex gap-3">
          <Input
            value={firstName}
            onChange={setFirstName}
            placeholder="ชื่อ"
            icon={<IconUser size={20} />}
          />
          <Input
            value={lastName}
            onChange={setLastName}
            placeholder="นามสกุล"
          />
        </div> */}

        {appUserProfile?.email && (
          <div>
            <div
              className="pb-0.5 px-1 text-xs mb-1"
              style={{ color: clientConfig.ui.primary_color }}
            >
              อีเมล
            </div>
            <Input
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="อีเมล"
              icon={<IconMail size={20} />}
              disabled={!!appUserProfile?.email}
            />
          </div>
        )}

        {appUserProfile?.phone && (
          <div>
            <div
              className="pb-0.5 px-1 text-xs mb-1"
              style={{ color: clientConfig.ui.primary_color }}
            >
              เบอร์โทรศัพท์
            </div>
            <Input
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="เบอร์โทรศัพท์"
              icon={<IconPhone size={20} />}
              inputMode="numeric"
              disabled
            />
          </div>
        )}

        <div>
          <div
            className="pb-0.5 px-1 text-xs mb-1"
            style={{ color: clientConfig.ui.primary_color }}
          >
            เพศ*
          </div>
          <ThemedSelect
            placeholder="เลือกเพศ"
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(id) => setGender(id as "M" | "F" | "O")}
            icon={
              <IconUser
                size={20}
                style={{ color: clientConfig.ui.text_gray_color }}
              />
            }
          />
        </div>

        <div>
          <div
            className="pb-0.5 px-1 text-xs mb-1"
            style={{ color: clientConfig.ui.primary_color }}
          >
            วันเกิด*
          </div>
          <Input
            type="date"
            value={birthDate}
            onChange={setBirthDate}
            placeholder="วันเกิด"
            icon={
              <IconCalendar
                size={20}
                style={{
                  color: clientConfig.ui.text_gray_color,
                }}
              />
            }
          />
        </div>

        <div
          className="pt-1 pb-0.5 px-1 text-xs"
          style={{ color: clientConfig.ui.primary_color }}
        >
          ที่อยู่ (ไม่บังคับ)
        </div>

        <Input
          value={addressLine}
          onChange={setAddressLine}
          placeholder="บ้านเลขที่ / หมู่บ้าน / อาคาร"
        />

        <ThemedSelect
          placeholder="จังหวัด"
          options={provinces.map((p) => ({ id: p.id, name: p.name }))}
          value={provinceId}
          onChange={handleProvinceChange}
        />

        <ThemedSelect
          placeholder="อำเภอ / เขต"
          options={districts.map((d) => ({ id: d.id, name: d.name }))}
          value={districtId}
          onChange={handleDistrictChange}
          disabled={!provinceId}
        />

        <ThemedSelect
          placeholder="ตำบล / แขวง"
          options={subDistricts.map((s) => ({ id: s.id, name: s.name }))}
          value={subDistrictId}
          onChange={handleSubDistrictChange}
          disabled={!districtId}
        />

        <Input
          value={postalCode}
          onChange={setPostalCode}
          placeholder="รหัสไปรษณีย์"
          inputMode="numeric"
        />
      </div>

      {termAndCondition && !appUserProfile?.is_updated_user_info && (
        <>
          <div
            className="flex items-start gap-3 mt-6 cursor-pointer select-none"
            onClick={() => setAcceptedTerms((v) => !v)}
          >
            <div
              className="mt-0.5 w-5 h-5 shrink-0 rounded flex items-center justify-center border"
              style={{
                background: acceptedTerms
                  ? clientConfig.ui.primary_color
                  : "transparent",
                borderColor: acceptedTerms
                  ? clientConfig.ui.primary_color
                  : clientConfig.ui.text_gray_color,
              }}
            >
              {acceptedTerms && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke={clientConfig.ui.button_text_color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <div>
              <p
                style={{
                  color: clientConfig.ui.text_white_color,
                }}
              >
                ยอมรับเงื่อนไขและข้อตกลง*
              </p>
              <span
                className="text-sm leading-snug"
                style={{ color: clientConfig.ui.text_gray_color }}
              >
                {shortTerm}{" "}
                <span
                  className="cursor-pointer"
                  style={{ color: clientConfig.ui.primary_color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTermsModal(true);
                  }}
                >
                  อ่านเพิ่มเติม
                </span>
              </span>
            </div>
          </div>

          {showTermsModal && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowTermsModal(false)}
              />
              <div
                className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-2xl max-h-[75vh] overflow-hidden w-screen md:w-[500px] mx-auto flex flex-col"
                style={{ background: clientConfig.ui.surface_color }}
              >
                <div
                  className="px-5 py-4 text-base font-medium border-b shrink-0"
                  style={{
                    color: clientConfig.ui.text_color,
                    borderColor: clientConfig.ui.text_gray_color + "20",
                  }}
                >
                  เงื่อนไขและข้อตกลง
                </div>
                <div className="overflow-y-auto px-5 py-4">
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: clientConfig.ui.text_gray_color }}
                  >
                    {termAndCondition}
                  </p>
                </div>
                <div className="px-5 py-4 shrink-0">
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setShowTermsModal(false)}
                    className="mb-1 rounded-xl py-2.5 text-sm font-semibold border w-full"
                    style={{
                      background: clientConfig.ui.surface_color,
                      color: clientConfig.ui.text_color,
                      borderColor: `color-mix(in srgb, ${clientConfig.ui.text_gray_color} 80%, transparent)`,
                    }}
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <button
        className="mt-6 h-14 w-full text-center text-[15px] rounded-[14px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(135deg, ${clientConfig.ui.primary_color}, ${clientConfig.ui.secondary_color})`,
          boxShadow: `0 8px 24px -6px color-mix(in oklch, ${clientConfig.ui.primary_color} 60%, transparent)`,
          color: clientConfig.ui.button_text_color,
        }}
        disabled={
          (!acceptedTerms && !appUserProfile?.is_updated_user_info) ||
          !gender ||
          !birthDate
        }
        onClick={handleSubmit}
      >
        บันทึกข้อมูล
      </button>
    </div>
  );
}
