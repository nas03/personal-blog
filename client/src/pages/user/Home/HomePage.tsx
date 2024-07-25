import SideBar from "@/components/SideBar";
import { GrAnalytics } from "react-icons/gr";
import Weather from "./Weather";

const HomePage = () => {
  const items = [
    {
      title: "weather",
      icon: <GrAnalytics style={{ fontSize: "1.3rem" }} />,
    },
    {
      title: "forum",
      icon: <GrAnalytics style={{ fontSize: "1.3rem" }} />,
    },
    {
      title: "posts",
      icon: <GrAnalytics style={{ fontSize: "1.3rem" }} />,
    },
    {
      title: "analytics",
      icon: <GrAnalytics style={{ fontSize: "1.3rem" }} />,
    },
  ];

  return (
    <>
      <div className="flex w-full flex-row pr-5">
        <SideBar items={items} />
        <Weather />
      </div>
    </>
  );
};

export default HomePage;
