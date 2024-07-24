import { Spin } from "antd";

const Loader = () => {
  return (
    <Spin
      className="bg-white"
      size="large"
      tip="Loading..."
      spinning={true}
      fullscreen
    ></Spin>
  );
};

export default Loader;
