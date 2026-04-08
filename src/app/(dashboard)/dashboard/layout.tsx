import DashboardNav from './_components/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex h-screen bg-[var(--bg-primary)] text-[var(--fg-primary)] overflow-hidden'>
      <DashboardNav />
      <div className='flex-1 overflow-y-auto'>
        <div className='w-full px-6 py-8'>{children}</div>
      </div>
    </div>
  );
}
