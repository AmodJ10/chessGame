import React, { useEffect, useState, useCallback } from "react";
import Game from "./Game";
import InitGame from "./InitGame";
import socket from "./socket";
import "./App.css";

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameSubmitted, setUsernameSubmitted] = useState(false);
  const [room, setRoom] = useState("");
  const [orientation, setOrientation] = useState("");
  const [players, setPlayers] = useState([]);
  const [showModal, setShowModal] = useState(true);

  const cleanup = useCallback(() => {
    setRoom("");
    setOrientation("");
    setPlayers([]);
  }, []);

  useEffect(() => {
    socket.on("opponentJoined", (roomData) => {
      console.log("roomData", roomData);
      setPlayers(roomData.players);
    });
  }, []);

  const handleContinue = () => {
    if (username && password) {
      // Emit both username and password to the server for authentication
      socket.emit("authenticate", { username, password });
      setUsernameSubmitted(true);
      setShowModal(false);
    } else {
      // Handle the case where either username or password is missing
      // You can provide feedback to the user, for example, by showing an alert
      alert("Both username and password are required. Please fill in both fields.");
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="logo">Stonkfish</h1>
      </header>

      <div className="content">
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2 className="modal-title">Enter Username And Password</h2>
              <input
                autoFocus
                className="username-input"
                type="text"
                placeholder="Username"
                value={username}
                required
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                className="password-input"
                type="password"
                placeholder="Password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="continue-button" onClick={handleContinue}>
                Continue
              </button>
            </div>
          </div>
        )}

        {usernameSubmitted && (
          <div className="center-chessboard">
            {room ? (
              <Game
                room={room}
                orientation={orientation}
                username={username}
                players={players}
                cleanup={cleanup}
              />
            ) : (
              <InitGame
                setRoom={setRoom}
                setOrientation={setOrientation}
                setPlayers={setPlayers}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
