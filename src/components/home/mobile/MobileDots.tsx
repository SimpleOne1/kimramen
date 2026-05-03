export default function MobileDots() {
  return (
    <div className="mt-3 flex justify-center gap-[5px]">
      <span className="h-[6px] w-4 rounded-full bg-black" />
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} className="h-[6px] w-[6px] rounded-full bg-[#d7dce1]" />
      ))}
    </div>
  );
}
