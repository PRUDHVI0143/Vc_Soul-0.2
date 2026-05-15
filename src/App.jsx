import React, { useState, useEffect } from 'react';

export default function SoulDashboard() {
  const [isListening, setIsListening] = useState(false);
  const [uiState, setUiState] = useState('idle'); // idle, listening, thinking, wake
  const [statusText, setStatusText] = useState('Waiting for you to say "Hello Bro"...');
  const [mainText, setMainText] = useState('How can I help you today?');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  const [weatherData, setWeatherData] = useState({ location: 'Detecting...', temp: '--°C', desc: 'Loading...', emoji: '🌤️' });

  const updateState = (state, status, color, main) => {
    if (state) setUiState(state);
    if (status) setStatusText(status);
    if (main) setMainText(main);
    
    if (state === 'listening' || state === 'wake') {
      setIsListening(true);
    } else {
      setIsListening(false);
    }
  };

  useEffect(() => {
    // Bind to the global function exposed in expose.js
    window.reactUpdateState = updateState;

    // Dynamically inject eel.js to avoid Vite build errors
    if (!document.querySelector('script[src="/eel.js"]')) {
      const script = document.createElement('script');
      script.src = '/eel.js';
      document.head.appendChild(script);
    }
    
    return () => {
      window.reactUpdateState = null;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setCurrentDate(now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      if (window.eel && window.eel.get_live_weather) {
        try {
          const res = await window.eel.get_live_weather()();
          if (res) setWeatherData(res);
        } catch (e) { console.error("Eel weather failed", e); }
      } else {
        try {
          const res = await fetch('https://wttr.in/?format=j1').then(r => r.json());
          const cur = res.current_condition[0];
          const loc = res.nearest_area[0];
          const desc = cur.weatherDesc[0].value;
          let emoji = "☀️";
          if (desc.toLowerCase().includes("cloud")) emoji = "☁️";
          else if (desc.toLowerCase().includes("rain")) emoji = "🌧️";
          setWeatherData({
            location: `${loc.areaName[0].value}, ${loc.region[0].value}`,
            temp: `${cur.temp_C}°C`,
            desc: desc,
            emoji: emoji
          });
        } catch (e) {
          setWeatherData({ location: 'Punjab, IN', temp: '28°C', desc: 'Cloudy', emoji: '☁️' });
        }
      }
    };
    fetchWeather();
    const wTimer = setInterval(fetchWeather, 600000);
    return () => clearInterval(wTimer);
  }, []);

  const handleMicClick = () => {
    if (window.eel && window.eel.manual_activate) {
      window.eel.manual_activate();
    }
  };

  const handleQuickAction = (cmd) => {
    if (window.eel && window.eel.quick_action) {
      window.eel.quick_action(cmd);
    }
  };

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    const cmd = e.target.elements.command.value;
    if (cmd && window.eel && window.eel.manual_command) {
      window.eel.manual_command(cmd);
      e.target.reset();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative font-sans">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.12),transparent_40%),radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_45%)]" />

      {/* Layout */}
      <div className="relative z-10 flex h-screen">

        {/* Sidebar */}
        <aside className="w-72 border-r border-cyan-500/20 bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-2xl p-6 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div>
            <div className="flex items-center gap-3 mb-10 group cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 blur-[2px] group-hover:blur-md transition-all animate-pulse shadow-[0_0_20px_rgba(0,255,255,0.6)]" />
              <div>
                <h1 className="text-3xl font-black tracking-widest bg-gradient-to-r from-cyan-300 via-purple-300 to-white bg-clip-text text-transparent">S.O.U.L</h1>
                <p className="text-cyan-400 font-medium text-xs tracking-wider uppercase">AI Assistant</p>
              </div>
            </div>

            <nav className="space-y-3">
              {[
                'Home',
                'Commands',
                'AI Tools',
                'Plugins',
                'Memory',
                'Logs',
                'Settings'
              ].map((item) => (
                <button
                  key={item}
                  className="w-full text-left px-5 py-3.5 rounded-2xl bg-white/[0.03] hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/20 transition-all duration-300 border border-white/5 hover:border-cyan-400/40 hover:scale-[1.02] active:scale-[0.98] font-semibold tracking-wide flex items-center justify-between group"
                >
                  <span>{item}</span>
                  <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-transparent rounded-3xl p-5 border border-cyan-500/20 backdrop-blur-xl shadow-[0_0_25px_rgba(138,43,226,0.15)] hover:border-purple-500/40 transition-all">
            <p className="text-xs text-cyan-300 font-bold mb-2 tracking-widest uppercase">AI MODE</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-extrabold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Vc Soul</span>
              <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
            </div>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col">

          {/* Top Bar */}
          <header className="flex justify-between items-center px-10 py-6 border-b border-cyan-500/10 bg-white/5 backdrop-blur-md">
            <div>
              <h2 className="text-5xl font-black tracking-[0.4em] text-cyan-200">S.O.U.L</h2>
              <p className="text-cyan-400 mt-2">System Of Universal Listening</p>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-purple-400 font-mono text-xl font-bold drop-shadow-[0_0_12px_rgba(138,43,226,0.5)]">{currentTime}</p>
                <p className="text-sm text-gray-400">{currentDate}</p>
              </div>

              <div className="px-5 py-2 rounded-full bg-green-500/20 border border-green-400/30 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                ONLINE
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 grid grid-cols-12 gap-6 p-8 overflow-hidden">

            {/* Left Widgets */}
            <div className="col-span-3 space-y-6">
              <Widget title="STATUS">
                <div className="space-y-4">
                  <p className="text-3xl text-cyan-300 font-semibold">{statusText}</p>
                  {isListening && <Wave />}
                </div>
              </Widget>

              <Widget title="THINKING">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300">Processing...</p>
                    <div className="mt-4 flex gap-2">
                      <div className="w-10 h-1 bg-cyan-400 rounded-full animate-pulse" />
                      <div className="w-6 h-1 bg-purple-400 rounded-full animate-pulse" />
                    </div>
                  </div>

                  <div className="w-16 h-16 rounded-full border-2 border-cyan-400 animate-spin" />
                </div>
              </Widget>

              <Widget title="LIVE WEATHER">
                <div>
                  <p className="text-purple-300 font-bold tracking-wider uppercase text-sm">{weatherData.location}</p>
                  <div className="flex items-center gap-6 mt-4 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-transparent p-5 rounded-3xl border border-purple-500/20 shadow-[0_0_30px_rgba(138,43,226,0.15)] group hover:border-purple-500/40 transition-all">
                    <div className="text-6xl group-hover:scale-110 transition-transform duration-300 animate-pulse">{weatherData.emoji}</div>
                    <div>
                      <h2 className="text-5xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{weatherData.temp}</h2>
                      <p className="text-cyan-300 font-semibold text-lg mt-1 tracking-wide">{weatherData.desc}</p>
                    </div>
                  </div>
                </div>
              </Widget>
            </div>

            {/* Center */}
            <div className="col-span-6 flex flex-col items-center justify-center">

              {/* Orb */}
              <div className="relative flex items-center justify-center mb-10 cursor-pointer hover:scale-105 transition-transform" onClick={handleMicClick}>
                <div className={`absolute w-[420px] h-[420px] rounded-full bg-cyan-400/20 blur-3xl ${isListening ? 'animate-pulse' : 'opacity-50'}`} />
                <div className={`absolute w-[360px] h-[360px] rounded-full border border-cyan-400/30 ${isListening ? 'animate-spin' : ''}`} />
                <div className={`absolute w-[300px] h-[300px] rounded-full border border-purple-400/40 ${isListening ? 'animate-[spin_12s_linear_infinite]' : ''}`} />

                <div className="relative w-72 h-72 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_100px_rgba(0,255,255,0.4)] flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full bg-black/30 backdrop-blur-2xl" />
                </div>
              </div>

              <div className="text-center mb-10">
                <h1 className="text-5xl font-bold mb-4">{uiState === 'idle' ? "I'm Resting..." : "I'm Listening..."}</h1>
                <p className="text-2xl text-gray-300">{mainText}</p>
              </div>

              {/* Input */}
              <div className="w-full max-w-5xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-cyan-500/30 rounded-[2.5rem] p-8 backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(138,43,226,0.15)] hover:border-purple-500/40 transition-all duration-500">
                <form onSubmit={handleCommandSubmit} className="flex items-center gap-6">
                  <button type="button" onClick={handleMicClick} className={`w-20 h-20 rounded-full border flex items-center justify-center text-3xl transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.2)] ${isListening ? 'bg-red-500/20 border-red-400/60 text-red-400 hover:scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border-cyan-400/40 hover:scale-110 hover:border-purple-400/60'}`}>
                    🎤
                  </button>

                  <div className="flex-1 bg-black/40 border border-white/10 rounded-3xl px-8 py-4 focus-within:border-cyan-400/50 focus-within:shadow-[0_0_25px_rgba(0,255,255,0.15)] transition-all">
                    <input
                      name="command"
                      placeholder="Type a command or ask anything..."
                      className="w-full bg-transparent outline-none text-2xl font-medium placeholder:text-gray-500 text-white"
                      autoComplete="off"
                    />
                    <div className="mt-2">
                      {isListening && <Wave />}
                    </div>
                  </div>

                  <button type="submit" className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600/30 to-purple-600/30 border border-blue-400/50 flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all duration-300 shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:border-purple-400/70">
                    ➤
                  </button>
                </form>

                <div className="grid grid-cols-4 gap-5 mt-8">
                  {[
                    'Build Box',
                    'Suggestion of plan',
                    'Help me code',
                    'Open ChatGPT'
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => handleQuickAction(item)}
                      className="py-4 px-6 rounded-2xl bg-white/[0.03] border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-purple-500/15 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] font-semibold tracking-wide text-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Widgets */}
            <div className="col-span-3 space-y-6">
              <Widget title="RECENT ACTIVITY">
                <div className="space-y-4">
                  {[
                    'Open YouTube',
                    'Search python tutorials',
                    'Open VS Code',
                    'Tell me a joke'
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-black/30 rounded-2xl p-4 border border-cyan-500/10"
                    >
                      <p className="text-sm text-gray-500">10:4{i} PM</p>
                      <p className="text-lg">{item}</p>
                    </div>
                  ))}
                </div>
              </Widget>

              <Widget title="SYSTEM OVERVIEW">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <StatCircle label="CPU" value="23%" />
                  <StatCircle label="RAM" value="45%" />
                  <StatCircle label="BAT" value="72%" />
                </div>
              </Widget>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Widget({ title, children }) {
  return (
    <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-cyan-500/20 hover:border-purple-500/40 rounded-3xl p-7 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(0,255,255,0.05)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(138,43,226,0.15)] transition-all duration-500 group">
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <h3 className="text-cyan-300 font-extrabold tracking-[0.2em] text-xs uppercase bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">{title}</h3>
        <div className="w-3 h-3 rounded-full bg-cyan-400 group-hover:bg-purple-400 transition-colors animate-pulse shadow-[0_0_12px_rgba(0,255,255,0.8)]" />
      </div>
      {children}
    </div>
  )
}

function Wave() {
  return (
    <div className="flex items-end gap-1 h-12">
      {[12, 28, 18, 36, 22, 40, 16, 30, 12, 24].map((h, i) => (
        <div
          key={i}
          className="w-2 rounded-full bg-cyan-400 animate-pulse"
          style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

function StatCircle({ label, value }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 rounded-full border-4 border-cyan-400/50 flex items-center justify-center text-xl font-bold shadow-[0_0_20px_rgba(0,255,255,0.2)]">
        {value}
      </div>
      <p className="mt-3 text-sm text-gray-400">{label}</p>
    </div>
  )
}
