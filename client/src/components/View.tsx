/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from "@/layouts/AppLayout";
import BlankLayout from "@/layouts/BlankLayout";
import React from "react";
interface IPropsView {
  component: JSX.Element;
  layout: string;
  title: string;
}

const View: React.FC<IPropsView> = (props) => {
  const layouts: { [key: string]: React.FC<{ children: React.ReactNode }> } = {
    app: AppLayout,
  };
  document.title = props.title;
  const Layout = props.layout ? layouts[props.layout] : BlankLayout;

  return <Layout>{props.component}</Layout>;
};
export default View;
