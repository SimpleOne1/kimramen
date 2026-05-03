import Link from "next/link";
import type { ReactNode } from "react";

type Crumb = {
  label: string;
  href?: string;
};

type StaticInfoPageProps = {
  title: string;
  crumbs: Crumb[];
  children: ReactNode;
};

export default function StaticInfoPage({
  title,
  crumbs,
  children,
}: StaticInfoPageProps) {
  return (
    <section className="bg-[#EEE9EA] px-3 py-4 sm:px-4 lg:px-6 lg:py-8">
      <div className="mx-auto w-full max-w-[1360px] rounded-none bg-white px-4 py-6 shadow-sm sm:px-6 lg:min-h-[980px] lg:px-9 lg:py-9">
        <h1 className="mb-4 text-[28px] font-extrabold leading-tight text-black sm:text-[34px] lg:text-[40px]">
          {title}
        </h1>

        <nav className="mb-7 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-400 lg:mb-10">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;

            return (
              <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                {crumb.href && !isLast ? (
                  <Link href={crumb.href} className="text-black underline underline-offset-2">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}

                {!isLast && <span className="text-gray-300">•</span>}
              </span>
            );
          })}
        </nav>

        <article className="kim-static-page max-w-[1180px] text-[14px] leading-[1.75] text-black sm:text-[15px] lg:text-[16px]">
          {children}
        </article>
      </div>
    </section>
  );
}
