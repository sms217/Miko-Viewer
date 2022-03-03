import useSocket from '@src/hooks/useSocket';
import {
  messagesState,
  // mySocket as socket,
  myStreamState,
  newMessageState,
  PeerDataInterface,
  peerDataListState,
  roomIdState,
  screenStreamIDState,
  screenStreamState,
  startSharingButtonDisabledState,
  startSharingState,
  userNamesState,
  videoStreamsState,
} from '@src/state/recoil/viewingState';
import { useUser } from '@src/state/swr/useUser';
import produce from 'immer';
import { nanoid } from 'nanoid';
import Peer, { DataConnection } from 'peerjs';
import { FC, useCallback, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

interface ConnectParams {
  audio: boolean;
  video: boolean;
}

const myPeerUniqueID = nanoid();
const myPeer = new Peer(myPeerUniqueID, { debug: 2 });
const concertId = 1111;

//@ts-ignore
const getUserMedia =
  //@ts-ignore
  navigator.getUserMedia ||
  //@ts-ignore
  navigator.webkitGetUserMedia ||
  //@ts-ignore
  navigator.mozGetUserMedia;

const addEvnetToDataConnection = (dataConnection: DataConnection) => {
  dataConnection.on('data', (data) => {
    console.log('Received B', data);
  });
};

const WithSocketEventLayout: FC = ({ children }) => {
  const socket = useSocket();
  const user = useUser();

  const [streamOptions, _] = useState<ConnectParams>({
    audio: true,
    video: true,
  });

  const [roomId, setRoomIdState] = useRecoilState(roomIdState);
  const [videoStreams, setVideoStreams] = useRecoilState(videoStreamsState);
  const [peerDataList, setPeerDataList] = useRecoilState(peerDataListState);
  const [myStream, setMyStream] = useRecoilState(myStreamState);
  const [userNames, setUserNames] = useRecoilState(userNamesState);
  const [newMessage, setNewMessage] = useRecoilState(newMessageState);
  const [messages, setMessages] = useRecoilState(messagesState);

  const [shareScreenButtonText, setShareScreenButtonText] = useState<string>(
    'Start screen sharing'
  );
  const [startSharing, setStartSharing] = useRecoilState(startSharingState);
  const [startSharingButtonDisabled, setStartSharingButtonDisabled] =
    useRecoilState(startSharingButtonDisabledState);
  const [screenStreamID, setScreenStreamID] =
    useRecoilState(screenStreamIDState);
  const [screenStream, setScreenStream] = useRecoilState(screenStreamState);

  const addDataConnectionToPeersDataList = useCallback(
    (dataConnection: DataConnection) => {
      setPeerDataList(
        produce((peers) => {
          const idx = peers.findIndex(
            (peer) => peer.id === dataConnection.peer
          );
          console.log('find index ', idx, peers, dataConnection);
          peers[idx].dataConnection = dataConnection;
        })
      );
    },
    []
  );

  useEffect(() => {
    if (!socket || !user.data) {
      console.log('not socket or user', socket, user);
      return;
    }
    console.log('user and socket exist', socket, user, myPeerUniqueID);

    socket.emit(
      'fe-new-user-request-join',
      myPeerUniqueID,
      roomId,
      user.data,
      concertId
    );

    myPeer.on('connection', (dataConnection) => {
      console.log('data connected to ', dataConnection.peer);
      // setPeerDataList(
      //   produce((peers) => {
      //     const idx = peers.findIndex(
      //       (peer) => peer.id === dataConnection.peer
      //     );
      //     peers[idx].dataConnection = dataConnection;
      //   })
      // );
      addDataConnectionToPeersDataList(dataConnection);
      addEvnetToDataConnection(dataConnection);
    });

    const newUserCome = (
      otherPeerId: string,
      roomID: string,
      userData: PeerDataInterface['data']
    ) => {
      console.log('new-user-come', otherPeerId, roomId, userData);

      setPeerDataList(
        produce((prevPeers) => {
          const notFound = !prevPeers.some((peer) => peer.id === otherPeerId);
          if (notFound && otherPeerId !== myPeerUniqueID)
            prevPeers.push({ id: otherPeerId, data: userData });
          return prevPeers;
        })
      );
      // socket.emit('newUserName', roomId, user.data.email);
      getUserMedia(
        streamOptions,
        (stream) => {
          setMyStream(stream);
          // localStorage.setItem('currentStreamId', stream.id);

          if (otherPeerId !== myPeerUniqueID) {
            socket.emit(
              'fe-answer-send-peer-id',
              roomID,
              myPeerUniqueID,
              userData
            );
            const call = myPeer.call(otherPeerId, stream);

            call.on('stream', (remoteStream) => {
              if (stream.id !== remoteStream.id) {
                setVideoStreams((prevStreams) => {
                  const newStreams = [...prevStreams];
                  const found = newStreams.some(
                    (el) => el.id === remoteStream.id
                  );
                  if (!found) newStreams.push(remoteStream);
                  return newStreams;
                });
              }
            });
          }
        },
        (err) => {
          console.log('Failed to get local stream', err);
        }
      );

      myPeer.on('call', (mediaConnection) => {
        getUserMedia(
          { video: true, audio: true },
          (myStream) => {
            setMyStream(myStream);
            // localStorage.setItem('currentStreamId', stream.id);
            mediaConnection.answer(myStream);
            mediaConnection.on('stream', (otherStream) => {
              if (myStream?.id !== otherStream.id) {
                setVideoStreams((prevStreams) => {
                  const newStreams = [...prevStreams];
                  const found = newStreams.some(
                    (aStream) => aStream.id === otherStream.id
                  );
                  if (!found) newStreams.push(otherStream);
                  return newStreams;
                });
              }
            });
          },
          (err) => {
            console.log('Failed to get stream', err);
          }
        );
      });

      const dataConnection = myPeer.connect(otherPeerId);

      dataConnection.on('open', () => {
        console.log('data connect success 👌 to' + otherPeerId);
        addDataConnectionToPeersDataList(dataConnection);
        addEvnetToDataConnection(dataConnection);
        dataConnection.send('Hello! I am' + myPeerUniqueID);
      });
    };
    const broadcastPeerId = (
      peerId: string,
      userData: PeerDataInterface['data']
    ) => {
      setPeerDataList(
        produce((prevPeers) => {
          const notFound = !prevPeers.some((peer) => peer.id === peerId);
          if (notFound && peerId !== myPeerUniqueID)
            prevPeers.push({ id: peerId, data: userData });
          return prevPeers;
        })
      );
    };
    const broadcastNewMessage = (data: {
      sender: string;
      receivedMessage: string;
    }) => {
      let currentSender = data.sender;
      setMessages((currentArray) => {
        return [
          ...currentArray,
          {
            sender: currentSender,
            receivedMessage: data.receivedMessage,
          },
        ];
      });
      setNewMessage('');
    };
    socket.on('be-new-user-come', newUserCome);
    socket.on('be-broadcast-peer-id', broadcastPeerId);
    socket.on('be-broadcast-new-message', broadcastNewMessage);

    // socket.on('newUserName', (userName: string) => {
    //   if (userName !== user.data.email) {
    //     setUserNames((userNames) => {
    //       const userNamesCopy = [...userNames];
    //       const found = userNamesCopy.some((el) => el === userName);
    //       if (!found) userNamesCopy.push(userName);

    //       return userNamesCopy;
    //     });
    //   }
    // });

    // socket.on('screen-share-receive', (streamID: string) => {
    //   setScreenStreamID(streamID);
    //   setShareScreenButtonText('Start screen sharing');
    //   setStartSharingButtonDisabled(true);
    // });

    // socket.on('screen-share-stop-done', (streamID: string) => {
    //   setStartSharingButtonDisabled(false);
    //   setVideoStreams((streams) => {
    //     const streamsCopy = streams.filter((el) => {
    //       return el.id !== streamID;
    //     });
    //     return streamsCopy;
    //   });
    // });

    socket.on('userLeft', (streamID: string) => {
      setVideoStreams((currentArray) => {
        let currentStreams = currentArray.filter((el) => {
          return el.id != streamID;
        });
        return [...currentStreams];
      });
    });

    window.onbeforeunload = () => {
      // const currentStreamID = localStorage.getItem('currentStreamId');
      socket.emit('userExited', myStream.id, roomId);
    };

    // socket.on('shareScreen', (stream) => {

    // })

    return () => {
      console.log('Socket Event Add - useEffect return');
      socket.off('new-user-arrived-finish', newUserCome);
      socket.off('be-broadcast-peer-id', broadcastPeerId);
      socket.off('be-broadcast-new-message', broadcastNewMessage);
      myPeer.destroy();
      setPeerDataList([]);
      setVideoStreams([]);
      setMessages([]);
    };
  }, [user.data, socket]);

  return <> {children}</>;
};

export default WithSocketEventLayout;
