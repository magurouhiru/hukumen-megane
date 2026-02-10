import { createFileRoute } from "@tanstack/react-router";
import React from "@/assets/react.svg";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <>
      <h1>Home Page</h1>
      <img src={React} alt="Homepage_Image" className="h-40 w-40" />
    </>
  );
}
