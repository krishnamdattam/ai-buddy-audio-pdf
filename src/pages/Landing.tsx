import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative bg-black">
      <div className="flex flex-col overflow-hidden pb-20">
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-4xl font-semibold text-white">
                Learn from the Experts with <br />
                <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                  AI Buddy
                </span>
              </h1>
            </>
          }
        >
          <div className="relative h-full w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm rounded-2xl" />
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600/50 to-indigo-600/50 blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2940&auto=format&fit=crop"
              alt="AI Learning"
              className="w-full h-full object-cover object-center rounded-2xl relative z-10"
            />
          </div>
        </ContainerScroll>
        <div className="flex justify-center w-full -mt-10 relative z-20">
          <Button
            onClick={() => navigate("/signin")}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-[0_0_30px_-5px_rgba(147,51,234,0.5)] transition-all duration-200 hover:scale-105"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;