import React, { useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";
import { useQuery } from "@tanstack/react-query";
import { getWaiterMetrics } from "../https/index";
import { useSelector } from "react-redux";

const Home = () => {
  const { role } = useSelector((state) => state.user);

  useEffect(() => {
    document.title = "POS | Home";
  }, []);

  // Fetch waiter metrics if user is waiter
  const { data: metricsData } = useQuery({
    queryKey: ["waiterMetrics"],
    queryFn: getWaiterMetrics,
    enabled: role === "Waiter" || role === "waiter", // Only fetch if user is a waiter
    staleTime: 60000,
  });

  // Use dynamic data for waiters, hardcoded for others
  const totalEarnings =
    role === "Waiter" || role === "waiter"
      ? parseFloat(metricsData?.data?.data?.totalEarnings || 0)
      : 512;

  const inProgressOrders =
    role === "Waiter" || role === "waiter"
      ? metricsData?.data?.data?.totalOrders || 0
      : 16;

  return (
    <section className="bg-[#1f1f1f]  h-[calc(100vh-5rem)] overflow-hidden flex gap-3">
      {/* Left Div */}
      <div className="flex-[3]">
        <Greetings />
        <div className="flex items-center w-full gap-3 px-8 mt-8">
          <MiniCard
            title="Total Earnings"
            icon={<BsCashCoin />}
            number={Math.floor(totalEarnings)}
            footerNum={totalEarnings > 0 ? (totalEarnings / 100).toFixed(1) : 0}
          />
          <MiniCard
            title={
              role === "Waiter" || role === "waiter"
                ? "Total Orders"
                : "In Progress"
            }
            icon={<GrInProgress />}
            number={inProgressOrders}
            footerNum={
              role === "Waiter" || role === "waiter"
                ? metricsData?.data?.data?.customersServed || 0
                : 3.6
            }
          />
        </div>
        <RecentOrders />
      </div>
      {/* Right Div */}
      <div className="flex-[2]">
        <PopularDishes />
      </div>
      <BottomNav />
    </section>
  );
};

export default Home;
