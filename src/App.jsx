import React, { useState, useEffect } from 'react';

export default function SoulDashboard() {
  const [isListening, setIsListening] = useState(false);
  const [uiState, setUiState] = useState('idle'); // idle, listening, thinking, wake
  const [statusText, setStatusText] = useState('Waiting for you to say "Hello Bro"...');
  const [mainText, setMainText] = useState('How can I help you today?');
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
        <aside className="w-72 border-r border-cyan-500/20 bg-white/5 backdrop-blur-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-full bg-cyan-400 blur-sm animate-pulse" />
              <div>
                <h1 className="text-3xl font-bold tracking-widest">S.O.U.L</h1>
                <p className="text-cyan-300 text-sm">AI Assistant</p>
              </div>
            </div>

            <nav className="space-y-4">
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
                  className="w-full text-left px-4 py-3 rounded-2xl bg-white/5 hover:bg-cyan-500/20 transition-all border border-transparent hover:border-cyan-400/40"
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white/5 rounded-3xl p-5 border border-cyan-500/20">
            <p className="text-sm text-cyan-300 mb-2">AI MODE</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">Vc Soul</span>
              <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse" />
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
                <p className="text-cyan-300">10:42 PM</p>
                <p className="text-sm text-gray-400">May 14, 2026</p>
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
              <div className="w-full max-w-5xl bg-white/5 border border-cyan-500/20 rounded-[2rem] p-6 backdrop-blur-xl">
                <form onSubmit={handleCommandSubmit} className="flex items-center gap-5">
                  <button type="button" onClick={handleMicClick} className={`w-20 h-20 rounded-full border flex items-center justify-center text-3xl transition-all ${isListening ? 'bg-red-500/20 border-red-400/40 text-red-400 hover:scale-105' : 'bg-cyan-500/20 border-cyan-400/40 hover:scale-105'}`}>
                    🎤
                  </button>

                  <div className="flex-1">
                    <input
                      name="command"
                      placeholder="Type a command or ask anything..."
                      className="w-full bg-transparent outline-none text-2xl placeholder:text-gray-500"
                      autoComplete="off"
                    />
                    <div className="mt-4">
                      {isListening && <Wave />}
                    </div>
                  </div>

                  <button type="submit" className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-3xl hover:scale-105 transition-all">
                    ➤
                  </button>
                </form>

                <div className="grid grid-cols-4 gap-4 mt-8">
                  {[
                    'Build Box',
                    'Suggestion of plan',
                    'Help me code',
                    'Open ChatGPT'
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => handleQuickAction(item)}
                      className="py-4 rounded-2xl bg-black/30 border border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition-all"
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

              <Widget title="WEATHER">
                <div>
                  <p className="text-gray-400">Punjab, IN</p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="text-6xl">☁️</div>
                    <div>
                      <h2 className="text-5xl font-bold">28°C</h2>
                      <p className="text-gray-300">Cloudy</p>
                    </div>
                  </div>
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
    <div className="bg-white/5 border border-cyan-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,255,0.05)]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-cyan-300 tracking-widest text-sm">{title}</h3>
        <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
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
