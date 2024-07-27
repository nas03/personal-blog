import Header from '@/components/Header';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  // const user = JSON.parse(localStorage.getItem("user") || "");

  return (
    <div className="flex min-h-screen w-screen flex-col bg-gradient-to-t from-[#4f778e] to-[#6b9aa4]">
      <Header geoLocation="Nam Tu Liem, Hanoi, Vietnam" title={'weather visual'} variants="auth" />
      {children}
    </div>
  );
};

export default AppLayout;
