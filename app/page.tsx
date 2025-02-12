"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import "@fontsource/poppins"; // Import Poppins font
import { listenerCount } from "node:process";

import VelocityZmqListener, { DecodePacket } from "./ZmqListener";
import ZmqClient from "./ZmqClient";

const Magic: React.FC = () => {
  
  //Useless CSS
  const pageStyle: React.CSSProperties = {
    backgroundColor: "#E58C8A",
    height: "100vh",
    width: "100vw",
    margin: 0,
    padding: 0,
    display: "flex", // Use flexbox for centering
    justifyContent: "center", // Center horizontally
    alignItems: "center", // Center vertically
    fontFamily: "Poppins, sans-serif",
    overflow: "hidden", // Prevent scrolling
  };

  
  //ZMQ setup for Link
  const zmqService = useRef(VelocityZmqListener.factory());
  const velocities = useRef<DecodePacket | null>(null);
  const sideLikelihoods = useRef<number[]>(Array(8).fill(0));

  useEffect(() => {
    zmqService.current.start();

    return () => {
      zmqService.current.stop();
    };
  }, []);

  useEffect(() => {
    function handleDecodeData(data: DecodePacket) {
      velocities.current = data;

      const newX =
        position.current.x + velocities.current.final_velocity_x * 0.015;

      const newY =
        position.current.y + velocities.current.final_velocity_y * 0.015;

        position.current = { x: newX, y: newY };

    zmqService.current.events.on(
      ZmqClient.EVENT_MESSAGE,
      handleDecodeData,
    );

    return () => {
      zmqService.current.events.off(
        ZmqClient.EVENT_MESSAGE,
        handleDecodeData,
      );
    };
  }
  }, [velocities.current])

  //Canvas setup
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  //Pointer lock setup
  const [isLocked, setIsLocked] = useState(false);

  //Set up the position of the dot to track
  const canvasHeight = 1100;
  const canvasWidth = canvasHeight;
  const position = useRef({x: canvasWidth/2, y: canvasHeight / 2})

  //Draw the Dots
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Draw the dot cursor
    ctx.fillStyle = "#7EE8FA";
    ctx.beginPath();
    ctx.arc(position.current.x, position.current.y, 27, 0, 2 * Math.PI);
    ctx.fill();

    //ctx.fillStyle = "#80FF72";
    ctx.fillStyle = "yellow";
    
    let coordinatesTargets = [
      {x: 1/6, y: 1/6},
      {x: 1/2, y: 1/6},
      {x: 5/6, y: 1/6},
      {x: 1/2, y: 1/2},
      {x: 1/6, y: 1/2},
      {x: 5/6, y: 1/2},
      {x: 1/6, y: 5/6},
      {x: 1/2, y: 5/6},
      {x: 5/6, y: 5/6},
     ];

     let scaledCoordinates = coordinatesTargets.map(coord => {
      return {
        x: coord.x * canvas.width,
        y: coord.y * canvas.height
      };
    });

     
    for (let i = 0; i < coordinatesTargets.length; i++) {
      ctx.beginPath();
      ctx.arc(coordinatesTargets[i].x * canvas.width, coordinatesTargets[i].y * canvas.height, 69, 0, 2 * Math.PI);
      ctx.fill();
    }
    console.log(velx.current + vely.current);
    if (Math.abs(velocities.current?.final_velocity_x ?? 0) + Math.abs(velocities.current?.final_velocity_y ?? 0) < 100) {
      console.log("We reached low velocities");
      let hitCircleIndex = findClosestCircle();
      ctx.fillStyle = "red"
      ctx.beginPath();
      ctx.arc(coordinatesTargets[hitCircleIndex].x * canvas.width, coordinatesTargets[hitCircleIndex].y * canvas.height, 69, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    function findClosestCircle() {
      // Initialize variables within the function's scope
      let closestIndex = -1;
      let smallestDistance = Infinity;
    
      for (let i = 0; i < coordinatesTargets.length; i++) {
        let target = scaledCoordinates[i];
        let distance = Math.sqrt(Math.pow(target.x - position.current.x, 2) + Math.pow(target.y - position.current.y, 2));
    
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestIndex = i;
        }
      }
    
      return closestIndex;
    }


  }, []);
  
  const velx = useRef<number>(0);
  const vely = useRef<number>(0);

  //Mouse movements runnin'
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      velx.current = e.movementX;
      vely.current = e.movementY;

      const newX = position.current.x + e.movementX;
      const newY = position.current.y + e.movementY;
      //position.current = { x: newX, y: newY };
      drawScene();
    };

    const handleClick = () => {
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      } else {
        canvas.requestPointerLock();
      }
    };

    const lockChangeAlert = () => {
      if (document.pointerLockElement === canvas) {
        console.log("Pointer lock activated.");
        document.addEventListener("mousemove", handleMouseMove);
        drawScene();
      } else {
        console.log("Pointer lock deactivated.");
        document.removeEventListener("mousemove", handleMouseMove);
      }
    };

    canvas.addEventListener("click", handleClick);
    document.addEventListener("pointerlockchange", lockChangeAlert);

    return () => {
      canvas.removeEventListener("click", handleClick);
      document.removeEventListener("pointerlockchange", lockChangeAlert);
    };
  }, []);

  

  //Debug corner
  console.log("position: " + position.current.x);

  return (
    <div style={pageStyle}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          position: "relative",
          opacity: 1,
          zIndex: 0,
        }}
      />
    </div>
  );
};

export default Magic;