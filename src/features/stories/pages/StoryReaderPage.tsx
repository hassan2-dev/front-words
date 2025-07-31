import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  BookOpen,
  GraduationCap,
  Check,
  X,
  HelpCircle,
  Mic,
  MicOff,
  ArrowLeft,
  Home,
  Sparkles,
  Settings,
  Repeat,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Award,
  Brain,
  Target,
  Clock,
  BookMarkedIcon,
  Star,
} from "lucide-react";
import type { DailyStory, DailyStoryWord } from "@/core/types";
import { enhanceStory, enhanceWords } from "@/core/utils/storyEnhancer";

interface StoryReaderProps {
  story?: DailyStory;
  onComplete?: () => void;
  onClose?: () => void;
}

export const StoryReaderPage: React.FC<StoryReaderProps> = ({
  story: propStory,
  onComplete,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [currentStory, setCurrentStory] = useState<DailyStory | null>(
    propStory || null
  );
  const [fromDashboard, setFromDashboard] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedWord, setSelectedWord] = useState<DailyStoryWord | null>(null);
  const [showWordModal, setShowWordModal] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [autoPlay, setAutoPlay] = useState(false);
  const [wordStatus, setWordStatus] = useState<
    Record<string, "KNOWN" | "PARTIALLY_KNOWN" | "NOT_LEARNED">
  >({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSettings, setSpeechSettings] = useState({
    rate: 1,
    pitch: 1,
    volume: 1,
  });
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [wordsLearned, setWordsLearned] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showStats, setShowStats] = useState(false);

  // Get story from location state if not provided as prop
  useEffect(() => {
    if (!currentStory && location.state?.story) {
      const enhancedStory = {
        ...location.state.story,
        ...enhanceStory(location.state.story),
        words: enhanceWords(location.state.story.words),
      };
      setCurrentStory(enhancedStory as DailyStory);
    }
    if (location.state?.fromDashboard) {
      setFromDashboard(true);
    }
  }, [location.state, currentStory]);

  // Initialize word statuses and calculate stats
  useEffect(() => {
    if (currentStory?.words) {
      const initialStatus: Record<
        string,
        "KNOWN" | "PARTIALLY_KNOWN" | "NOT_LEARNED"
      > = {};
      let knownCount = 0;

      currentStory.words.forEach((word) => {
        const status =
          (word.status as "KNOWN" | "PARTIALLY_KNOWN" | "NOT_LEARNED") ||
          "NOT_LEARNED";
        initialStatus[word.word] = status;
        if (status === "KNOWN") knownCount++;
      });

      setWordStatus(initialStatus);
      setWordsLearned(knownCount);
      setReadingProgress((knownCount / currentStory.words.length) * 100);
    }
  }, [currentStory]);

  // Reading time tracker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStory) {
      interval = setInterval(() => {
        setReadingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStory]);

  // Enhanced speech synthesis
  const speakText = (text: string, lang: string = "en-US") => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = speechSettings.rate;
      utterance.pitch = speechSettings.pitch;
      utterance.volume = speechSettings.volume;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleSpeaking = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(text);
    }
  };

  // Enhanced audio controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      // Simulate audio playback
      setIsPlaying(!isPlaying);
      if (!isPlaying && duration === 0) {
        setDuration(
          Math.floor((currentStory?.content?.split(" ").length || 0) * 0.5) ||
            60
        );
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setPlaybackRate(rate);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  // Enhanced word interaction
  const handleWordClick = (word: DailyStoryWord, index: number) => {
    setSelectedWord(word);
    setHighlightedWordIndex(index);
    setShowWordModal(true);
    speakText(word.word, "en-US");
  };

  const handleWordStatusChange = (
    word: string,
    status: "KNOWN" | "PARTIALLY_KNOWN" | "NOT_LEARNED"
  ) => {
    setWordStatus((prev) => {
      const newStatus = { ...prev, [word]: status };

      // Update statistics
      const knownCount = Object.values(newStatus).filter(
        (s) => s === "KNOWN"
      ).length;
      setWordsLearned(knownCount);
      setReadingProgress(
        (knownCount / (currentStory?.words.length || 1)) * 100
      );

      return newStatus;
    });
    setShowWordModal(false);
  };

  // Auto-highlight words during playback
  useEffect(() => {
    if (autoPlay && currentStory?.words && isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);

      const currentWordIndex = Math.floor(
        (currentTime / duration) * currentStory.words.length
      );
      if (currentWordIndex < currentStory.words.length) {
        setHighlightedWordIndex(currentWordIndex);
      }

      return () => clearInterval(interval);
    }
  }, [currentTime, isPlaying, autoPlay, currentStory, duration]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Enhanced word coloring based on real data
  const getWordColor = (word: DailyStoryWord) => {
    const status = wordStatus[word.word] || word.status;
    const isDailyWord = word.isDailyWord;

    let baseClasses =
      "inline-block px-3 py-1.5 mx-1 my-0.5 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg font-medium text-sm ";

    if (isDailyWord) {
      baseClasses +=
        "ring-2 ring-blue-400 ring-opacity-50 shadow-blue-200 dark:shadow-blue-900/30 ";
    }

    switch (status) {
      case "KNOWN":
        return (
          baseClasses +
          "text-emerald-800 bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/30 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-600 hover:from-emerald-200 hover:to-emerald-100"
        );
      case "PARTIALLY_KNOWN":
        return (
          baseClasses +
          "text-amber-800 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 dark:text-amber-200 border border-amber-300 dark:border-amber-600 hover:from-amber-200 hover:to-amber-100"
        );
      case "NOT_LEARNED":
        return (
          baseClasses +
          "text-rose-800 bg-gradient-to-r from-rose-100 to-rose-50 dark:from-rose-900/50 dark:to-rose-800/30 dark:text-rose-200 border border-rose-300 dark:border-rose-600 hover:from-rose-200 hover:to-rose-100"
        );
      default:
        return (
          baseClasses +
          "text-blue-800 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 dark:text-blue-200 border border-blue-300 dark:border-blue-600 hover:from-blue-200 hover:to-blue-100"
        );
    }
  };

  // Calculate reading statistics
  const getWordTypeCount = (type: string) => {
    return currentStory?.words.filter((word) => word.type === type).length || 0;
  };

  const getDailyWordsCount = () => {
    return currentStory?.words.filter((word) => word.isDailyWord).length || 0;
  };

  if (!currentStory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-slate-800 dark:to-indigo-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
            <BookMarkedIcon className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            لا توجد قصة متاحة
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">
            يرجى العودة إلى الداشبورد لاختيار قصة جديدة للقراءة والتعلم
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg"
          >
            العودة للداشبورد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-slate-800 dark:to-indigo-950 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-pink-400/10 to-violet-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Enhanced Header with Progress */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-b border-gray-200/50 dark:border-gray-700/50 shadow-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {currentStory.title.split(" - ")[0]}
                </h1>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    قصة تفاعلية • {currentStory.words.length} كلمة
                  </p>
                  {getDailyWordsCount() > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Star className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {getDailyWordsCount()} كلمة يومية
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
              >
                <Brain className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 font-medium text-sm ${
                  autoPlay
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden md:inline">
                  {autoPlay ? "إيقاف التلقائي" : "تشغيل تلقائي"}
                </span>
              </button>

              <button
                onClick={() =>
                  navigate("/story-exam", { state: { story: currentStory } })
                }
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 font-medium text-sm"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">امتحان</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                التقدم في التعلم
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(readingProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${readingProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Statistics Panel */}
      {showStats && (
        <div className="sticky top-[140px] z-40 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {wordsLearned}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">
                  كلمات معروفة
                </div>
              </div>

              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <Award className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                  {getWordTypeCount("partially_known")}
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  جزئية
                </div>
              </div>

              <div className="text-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                <BookMarkedIcon className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-rose-700 dark:text-rose-300">
                  {getWordTypeCount("unknown")}
                </div>
                <div className="text-xs text-rose-600 dark:text-rose-400">
                  غير معروفة
                </div>
              </div>

              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {formatTime(readingTime)}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  وقت القراءة
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Audio Controls */}
      <div
        className={`sticky ${
          showStats ? "top-[280px]" : "top-[140px]"
        } z-40 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-300`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Main Controls */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-2xl"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
                  ) : (
                    <Play className="w-6 h-6 sm:w-7 sm:h-7" />
                  )}
                </button>

                <button
                  onClick={toggleMute}
                  className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-lg"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => toggleSpeaking(currentStory.content)}
                  className={`w-12 h-12 rounded-full hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-lg ${
                    isSpeaking
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-500/25"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25"
                  }`}
                >
                  {isSpeaking ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    السرعة:
                  </span>
                  <select
                    value={speechSettings.rate}
                    onChange={(e) =>
                      setSpeechSettings((prev) => ({
                        ...prev,
                        rate: parseFloat(e.target.value),
                      }))
                    }
                    className="text-xs bg-transparent text-gray-700 dark:text-gray-300 outline-none"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center ${
                  showSettings
                    ? "bg-blue-500 text-white shadow-blue-500/25"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-center">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative group">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer slider"
                />
                <div
                  className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full pointer-events-none transition-all duration-300"
                  style={{
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-center">
                {formatTime(duration)}
              </span>
            </div>

            {/* Speed Controls - Mobile */}
            {showSettings && (
              <div className="sm:hidden flex items-center justify-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  السرعة:
                </span>
                {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handlePlaybackRateChange(rate)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                      playbackRate === rate
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Story Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Story Text with Enhanced Styling */}
          <article className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-900/10 dark:shadow-gray-900/20 p-6 sm:p-8 lg:p-10 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {currentStory.title.split(" - ")[0]}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{currentStory.words.length} كلمة</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    ~{Math.ceil(currentStory.content.split(" ").length / 200)}{" "}
                    دقيقة
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>{wordsLearned} كلمة معروفة</span>
                </div>
              </div>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="leading-relaxed text-gray-800 dark:text-gray-200 text-base sm:text-lg text-justify space-y-4">
                {currentStory.content
                  .split("\n\n")
                  .map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className="mb-4">
                      {paragraph.split(" ").map((word, wordIndex) => {
                        const globalWordIndex =
                          paragraphIndex * 100 + wordIndex; // Simple indexing
                        const cleanWord = word
                          .toLowerCase()
                          .replace(/[.,!?;:"*]/g, "");
                        const highlightedWord = currentStory.words.find(
                          (w) => cleanWord === w.word.toLowerCase()
                        );

                        if (highlightedWord) {
                          return (
                            <span
                              key={`${paragraphIndex}-${wordIndex}`}
                              onClick={() =>
                                handleWordClick(
                                  highlightedWord,
                                  globalWordIndex
                                )
                              }
                              className={`${getWordColor(highlightedWord)} ${
                                highlightedWordIndex === globalWordIndex
                                  ? "ring-2 ring-blue-400 ring-offset-2 scale-110 shadow-xl z-10 relative"
                                  : ""
                              }`}
                              title={`${highlightedWord.meaning} • انقر لسماع النطق`}
                            >
                              {word}
                            </span>
                          );
                        } else {
                          return (
                            <span
                              key={`${paragraphIndex}-${wordIndex}`}
                              className="inline-block px-0.5"
                            >
                              {word}
                            </span>
                          );
                        }
                      })}
                    </p>
                  ))}
              </div>
            </div>
          </article>

          {/* Enhanced Translation Section */}
          <section className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-900/10 dark:shadow-gray-900/20 p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">ع</span>
                </div>
                الترجمة العربية
              </h3>
              <button
                onClick={() => speakText(currentStory.translation, "ar-SA")}
                className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all duration-200"
                title="استمع للترجمة"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-base sm:text-lg text-right space-y-4">
                {currentStory.translation
                  .split("\n\n")
                  .map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>
          </section>

          {/* Word Learning Progress */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-blue-200/50 dark:border-blue-700/50">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              إحصائيات التعلم
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  {
                    Object.values(wordStatus).filter((s) => s === "KNOWN")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  كلمات معروفة
                </div>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                  {
                    Object.values(wordStatus).filter(
                      (s) => s === "PARTIALLY_KNOWN"
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  كلمات جزئية
                </div>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-1">
                  {
                    Object.values(wordStatus).filter((s) => s === "NOT_LEARNED")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  كلمات جديدة
                </div>
              </div>
            </div>

            {/* Word Categories */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                الكلمات المميزة:
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentStory.words
                  .filter((word) => word.isDailyWord)
                  .map((word, index) => (
                    <span
                      key={index}
                      onClick={() => handleWordClick(word, index)}
                      className="px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm font-medium flex items-center gap-2"
                    >
                      <Star className="w-3 h-3" />
                      {word.word}
                    </span>
                  ))}
              </div>
            </div>
          </section>

          {/* Completion Section */}
          {fromDashboard && (
            <section className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/20 dark:to-teal-900/20 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-emerald-200/50 dark:border-emerald-700/50 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                🎉 مبروك! لقد أكملت قراءة القصة
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-base sm:text-lg max-w-2xl mx-auto">
                لقد قضيت{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(readingTime)}
                </span>{" "}
                في قراءة هذه القصة وتعلمت{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {wordsLearned}
                </span>{" "}
                كلمة جديدة!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-105 transition-all duration-300 font-semibold text-base sm:text-lg flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  العودة للداشبورد
                </button>
                <button
                  onClick={() =>
                    navigate("/story-exam", { state: { story: currentStory } })
                  }
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 font-semibold text-base sm:text-lg flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-5 h-5" />
                  اختبر معرفتك
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  نسبة إتمامك:{" "}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.round(readingProgress)}%
                  </span>
                </p>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Enhanced Word Modal */}
      {showWordModal && selectedWord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in-0 duration-300">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full mx-4 border border-gray-200/50 dark:border-gray-700/50 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Word Type Indicator */}
              <div className="flex justify-center mb-4">
                {selectedWord.isDailyWord ? (
                  <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    كلمة اليوم
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                    كلمة عادية
                  </div>
                )}
              </div>

              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-white text-2xl font-bold">
                  {selectedWord.word.charAt(0).toUpperCase()}
                </span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedWord.word}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg sm:text-xl font-medium">
                {selectedWord.meaning}
              </p>

              {selectedWord.sentence && (
                <div className="bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-200/50 dark:border-gray-600/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    مثال:
                  </p>
                  <p className="text-gray-800 dark:text-gray-200 text-base mb-3 font-medium">
                    "{selectedWord.sentence}"
                  </p>
                  {selectedWord.sentenceAr && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm text-right border-t border-gray-200 dark:border-gray-600 pt-3">
                      "{selectedWord.sentenceAr}"
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
                <button
                  onClick={() =>
                    handleWordStatusChange(selectedWord.word, "KNOWN")
                  }
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                >
                  <Check className="w-4 h-4" />
                  أعرفها جيداً
                </button>
                <button
                  onClick={() =>
                    handleWordStatusChange(selectedWord.word, "PARTIALLY_KNOWN")
                  }
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                >
                  <HelpCircle className="w-4 h-4" />
                  أعرفها جزئياً
                </button>
                <button
                  onClick={() =>
                    handleWordStatusChange(selectedWord.word, "NOT_LEARNED")
                  }
                  className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-rose-500/25 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                >
                  <X className="w-4 h-4" />
                  لا أعرفها
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => speakText(selectedWord.word)}
                  className="flex-1 px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-300 font-medium flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  استمع للنطق
                </button>
                <button
                  onClick={() => setShowWordModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-medium"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        style={{ display: "none" }}
      >
        <source src={(currentStory as any).audioUrl || ""} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Custom Styles */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};
