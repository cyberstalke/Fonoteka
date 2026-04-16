import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Play, Pause } from "lucide-react";
import Hls from "hls.js";

const SocialIcon = ({ type }) => {
  const paths = {
    instagram:
      "M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5a4.25 4.25 0 0 0-4.25 4.25v8.5a4.25 4.25 0 0 0 4.25 4.25h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.25-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2z",
    telegram:
      "M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.703-.332 4.96c.483 0 .698-.221.969-.481l2.33-2.264 4.846 3.58c.894.493 1.538.24 1.76-.826l3.177-14.97c.325-1.305-.5-1.902-1.353-1.518z",
  };
  if (type === "google") {
    return (
      <svg width="16" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M23.7695 9.77372H12.2556V14.3873H18.8716C18.7652 15.0403 18.5264 15.6826 18.1767 16.2683C17.776 16.9393 17.2807 17.4502 16.7729 17.8392C15.2521 19.0046 13.479 19.2429 12.2476 19.2429C9.13691 19.2429 6.47903 17.2325 5.45011 14.5006C5.40859 14.4014 5.38102 14.299 5.34745 14.1978C5.12007 13.5025 4.99584 12.7661 4.99584 12.0008C4.99584 11.2042 5.13037 10.4417 5.37566 9.7216C6.34319 6.88141 9.06099 4.76006 12.2498 4.76006C12.8912 4.76006 13.5089 4.83641 14.0946 4.98869C15.4333 5.3367 16.3801 6.02212 16.9603 6.56428L20.4613 3.13576C18.3317 1.18317 15.5555 2.95218e-09 12.244 2.95218e-09C9.59665 -5.69793e-05 7.1525 0.824781 5.1496 2.21878C3.52531 3.34928 2.19316 4.86288 1.29412 6.62075C0.457891 8.25066 0 10.0569 0 11.999C0 13.9411 0.458591 15.7661 1.29483 17.381V17.3918C2.1781 19.1062 3.46975 20.5823 5.0396 21.7076C6.41104 22.6907 8.87017 24 12.244 24C14.1842 24 15.9038 23.6502 17.4203 22.9946C18.5142 22.5217 19.4835 21.9049 20.3611 21.1122C21.5206 20.0647 22.4288 18.7691 23.0486 17.2785C23.6684 15.7878 24 14.1022 24 12.2747C24 11.4236 23.9145 10.5592 23.7695 9.77363V9.77372Z"
          fill="#636674"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity"
    >
      <path d={paths[type]} />
    </svg>
  );
};

const App = () => {
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Responsive wave count
  const [barsCount, setBarsCount] = useState(window.innerWidth < 768 ? 30 : 65);
  const [isPlaying, setIsPlaying] = useState(false);
  const [listeners, setListeners] = useState(0);

  // Resize handler for waves
  useEffect(() => {
    const handleResize = () => setBarsCount(window.innerWidth < 768 ? 30 : 65);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchListeners = async () => {
    try {
      const response = await fetch(
        "https://stream.fonoteka.fm:1030/api/v2/channels/?limit=1&offset=0&server=1",
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      setListeners(Number(data?.results?.[0]?.listeners_current) || 0);
    } catch (e) {
      console.error("API Error:", e);
      setListeners(0);
    }
  };

  useEffect(() => {
    fetchListeners();
    const interval = setInterval(fetchListeners, 30000);
    return () => clearInterval(interval);
  }, []);

  const setupAnalyzer = () => {
    if (analyserRef.current) return;
    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyser.fftSize = 256;
      analyserRef.current = analyser;
    } catch (e) {
      console.log("AudioContext blocked");
    }
  };

  const animateWaves = () => {
    if (!isPlaying || !analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const bars = document.querySelectorAll(".wave-bar");
    bars.forEach((bar, i) => {
      const index = Math.floor((i / barsCount) * dataArray.length);
      const value = dataArray[index] / 255;
      gsap.to(bar, { scaleY: 0.5 + value * 3, duration: 0.1, ease: "none" });
    });
    animationFrameRef.current = requestAnimationFrame(animateWaves);
  };

  useEffect(() => {
    let idleTween;
    if (!isPlaying) {
      idleTween = gsap.to(".wave-bar", {
        scaleY: "random(0.7, 1.2)",
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { each: 0.08, from: "center" },
      });
    } else {
      gsap.killTweensOf(".wave-bar");
      animateWaves();
    }
    return () => {
      if (idleTween) idleTween.kill();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, barsCount]);

  useEffect(() => {
    const streamUrl = "https://stream.fonoteka.fm:1030/hls/stream_1_mp3.m3u8";
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(audioRef.current);
    } else if (audioRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      audioRef.current.src = streamUrl;
    }
  }, []);

  const togglePlay = (e) => {
    e.preventDefault();
    setupAnalyzer();
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  return (
    <div className="bg-[#0A0A0D] text-white selection:bg-[#FF3D00] min-h-screen flex flex-col font-sans overflow-x-hidden">
      <audio ref={audioRef} crossOrigin="anonymous" playsInline />

      {/* Background Waves - Fixed position to avoid layout shifts */}
      <div className="fixed inset-0 z-0 flex items-center justify-between w-full h-full pointer-events-none px-2  opacity-30">
        {[...Array(barsCount)].map((_, i) => (
          <div
            key={i}
            className="wave-bar flex-1 bg-gradient-to-b from-transparent via-[#FF430F] to-transparent"
            style={{ height: "40%", margin: "0 2px", borderRadius: "20px" }}
          />
        ))}
      </div>

      <nav className="relative z-20 flex justify-between items-center px-6 lg:px-20 py-6 lg:py-10">
        <img src="/logo.png" alt="Fonoteka" className="w-28 lg:w-[180px]" />
        <button className="bg-[#FF3D00] hidden px-5 lg:px-8 py-2 lg:py-3 rounded-full font-bold text-[10px] lg:text-[12px] uppercase tracking-widest active:scale-95 transition-all">
          Donat qilish
        </button>
      </nav>

      {/* Main content with flex-grow to push footer down */}
      <main className="relative z-10 flex-grow flex flex-col lg:grid pt-20 lg:pt-0 lg:grid-cols-12 items-center px-6 lg:px-20 gap-10 lg:gap-0 pb-10">
        <div className="lg:col-span-7 flex flex-col  lg:items-start  text-left">
          <h1 className="text-[40px] md:text-[60px] lg:text-[90px] font-black leading-[1.1] mb-6 ">
            Fonoteka Radio
          </h1>
          <p className="text-[#F5F5F5] text-sm md:text-base lg:text-[22px] max-w-[600px] mb-8 lg:mb-12 font-light leading-relaxed opacity-90">
            O‘zbek musiqa merosi va zamonaviy taronalarni birlashtirgan <br />{" "}
            ilk milliy radio-strimming platformasi. Milliy san’atimiz xazinasi{" "}
            <br /> har doim yoningizda – qayerda bo‘lmang, qalbingizga <br />{" "}
            yaqin ohanglardan bahramand bo‘ling! Bizda qoling!
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6 mb-10 lg:mb-16 w-full sm:w-auto">
            <button
              onClick={togglePlay}
              className="w-full sm:w-auto flex items-center justify-center gap-4 bg-white text-black px-8 lg:px-10 py-3 lg:py-4 rounded-full font-bold hover:bg-[#FF3D00] hover:text-white transition-all active:scale-95 shadow-xl"
            >
              {isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" />
              )}
              <span className="text-lg lg:text-xl uppercase">Tinglash</span>
            </button>

            <div className="w-full sm:w-auto flex items-center justify-center gap-3 bg-black/40 border border-white/10 px-6 lg:px-8 py-3 lg:py-4 rounded-full backdrop-blur-md">
              <span
                className={`w-2 h-2 bg-[#FF3D00] rounded-full ${isPlaying ? "animate-pulse" : ""}`}
              />
              <span className="font-bold text-sm lg:text-lg uppercase tracking-tight">
                <span className="text-[#ED143B]">Hozirda tinglayotganlar</span>
                <span className="text-white ml-2 lg:ml-3 font-medium">
                  {Number(listeners).toLocaleString("fr-FR").replace(",", " ")}
                </span>
              </span>
            </div>
          </div>

          {/* <div className="grid grid-cols-3 w-full lg:max-w-[500px] pt-8 ">
            <div className=" flex flex-col items-center">
              <div className="text-xl lg:text-4xl font-black">24/7</div>
              <div className="text-gray-500 text-[9px] lg:text-[14px] font-bold uppercase mt-1">
                Efir
              </div>
            </div>
            <div className=" flex flex-col items-center">
              <div className="text-xl lg:text-4xl font-black">+ 500K</div>
              <div className="text-gray-500 text-[9px] lg:text-[14px] font-bold uppercase mt-1">
                Musiqa
              </div>
            </div>
            <div className=" flex flex-col items-center">
              <div className="text-xl lg:text-4xl font-black">+ 500K</div>
              <div className="text-gray-500 text-[9px] lg:text-[14px] font-bold uppercase mt-1">
                Muxlis
              </div>
            </div>
          </div> */}
        </div>

        <div className="lg:col-span-5 flex flex-col items-center justify-center w-full relative">
          <img
            src="/phones.png"
            alt="App"
            className="w-full max-w-[320px] hidden lg:block md:max-w-[400px] lg:max-w-[480px] h-auto drop-shadow-[0_0_50px_rgba(255,61,0,0.2)]"
          />
          <div className="absolute -bottom-6 lg:-bottom-10 text-center w-full">
            <span className="text-[#FF3D00] font-bold tracking-[0.2em] uppercase text-[10px] lg:text-xs animate-pulse bg-[#0A0A0D]/80 py-2 px-4 rounded-full border border-white/5 backdrop-blur-sm">
              Ilova tez orada chiqadi
            </span>
          </div>
        </div>
      </main>

      <footer className="relative z-20 px-6 lg:px-20 py-8 flex flex-col lg:flex-row justify-between items-center  gap-6 mt-auto">
        <div className="text-white/20 text-[10px] lg:text-xs order-3 lg:order-1">
          © Fonoteka 2026
        </div>
        <div className="flex gap-4 order-1 lg:order-2">
          {["instagram", "google", "telegram"].map((type) => (
            <div
              key={type}
              className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 hover:bg-[#FF3D00] transition-all cursor-pointer group shadow-lg"
            >
              <SocialIcon type={type} />
            </div>
          ))}
        </div>
        <div className="text-white/20 text-[10px] lg:text-xs   order-2 lg:order-3">
          Milliy musiqa platformasi
        </div>
      </footer>
    </div>
  );
};

export default App;
