import { BellOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import { Divider } from "antd";
import { CiLocationOn } from "react-icons/ci";
import { SiClevercloud } from "react-icons/si";
import { Link } from "react-router-dom";
interface IPropsHeader {
  title: string;
  variants?: "default" | "auth";
  geoLocation: string;
}

const Header: React.FC<IPropsHeader> = (props) => {
  return (
    <>
      <nav className="z-20 grid w-full grid-cols-3 px-5 pt-10">
        <div className="flex w-full flex-row items-center gap-24">
          <div className="flex flex-row items-center justify-center gap-2">
            <Link to={"/home"}>
              <SiClevercloud style={{ color: "white", fontSize: "2rem" }} />
            </Link>
            <h1 className="text-2xl font-bold capitalize text-[#eef1f6] hover:cursor-pointer">
              {props.title}
            </h1>
          </div>
          {/* <p className="text-[#e6e6e6]">Hà Nội, Việt Nam</p> */}
          <div className="flex flex-row items-end justify-around gap-1">
            <CiLocationOn
              style={{
                color: "white",
                fontSize: "1.3rem",
              }}
            />
            <p className="text-[#e6e6e6]">{props.geoLocation}</p>
          </div>
        </div>
        <div className="flex w-full flex-row justify-between rounded-full bg-[#85aab3] pl-5">
          <input
            className="grow-1 text-md flex-1 rounded-full bg-inherit text-[#e6e6e6] placeholder:text-[#b6c4ca] focus:outline-none"
            placeholder="Search"
            aria-placeholder="Search"
          />
          <SearchOutlined className="grow-0 cursor-pointer rounded-full p-3 hover:bg-white hover:transition-colors" />
        </div>
        {!props.variants || props.variants === "default" ? (
          <div className="flex flex-row items-center justify-end gap-7 pr-5">
            <BellOutlined
              className="hover:cursor-pointer"
              style={{
                color: "white",
                fontSize: "1.3rem",
              }}
            />
            <UserOutlined
              className="hover:cursor-pointer"
              style={{
                color: "white",
                fontSize: "1.3rem",
              }}
            />
          </div>
        ) : (
          <div className="flex flex-row items-center justify-end gap-7 pr-5">
            <Link
              className="rounded-md border-2 border-[#e6ecf2] px-5 py-2 font-bold text-[#e6ecf2] hover:bg-[#94bdbc]"
              to={"/signin"}>
              Login
            </Link>
            <Link
              className="rounded-md border-2 border-[#e6ecf2] px-5 py-2 font-bold text-[#e6ecf2] hover:bg-[#94bdbc]"
              to={"/signup"}>
              Sign Up
            </Link>
          </div>
        )}
      </nav>
      <Divider
        style={{
          boxShadow: "revert",
        }}
      />
    </>
  );
};
export default Header;
