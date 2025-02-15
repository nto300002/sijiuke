"use client";
import React, { useCallback, useEffect, useState } from "react";

function MainComponent() {
  const [practiceTexts, setPracticeTexts] = useState([]);
  const [currentText, setCurrentText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [isTextRevealed, setIsTextRevealed] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [difficulty, setDifficulty] = useState('normal'); // 'easy', 'normal', 'hard'

  // 難易度に応じてテキストを生成する関数
  const generateText = useCallback(async (selectedDifficulty) => {
    try {
      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ difficulty: selectedDifficulty })
      });

      if (!response.ok) throw new Error("練習テキストの取得に失敗しました");
      
      const data = await response.json();
      if (data.text) {
        setCurrentText(data.text);
        setPracticeTexts([{
          id: 1,
          text: data.text,
          who: "",
          when: "",
          what: "",
          where: "",
          how: ""
        }]);
        setUserInput(""); // 入力をリセット
        setIsCorrect(null); // 正誤判定をリセット
        setIsTextRevealed(false); // テキスト表示をリセット
      }
    } catch (err) {
      console.error(err);
      setError("テキストの生成に失敗しました");
    }
  }, []);

  useEffect(() => {
    generateText(difficulty);
  }, []);

  const playText = useCallback(async () => {
    try {
      setIsPlaying(true);
      setError(null);
      
      // Web Speech APIの設定
      const utterance = new SpeechSynthesisUtterance(currentText);
      utterance.lang = 'ja-JP';  // 日本語に設定
      utterance.rate = speechRate;  // スライダーで調整された読み上げ速度
      utterance.pitch = 1.0;     // 音の高さ
      utterance.volume = 1.0;    // 音量
      
      // 読み上げ終了時のハンドラ
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      // エラー発生時のハンドラ
      utterance.onerror = () => {
        setIsPlaying(false);
        setError('音声の再生に失敗しました');
      };
      
      // 音声合成の開始
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error(err);
      setIsPlaying(false);
      setError('音声の再生に失敗しました');
    }
  }, [currentText, speechRate]);

  const checkAnswer = useCallback(async () => {
    if (!userInput.trim()) {
      setError("テキストを入力してください");
      return;
    }

    const correct = userInput.trim() === currentText.trim();
    setIsCorrect(correct);
    setIsTextRevealed(true);

    try {
      await fetch("/api/save-practice-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practice_text_id: practiceTexts[0].id,
          user_input: userInput.trim(),
          is_correct: correct,
        }),
      });
    } catch (err) {
      console.error(err);
      setError("結果の保存に失敗しました");
    }
  }, [userInput, currentText, practiceTexts]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-center mb-8 font-crimson-text">
        聞き取り練習
      </h1>

      {/* 難易度選択ボタン */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => {
            setDifficulty('easy');
            generateText('easy');
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors
            ${difficulty === 'easy' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-green-100'}`}
        >
          Easy
          <span className="block text-xs">(20-30文字)</span>
        </button>
        <button
          onClick={() => {
            setDifficulty('normal');
            generateText('normal');
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors
            ${difficulty === 'normal' 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Normal
          <span className="block text-xs">(40-50文字)</span>
        </button>
        <button
          onClick={() => {
            setDifficulty('hard');
            generateText('hard');
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors
            ${difficulty === 'hard' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Hard
          <span className="block text-xs">(60-70文字)</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">練習テキスト:</h2>
        <p className="text-sm font-semibold mb-2">難易度:  {difficulty}</p>
        <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
          <p className={`text-lg transition-all duration-300 ${
            isTextRevealed ? '' : 'blur-md select-none'
          }`}>
            {currentText}
          </p>
        </div>
      </div>

      <button
        onClick={playText}
        disabled={isPlaying}
        className={`w-full mb-8 py-3 px-6 rounded-lg text-white font-semibold transition-colors 
          ${
            isPlaying
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
      >
        <i
          className={`fas ${isPlaying ? "fa-spinner fa-spin" : "fa-play"} mr-2`}
        ></i>
        {isPlaying ? "再生中..." : "テキストを読み上げる"}
      </button>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="speech-rate" className="text-sm font-medium text-gray-700">
            読み上げ速度: {speechRate.toFixed(1)}x
          </label>
        </div>
        <input
          type="range"
          id="speech-rate"
          min="0.5"
          max="2"
          step="0.1"
          value={speechRate}
          onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.5x</span>
          <span>1.0x</span>
          <span>2.0x</span>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          聞いた内容を入力してください:
        </h2>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="w-full h-32 p-4 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="ここに聞いた内容を入力してください"
        />
        <button
          onClick={checkAnswer}
          className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
        >
          <i className="fas fa-check mr-2"></i>
          確認する
        </button>
      </div>


    </div>
  );
}

export default MainComponent;
