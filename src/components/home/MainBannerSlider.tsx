"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const videos = [
  "/videos/1.mp4",
  "/videos/2.mp4",
  "/videos/3.mp4"
];

export default function VideoSlider() {
  const [index, setIndex] = useState(0);

  // Автоматическая смена каждые 6 секунд
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % videos.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full overflow-hidden h-[550px]">
      <AnimatePresence>
        <motion.div
          key={index}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{
            duration: 1,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-0 w-full h-full"
        >
          <video
            src={videos[index]}
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}