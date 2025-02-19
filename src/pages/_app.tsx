import { ChakraProvider } from "@chakra-ui/react";
import { NextPage } from "next";
import { AppProps } from "next/app";
import Peer from "peerjs";
import { ReactElement, ReactNode, useEffect } from "react";
import { RecoilRoot } from "recoil";
import { Socket } from "socket.io-client";
import theme from "../theme";

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

if (process.env.NEXT_PUBLIC_API_MOCKING === "enabled") {
  require("@src/mocks");
}

declare global {
  interface Window {
    socket: Socket;
    myPeer: Peer;
  }
}

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  useEffect(() => {
    // window.sockets = io('http://localhost:3001', {
    //   // autoConnect: true,
    //   // forceNew: true,
    //   transports: ['websocket', 'polling'],
    // })
    //   .on('connect', () => {
    //     console.log('connect ! ', window.sockets.connected);
    //   })
    //   .on('error', (err) => {
    //     console.log(err);
    //   });
    // return () => {
    //   // window.sockets.close();
    // };
  }, []);

  const getLayout = Component?.getLayout || (page => page);
  //  NOTE getLayout을 recoilRoot보다 밖에 두면 Layout이 동일하지 않는 이상 초기화됨.
  return (
    <ChakraProvider resetCSS theme={theme}>
      <RecoilRoot>{getLayout(<Component {...pageProps} />)}</RecoilRoot>
    </ChakraProvider>
  );
}

export default MyApp;
