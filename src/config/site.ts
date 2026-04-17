/**
 * ข้อมูลคงที่ของเว็บไซต์หมู่บ้านแซร์ออ หมู่ที่ 2
 */

export const SITE_INFO = {
  villageName: "หมู่บ้านแซร์ออ หมู่ที่ 2",
  fullAddress: "หมู่ที่ 2 บ้านแซร์ออ ต.แซร์ออ อ.วัฒนานคร จ.สระแก้ว 27160",
  shortAddress: "ต.แซร์ออ อ.วัฒนานคร จ.สระแก้ว",
  headman: {
    name: "นายสุริยันต์ โฉมยงค์",
    position: "ผู้ใหญ่บ้าน หมู่ที่ 2",
    phone: "092-468-6927",
    phoneRaw: "0924686927",
  },
  description:
    "ศูนย์รวมข้อมูลข่าวสาร บริการประชาชน และความเคลื่อนไหวของหมู่บ้านแซร์ออ หมู่ที่ 2 ตำบลแซร์ออ อำเภอวัฒนานคร จังหวัดสระแก้ว",
} as const;

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "เกี่ยวกับหมู่บ้าน",
    href: "/about",
    children: [
      { label: "ประวัติความเป็นมา", href: "/about/history" },
      { label: "วิสัยทัศน์ / พันธกิจ", href: "/about/vision" },
      { label: "โครงสร้างการบริหาร", href: "/about/structure" },
      { label: "ทำเนียบบุคลากร", href: "/about/personnel" },
      { label: "อำนาจหน้าที่", href: "/about/authority" },
    ],
  },
  {
    label: "ข่าวสาร",
    href: "/news",
    children: [
      { label: "ข่าวประชาสัมพันธ์", href: "/news/category/announcements" },
      { label: "ข่าวจัดซื้อจัดจ้าง", href: "/news/category/procurement" },
      { label: "ข่าวรับสมัครงาน", href: "/news/category/recruitment" },
      { label: "ปฏิทินกิจกรรม", href: "/calendar" },
      { label: "แกลเลอรี่ภาพ", href: "/gallery" },
    ],
  },
  {
    label: "ความโปร่งใส",
    href: "/transparency",
    children: [
      { label: "แผนพัฒนาท้องถิ่น", href: "/transparency/plans" },
      { label: "งบประมาณ", href: "/transparency/budget" },
      { label: "รายงานผลการปฏิบัติงาน", href: "/transparency/reports" },
    ],
  },
  {
    label: "บริการประชาชน",
    href: "/services",
    children: [
      { label: "แบบฟอร์มดาวน์โหลด", href: "/services/forms" },
      { label: "ข้อมูลชุมชน", href: "/services/community" },
      { label: "สินค้า OTOP", href: "/services/otop" },
    ],
  },
  {
    label: "ITA / เมนูพิเศษ",
    href: "/ita",
    children: [
      { label: "ITA", href: "/ita" },
      { label: "ศูนย์ข้อมูลข่าวสาร", href: "/info-center" },
      { label: "นโยบายเว็บไซต์", href: "/policy" },
      { label: "คู่มือบริการ", href: "/manual" },
      { label: "ร้องเรียน / ร้องทุกข์", href: "/complaints" },
      { label: "คำถามที่พบบ่อย", href: "/faq" },
    ],
  },
  { label: "ติดต่อเรา", href: "/contact" },
];
