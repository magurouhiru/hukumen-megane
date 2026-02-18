import { createFileRoute, Link } from "@tanstack/react-router";
import icon from "@/assets/icon.svg";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,200px)]">
      <Link
        to="/otoge"
        className="grid aspect-square grid-cols-3 grid-rows-3 items-center justify-center rounded border border-gray-800 hover:shadow"
      >
        <span className="col-start-2 row-start-1 animate-left-right text-center text-3xl">
          🎵
        </span>
        <span className="col-start-1 row-start-2 animate-up-down text-center text-3xl [animation-delay:500ms]">
          ✋
        </span>
        <img
          src={icon}
          alt="Homepage_Image"
          className="col-start-2 row-start-2 mx-auto h-10 w-10"
        />
        <span className="col-start-3 row-start-2 -scale-x-100 animate-up-down text-center text-3xl">
          ✋
        </span>
      </Link>
    </div>
  );
}
