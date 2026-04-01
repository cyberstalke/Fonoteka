import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Play, Pause, Apple, ChevronDown } from "lucide-react";
import Hls from "hls.js";

/**
 * Иконки соцсетей
 */
const SocialIcon = ({ type }) => {
  const paths = {
    instagram:
      "M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5a4.25 4.25 0 0 0-4.25 4.25v8.5a4.25 4.25 0 0 0 4.25 4.25h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.25-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2z",
    google:
      "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
    telegram:
      "M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.703-.332 4.96c.483 0 .698-.221.969-.481l2.33-2.264 4.846 3.58c.894.493 1.538.24 1.76-.826l3.177-14.97c.325-1.305-.5-1.902-1.353-1.518z",
  };
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
  const rootRef = useRef(null);
  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const downloadSectionRef = useRef(null);
  const barsCount = 60;

  const [isPlaying, setIsPlaying] = useState(false);
  const [listeners, setListeners] = useState(0);

  // Инициализация аудио и статистики (как в твоем коде)
  useEffect(() => {
    const streamUrl = "https://stream.fonoteka.fm:1030/hls/stream_1_mp3.m3u8";
    const audio = audioRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(audio);
      hlsRef.current = hls;

      // Попытка запуска после загрузки манифеста
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => console.log("Autoplay waiting for click"));
      });
    } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
      audio.src = streamUrl;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => console.log("Autoplay waiting for click"));
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    const attemptAutoplay = () => {
      if (audioRef.current) {
        // Пытаемся запустить
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            console.log("Autoplay started");
          })
          .catch((error) => {
            // Браузер заблокировал автоплей (это нормально)
            console.log(
              "Autoplay blocked by browser. Waiting for user interaction.",
            );

            // Резервный вариант: запустить музыку при первом клике в любом месте страницы
            const startOnInteraction = () => {
              audioRef.current.play().then(() => {
                setIsPlaying(true);
                window.removeEventListener("click", startOnInteraction);
              });
            };
            window.addEventListener("click", startOnInteraction);
          });
      }
    };

    // Небольшая задержка, чтобы HLS успел подгрузить манифест
    const timer = setTimeout(attemptAutoplay, 1000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", attemptAutoplay);
    };
  }, []);

  // GSAP Анимации
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".animate-in", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
      });
      gsap.to(".wave-bar", {
        scaleY: isPlaying ? "random(0.8, 2.2)" : 1,
        duration: "random(0.4, 0.8)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { each: 0.02, from: "center" },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [isPlaying]);

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
    setIsPlaying(!isPlaying);
  };

  const scrollToDownload = () => {
    downloadSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={rootRef}
      className="bg-[#0A0A0D] text-white selection:bg-[#FF3D00]"
    >
      <audio ref={audioRef} playsInline />

      <section className="relative min-h-[91svh] flex flex-col overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-between w-full h-full pointer-events-none px-4">
          {[...Array(barsCount)].map((_, i) => (
            <div
              key={i}
              className="wave-bar flex-1 bg-gradient-to-b from-transparent via-[#FF430F] to-transparent"
              style={{
                height: `${25 + (Math.abs(i - barsCount / 2) / (barsCount / 2)) * 65}%`,
                opacity: isPlaying ? 0.4 : 0.1,
                margin: "0 1px",
              }}
            />
          ))}
        </div>

        <nav className="relative z-20 flex justify-between items-center px-6 lg:px-16 py-8">
          <img src="/logo.png" width={182} alt="" />
          <button className="bg-[#FF3D00] hidden px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest">
            Donat qilish
          </button>
        </nav>

        <main className="relative z-10 flex-1 flex flex-col lg:grid lg:grid-cols-2 items-center px-6 lg:px-16 gap-12">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <h1 className="animate-in text-5xl lg:text-[80px] font-black leading-[0.9] uppercase tracking-tighter mb-6">
              Fonoteka Radio
            </h1>
            <p className="animate-in text-[#F5F5F5] text-base font-normal  leading-10 lg:text-[32px] max-w-5xl mb-12 font-light ">
              O‘zbek musiqa merosi va zamonaviy taronalarni birlashtirgan ilk
              milliy radio-strimming platformasi. Milliy san’atimiz xazinasi har
              doim yoningizda – qayerda bo‘lmang, qalbingizga yaqin ohanglardan
              bahramand bo‘ling!
            </p>

            <div className="animate-in flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto">
              <button
                onClick={togglePlay}
                className="flex items-center justify-center gap-3 bg-white text-[#141419] px-5 py-2 leading-8 rounded-full font-bold active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <Pause size={20} fill="black" />
                ) : (
                  <Play size={20} fill="black" />
                )}
                <span className="uppercase tracking-widest text-[24px] ">
                  Tinglash
                </span>
              </button>
              <div className="flex items-center justify-center gap-3 bg-[#0A0A0D] border border-white/10 px-8 py-5 leading-8 rounded-full backdrop-blur-xl">
                <span
                  className={`w-5 h-5 bg-[#FF3D00] rounded-full ${isPlaying ? "animate-pulse" : ""}`}
                ></span>
                <span className="font-bold uppercase tracking-widest text-[#ED143B] text-[24px]">
                  Jonli efir{" "}
                  <span className="text-white ml-2">
                    {listeners.toLocaleString()} tinglamoqda
                  </span>
                </span>
              </div>
            </div>

            {/* Статистика */}
            <div className="animate-in flex justify-between w-full max-w-sm border-t border-white/5 pt-10">
              <div className="text-left">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-[9px] uppercase text-white/30 tracking-widest font-bold">
                  Jonli efir
                </div>
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold italic">+ 500K</div>
                <div className="text-[9px] uppercase text-white/30 tracking-widest font-bold">
                  Taronalar
                </div>
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold italic">+ 500K</div>
                <div className="text-[9px] uppercase text-white/30 tracking-widest font-bold">
                  Tinglovchilar
                </div>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-center animate-in">
            <img
              src="/phones.png"
              alt="App Preview"
              className="w-full max-w-[554px] h-auto drop-shadow-[0_20px_60px_rgba(255,61,0,0.2)]"
            />
            <div className="mt-10 flex flex-col items-center">
              <p className="text-[#F5F5F5] text-[24px]  font-bold">
                Ilovani yuklab oling
              </p>
              <p className=" text-[#F5F5F5] text-[20px] items-center text-center">
                Radio, musiqa, karaoke — hammasi bir joyda <br /> Tez orada ..
              </p>
              <div className="flex gap-4">
                {/* <button className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 px-8 py-3 rounded-2xl hover:bg-[#FF3D00] transition-all">
                  <Play size={16} fill="white" />
                  <div className="text-left leading-tight">
                    <div className="text-[9px] uppercase opacity-40">
                      Google Play
                    </div>
                    <div className="text-sm font-bold tracking-tight">
                      Yuklab olish
                    </div>
                  </div>
                </button>
                <button className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 px-8 py-3 rounded-2xl hover:bg-[#FF3D00] transition-all">
                  <Apple size={20} />
                  <div className="text-left leading-tight">
                    <div className="text-[9px] uppercase opacity-40">
                      App Store
                    </div>
                    <div className="text-sm font-bold tracking-tight">
                      Yuklab olish
                    </div>
                  </div>
                </button> */}
              </div>
            </div>
          </div>
        </main>

        {/* <div
          onClick={scrollToDownload}
          className="lg:hidden relative z-20 flex flex-col items-center pb-12 cursor-pointer animate-bounce"
        >
          <p className="text-[9px] uppercase tracking-[0.2em] mb-3 font-bold text-white/40 italic">
            Mobil ilovani yuklash
          </p>
          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10 shadow-lg">
            <ChevronDown size={20} className="text-[#FF3D00]" />
          </div>
        </div> */}
      </section>

      {/* <section
        ref={downloadSectionRef}
        className="lg:hidden min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-t from-[#FF3D00]/10 to-transparent"
      >
        <img
          src="/phones.png"
          alt="Mobile App"
          className="w-full max-w-[400px] mb-12 drop-shadow-[0_20px_60px_rgba(255,61,0,0.3)]"
        />
        <h2 className="text-4xl font-black uppercase tracking-tighter text-center mb-4 leading-none">
          Ilovani yuklab oling
        </h2>
        <p className="text-white/40 text-center mb-10 max-w-xs text-sm">
          Radio, musiqa, karaoke — barchasi bitta ilovada. Milliy musiqa
          xazinasi har doim yoningizda.
        </p>
        <div className="flex flex-col gap-4 w-full">
          <button className="flex items-center justify-center gap-4 bg-zinc-900 border border-white/5 py-5 rounded-2xl active:bg-zinc-800 transition">
            <Play size={20} fill="white" />
            <span className="font-bold tracking-widest uppercase">
              Google Play
            </span>
          </button>
          <button className="flex items-center justify-center gap-4 bg-zinc-900 border border-white/5 py-5 rounded-2xl active:bg-zinc-800 transition">
            <Apple size={24} />
            <span className="font-bold tracking-widest uppercase">
              App Store
            </span>
          </button>
        </div>
      </section> */}

      {/* FOOTER */}
      <footer className="relative z-20 px-6 lg:px-16 pt-0 py-10 flex flex-col lg:flex-row justify-between items-center border-t border-white/5 gap-8">
        <div className="text-white/20 text-[10px] font-bold tracking-[0.2em] order-3 lg:order-1 uppercase">
          © Fonoteka 2026
        </div>
        <div className="flex gap-4 order-1 lg:order-2">
          {["instagram", "google", "telegram"].map((type) => (
            <div
              key={type}
              className="w-12 h-12 rounded-full bg-zinc-900/80 flex items-center justify-center border border-white/5 hover:bg-[#FF3D00] transition-colors cursor-pointer group shadow-xl"
            >
              <SocialIcon type={type} />
            </div>
          ))}
        </div>
        <div className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold order-2 lg:order-3">
          Milliy musiqa platformasi
        </div>
      </footer>
    </div>
  );
};

export default App;
