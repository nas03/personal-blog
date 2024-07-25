import Header from "@/components/Header";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  // const user = JSON.parse(localStorage.getItem("user") || "");

  // const verifyToken   =
  return (
    <div className="min-h-screen w-screen bg-gradient-to-t from-[#4f778e] to-[#6b9aa4]">
      <Header />
      {children}
    </div>
  );
};

export default AppLayout;
