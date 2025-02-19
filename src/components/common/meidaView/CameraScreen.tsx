import { FC, useEffect, useRef } from "react";

const CameraScreen: FC<{ stream: MediaStream }> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream ?? null;
      videoRef.current.autoplay = true;
    }
    return () => {};
  }, [stream]);

  return <video ref={videoRef} width="100%" height="auto"></video>;
};

export default CameraScreen;
