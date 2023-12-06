import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import socket from "./socket";
import axios from "axios"; 
import "./Game.css"; 

function Game({ players, room, orientation, cleanup }) {
 const chess = useMemo(() => new Chess(), []);
 const [fen, setFen] = useState(chess.fen());
 const [over, setOver] = useState("");
 const [singlePlayer, setSinglePlayer] = useState(false); 

 const makeAMove = useCallback(
  (move) => {
    try {
      const result = chess.move(move);
      setFen(chess.fen());

      console.log("Move details:", move);
      console.log("Chess.js result:", result);

      if (chess.isGameOver()) {
        if (chess.isCheckmate()) {
          setOver(
            `Checkmate! ${chess.turn() === "w" ? "black" : "white"} wins!`
          );
        } else if (chess.isDraw()) {
          setOver("Draw");
        } else {
          setOver("Game over");
        }
      }

      return result;
    } catch (e) {
      console.error("Error in makeAMove:", e);
      return null;
    }
  },
  [chess]
);

 const fetchAndApplyAIMove = async () => {
  try {
    const response = await axios.get("http://127.0.0.1:5000/get_best_move", {
      params: {
        fen: chess.fen(),
        turn: '0',
        depth: '3'
      }
    });

    console.log("AI Move Full Response:", response);

    if (response && response.data) {
      const aiMove = response.data.best_move;

      if (aiMove) {
        console.log("AI Move:", aiMove);

        const result = makeAMove(aiMove);

        if (result !== null) {
          console.log("Make a Move Result:", result);
        } else {
          console.error("makeAMove returned null");
        }
      } else {
        console.error("AI move is undefined or null");
      }
    } else {
      console.error("Response or response.data is undefined");
    }
  } catch (error) {
    console.error("Failed to fetch AI move:", error);
  }
};



  function onDrop(sourceSquare, targetSquare) {
    if (chess.turn() !== orientation[0]) return false;

    if (!singlePlayer && players.length < 2) return false;

  
    const moveData = {
      from: sourceSquare,
      to: targetSquare,
      color: chess.turn(),
      promotion: "q",
    };

    const move = makeAMove(moveData);

    if (move === null) return false;

    if (singlePlayer) {
      fetchAndApplyAIMove();
    }

    console.log("Emitting move:", move);
    socket.emit("move", { 
      move,
      room,
    }); 
    
    return true;
  }

  useEffect(() => {
    socket.on("move", (move) => {
      makeAMove(move); //
    });
  }, [makeAMove]);

  useEffect(() => {
    socket.on('playerDisconnected', (players) => {
      console.log(players.username)
      setOver(`${players.username} has disconnected`); // set game over
    });
  }, []);

  useEffect(() => {
    socket.on('closeRoom', ({ roomId }) => {
      if (roomId === room) {
        cleanup();
      }
    });
  }, [room, cleanup]);

  return (
    <div className="game-container">
      <div className="game-info">
        <h2>Room ID: {room}</h2>
        <button onClick={() => setSinglePlayer(!singlePlayer)}>
        {singlePlayer ? "Multiplayer" : "Single Player"}
      </button>
      </div>
      <div className="board-container">
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          boardOrientation={orientation}
          boardWidth={700}
        />
      </div>
      {players.length > 0 && (
        <div className="players-container">
          <h3>Players</h3>
          <ul>
            {players.map((p) => (
              <li key={p.id}>{p.username}</li>
            ))}
          </ul>
        </div>
      )}
      {over && (
        <div className="game-over-dialog">
          <h2>{over}</h2>
          <button onClick={() => cleanup()}>Continue</button>
        </div>
      )}
    </div>
  );
}

export default Game;


