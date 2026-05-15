import Image from "next/image";

const FLAG_BY_COUNTRY: Record<string, string> = {
  "таиланд": "/images/flags/thailand.svg",
  "тайланд": "/images/flags/thailand.svg",
  "thailand": "/images/flags/thailand.svg",
  "япония": "/images/flags/japan.svg",
  "japan": "/images/flags/japan.svg",
  "корея": "/images/flags/korea.svg",
  "южная корея": "/images/flags/korea.svg",
  "korea": "/images/flags/korea.svg",
  "south korea": "/images/flags/korea.svg",
  "китай": "/images/flags/china.svg",
  "china": "/images/flags/china.svg",
  "вьетнам": "/images/flags/vietnam.svg",
  "vietnam": "/images/flags/vietnam.svg",
  "индия": "/images/flags/india.svg",
  "india": "/images/flags/india.svg",
  "индонезия": "/images/flags/indonesia.svg",
  "indonesia": "/images/flags/indonesia.svg",
};

type Props = {
  country: string | null | undefined;
  className?: string;
};

export default function CountryFlag({ country, className = "" }: Props) {
  if (!country) return null;

  const src = FLAG_BY_COUNTRY[country.trim().toLowerCase()];
  if (!src) return <span className={className}>{country}</span>;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Image src={src} alt="" width={18} height={12} className="rounded-[2px] shadow-sm" />
      <span>{country}</span>
    </span>
  );
}
