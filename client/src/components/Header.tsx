import { BellOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import { Divider } from "antd";
import { CiLocationOn } from "react-icons/ci";
const Header = () => {
  return (
    <>
      <nav className="z-20 grid w-full grid-cols-3 px-5 pt-10">
        <div className="flex w-full flex-row items-center gap-24">
          <h1 className="text-2xl font-bold text-[#eef1f6] hover:cursor-pointer">
            Weather Visual
          </h1>
          {/* <p className="text-[#e6e6e6]">Hà Nội, Việt Nam</p> */}
          <div className="flex flex-row items-end justify-around gap-1">
            <CiLocationOn
              style={{
                color: "white",
                fontSize: "1.3rem",
              }}
            />
            <p className="text-[#e6e6e6]">Nam Từ Liêm, Hà Nội, Việt Nam</p>
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
