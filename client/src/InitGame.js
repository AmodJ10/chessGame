import React, { useState } from "react";
import Modal from "react-modal";
import socket from "./socket";
import "./InitGame.css"

// This is necessary to ensure react-modal works properly with Next.js
if (typeof window !== "undefined") {
 Modal.setAppElement("body");
}

export default function InitGame({ setRoom, setOrientation, setPlayers }) {
 const [roomDialogOpen, setRoomDialogOpen] = useState(false);
 const [roomInput, setRoomInput] = useState("");
 const [roomError, setRoomError] = useState("");

 const handleJoinRoom = () => {
    if (!roomInput) return;

    socket.emit("joinRoom", { roomId: roomInput }, (response) => {
      if (response.error) {
        setRoomError(response.message);
      } else {
        setRoom(response?.roomId);
        setPlayers(response?.players);
        setOrientation("black");
        setRoomDialogOpen(false);
      }
    });
 };

 const handleStartGame = () => {
    socket.emit("createRoom", (response) => {
      setRoom(response);
      setOrientation("white");
    });
 };

 return (
    <div className="init-game-container">
      <div className= "GIF">
        <img src = {require("./chess_gif.gif")} alt = "loading..."/>
      </div>
      <Modal
        isOpen={roomDialogOpen}
        onRequestClose={() => setRoomDialogOpen(false)}
        contentLabel="Select Room to Join"
      >
        <h2 className="react-modal-title">Select Room to Join</h2>
        <input
          autoFocus
          className="room-input"
          type="text"
          placeholder="Room ID"
          value={roomInput}
          required
          onChange={(e) => setRoomInput(e.target.value)}
        />
        <p className="room-error">
          {!roomError ? "Enter a room ID" : `Invalid room ID: ${roomError}`}
        </p>
        <button onClick={handleJoinRoom}>Join Room</button>
      </Modal>
      <div className="button-init">
        <button className="start-game-button" onClick={handleStartGame}>
          Start a game
        </button>
        <button className="join-game-button" onClick={() => setRoomDialogOpen(true)}>
          Join a game
        </button>
      </div>
    </div>
 );
}