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

  // Check if user is a waiter or cashier (staff member)
  const isWaiterOrCashier =
    role?.toLowerCase() === "waiter" ||
    role?.toLowerCase() === "cashier" ||
    role?.toLowerCase() === "staff";

  // Fetch waiter metrics if user is waiter/cashier
  const { data: metricsData } = useQuery({
    queryKey: ["waiterMetrics"],
    queryFn: getWaiterMetrics,
    enabled: isWaiterOrCashier, // Only fetch if user is staff
    staleTime: 60000,
  });

  // Use dynamic data for waiters, hardcoded for others
  const totalEarnings = isWaiterOrCashier
    ? parseFloat(metricsData?.data?.data?.totalEarnings || 0)
    : 512;

  const inProgressOrders = isWaiterOrCashier
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
            title={isWaiterOrCashier ? "Total Orders" : "In Progress"}
            icon={<GrInProgress />}
            number={inProgressOrders}
            footerNum={
              isWaiterOrCashier
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
