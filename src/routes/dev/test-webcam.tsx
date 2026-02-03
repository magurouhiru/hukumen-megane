import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/dev/test-webcam")({
  component: TestWebcamComponent,
});

function TestWebcamComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        if (videoRef.current) {
          console.log(
            videoRef.current.clientHeight,
            videoRef.current.clientWidth,
          );
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              height: videoRef.current.clientHeight / 2,
              width: videoRef.current.clientWidth / 2,
              facingMode: "user",
            },
            audio: false,
          });
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay={true}
        playsInline
        className="h-screen w-full -scale-x-100 object-fill"
      >
        <track kind="captions" />
      </video>
    </div>
  );
}
