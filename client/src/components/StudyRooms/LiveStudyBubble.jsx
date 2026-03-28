import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { Mic, MicOff, Video, VideoOff, X } from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import { motion } from "framer-motion";

export const LiveStudyBubble = ({ roomId, onClose }) => {
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  
  const userVideo = useRef();
  const peersRef = useRef([]);
  const socket = useSocket();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
      socket.emit("join room", roomId);

      socket.on("all users", (users) => {
        const peers = [];
        users.forEach((userID) => {
          const peer = createPeer(userID, socket.id, currentStream);
          peersRef.current.push({
            peerID: userID,
            peer,
          });
          peers.push({ peerID: userID, peer });
        });
        setPeers(peers);
      });

      socket.on("user joined", (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, currentStream);
        peersRef.current.push({
          peerID: payload.callerID,
          peer,
        });
        setPeers((users) => [...users, { peerID: payload.callerID, peer }]);
      });

      socket.on("receiving returned signal", (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        item.peer.signal(payload.signal);
      });
    });

    return () => {
      socket.disconnect();
      if(stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending signal", { userToSignal, callerID, signal });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);
    return peer;
  }

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoMuted(!videoTrack.enabled);
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: -500, right: 50, top: -500, bottom: 50 }}
      className="fixed bottom-10 right-10 z-50 bg-gray-900 rounded-3xl p-3 shadow-2xl flex flex-col items-center border border-gray-700 w-48"
    >
      <div className="w-full flex justify-between items-center mb-2 px-1 text-gray-400">
         <span className="text-xs font-semibold">Live Room</span>
         <button onClick={onClose} className="hover:text-red-500"><X size={14}/></button>
      </div>
      
      <video
        playsInline
        muted
        ref={userVideo}
        autoPlay
        className={`w-40 h-40 object-cover rounded-full border-4 border-gray-800 shadow-inner ${videoMuted ? "opacity-30" : "opacity-100"}`}
      />
      {peers.map((peer) => {
        return <VideoPeer key={peer.peerID} peer={peer.peer} />;
      })}

      <div className="flex gap-4 mt-4 bg-gray-800 px-4 py-2 rounded-full shadow-lg">
        <button onClick={toggleAudio} className={`p-2 rounded-full ${audioMuted ? "bg-red-500 text-white" : "bg-gray-700 text-gray-300 hover:text-white"}`}>
          {audioMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        <button onClick={toggleVideo} className={`p-2 rounded-full ${videoMuted ? "bg-red-500 text-white" : "bg-gray-700 text-gray-300 hover:text-white"}`}>
          {videoMuted ? <VideoOff size={16} /> : <Video size={16} />}
        </button>
      </div>
    </motion.div>
  );
};

const VideoPeer = ({ peer }) => {
  const ref = useRef();
  useEffect(() => {
    peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video playsInline autoPlay ref={ref} className="w-16 h-16 absolute -top-4 -left-4 rounded-full border-2 border-indigo-500 shadow-md object-cover" />;
};

