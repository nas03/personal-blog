import Header from "@/components/Header";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-screen">
      <Header />
      {children}
    </div>
  );
};

export default AppLayout;
