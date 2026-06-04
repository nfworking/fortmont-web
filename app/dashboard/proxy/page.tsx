import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Fortmont Proxy",
  description: "Dashboard for managing your Fortmont proxy settings.",
};



import ProxyPage  from "@/components/proxy-page";

export default function Proxy() {
    return <ProxyPage />;
}