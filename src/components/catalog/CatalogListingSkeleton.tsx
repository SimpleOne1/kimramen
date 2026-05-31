function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-[#e5dfdb] bg-white p-4 shadow-sm">
      <div className="mb-4 h-36 animate-pulse rounded-xl bg-[#f2efed]" />
      <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-[#f2efed]" />
      <div className="mb-2 h-4 w-4/5 animate-pulse rounded bg-[#f2efed]" />
      <div className="mb-5 h-4 w-2/3 animate-pulse rounded bg-[#f2efed]" />
      <div className="h-6 w-20 animate-pulse rounded bg-[#f2efed]" />
    </div>
  );
}

export default function CatalogListingSkeleton() {
  return (
    <main className="min-h-screen bg-white px-4 py-9 text-black lg:px-10 lg:py-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-14">
          <div className="mb-5 h-11 w-80 max-w-full animate-pulse rounded-xl bg-[#f2efed]" />
          <div className="h-5 w-56 animate-pulse rounded bg-[#f2efed]" />
        </div>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <aside className="hidden w-[300px] shrink-0 lg:block">
            <div className="space-y-8">
              <div className="h-10 w-36 animate-pulse rounded-xl bg-[#f2efed]" />
              <div className="h-8 w-32 animate-pulse rounded bg-[#f2efed]" />
              <div className="h-32 animate-pulse rounded-2xl bg-[#f2efed]" />
              <div className="h-48 animate-pulse rounded-2xl bg-[#f2efed]" />
              <div className="h-48 animate-pulse rounded-2xl bg-[#f2efed]" />
            </div>
          </aside>
          <section className="min-w-0 flex-1">
            <div className="mb-7 flex justify-between">
              <div className="h-10 w-32 animate-pulse rounded-xl bg-[#f2efed] lg:hidden" />
              <div className="ml-auto h-10 w-24 animate-pulse rounded-xl bg-[#f2efed]" />
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
