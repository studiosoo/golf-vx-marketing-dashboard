export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-[20px] font-semibold text-[#222222] mb-6 leading-tight">
      {children}
    </h1>
  );
}
