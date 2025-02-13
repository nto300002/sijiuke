"use client";
import React from "react";

function MainComponent() {
  const [practiceTexts, setPracticeTexts] = useState([]);
  const [currentText, setCurrentText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/practice-texts", {
      method: "POST",
    })
      .then((res) => {
        if (!res.ok) throw new Error("練習テキストの取得に失敗しました");
        return res.json();
      })
      .then((data) => {
        if (data.texts && data.texts.length > 0) {
          setPracticeTexts(data.texts);
          setCurrentText(data.texts[0].text);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("テキストの読み込みに失敗しました");
      });
  }, []);

  const playText = useCallback(async () => {
    try {
      setIsPlaying(true);
      const audio = new Audio(
        `/integrations/text-to-speech/speech?text=${encodeURIComponent(
          currentText
        )}`
      );
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setError("音声の再生に失敗しました");
      };
      await audio.play();
    } catch (err) {
      console.error(err);
      setIsPlaying(false);
      setError("音声の再生に失敗しました");
    }
  }, [currentText]);

  const checkAnswer = useCallback(async () => {
    if (!userInput.trim()) {
      setError("テキストを入力してください");
      return;
    }

    const correct = userInput.trim() === currentText.trim();
    setIsCorrect(correct);

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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">練習テキスト:</h2>
        <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
          <p className="text-lg">{currentText}</p>
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

      {isCorrect !== null && (
        <div
          className={`p-4 rounded-lg ${
            isCorrect
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          <i
            className={`fas ${
              isCorrect ? "fa-check-circle" : "fa-times-circle"
            } mr-2`}
          ></i>
          {isCorrect ? "正解です！" : "不正解です。もう一度聞いてみましょう。"}
        </div>
      )}
    </div>
  );
}

export default MainComponent;