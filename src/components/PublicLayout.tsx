import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import Snowfall from "./Snowfall";

export default function PublicLayout() {
  return (
    <div className="relative min-h-screen bg-[#132133] text-white xmas-pattern">
      <TopNav />
      <Snowfall />
      <Outlet />
    </div>
  );
}
