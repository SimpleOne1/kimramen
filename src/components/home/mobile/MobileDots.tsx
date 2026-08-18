export default function MobileDots() {
  return (
    <div className="mt-2 flex justify-center gap-[4px]">
      <span className="h-[4px] w-3 rounded-full bg-black" />
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="h-[4px] w-[4px] rounded-full bg-[#d7dce1]" />
      ))}
    </div>
  );
}
