import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <div className="flex flex-col overflow-hidden pb-[500px]">
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-4xl font-semibold text-black dark:text-white">
                Learn from the Experts with <br />
                <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                  AI Buddy Audio
                </span>
              </h1>
            </>
          }
        >
          <div className="relative h-full w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm rounded-2xl" />
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2940&auto=format&fit=crop"
              alt="AI Learning"
              className="w-full h-full object-cover object-center rounded-2xl"
            />
          </div>
        </ContainerScroll>
      </div>
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          onClick={() => navigate("/signin")}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          Sign In
        </Button>
      </div>
    </div>
  );
};

export default Landing;