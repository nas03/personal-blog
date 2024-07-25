import { motion } from "framer-motion";
import React, { useRef, useState } from "react";
import { GrAnalytics } from "react-icons/gr";
import { Link, useSearchParams } from "react-router-dom";

interface IPropsTab {
  title: string;
  icon: JSX.Element;
  selected: string | null;
  setPosition: React.Dispatch<
    React.SetStateAction<{ height: number; top: number; opacity: number }>
  >;
}

interface IPropsCursor {
  position: {
    top: number;
    opacity: number;
  };
}

const SideBar = () => {
  const selected = useSearchParams()[0].get("tab");

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
  const idx = selected ? items.findIndex((item) => item.title === selected) : 0;
  const [position, setPosition] = useState(
    selected
      ? { height: 48, top: idx * 68, opacity: 100 }
      : { height: 48, top: 0, opacity: 100 },
  );

  return (
    <>
      <ul className="relative min-w-[17rem]">
        <Cursor position={position} />
        {items.map((item, key) => (
          <Tab
            selected={selected}
            setPosition={setPosition}
            title={item.title}
            icon={item.icon}
            key={key}
          />
        ))}
      </ul>
    </>
  );
};

const Tab: React.FC<IPropsTab> = ({ title, icon, setPosition }) => {
  const ref = useRef<HTMLAnchorElement | null>(null);
  return (
    <li>
      <Link
        to={`?tab=${title}`}
        ref={ref}
        onClick={() => {
          // CHECK IF REF IS NULL
          if (!ref.current) return;
          // SET POSITION OF CURSOR

          setPosition({
            height: ref?.current?.getBoundingClientRect()?.height || 48,
            top: ref?.current?.offsetTop || 0,
            opacity: 1,
          });
        }}
        className={`z-10 mb-5 flex w-full flex-row items-center justify-start gap-[8px] rounded-r-full py-3 pl-14 pr-3 font-semibold capitalize text-[#e6e6e6] hover:cursor-pointer`}>
        <span className="z-[11]">{icon}</span>
        <p className="z-[11]">{title}</p>
      </Link>
    </li>
  );
};

const Cursor: React.FC<IPropsCursor> = ({ position }) => {
  return (
    <motion.li
      animate={position}
      className="absolute z-[2] mb-5 w-full rounded-r-full bg-[#5c9eb8] py-3 pl-14 pr-3 text-[#e6e6e6]"></motion.li>
  );
};
export default SideBar;
