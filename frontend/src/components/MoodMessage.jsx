import { useState } from "react";
import { MessageSimple, useMessageContext } from "stream-chat-react";
import { MOODS } from "./MoodPicker";
import { useTranslateContext, translateText } from "../context/TranslateContext";

const MoodMessage = (props) => {
  const { message, isMyMessage } = useMessageContext();
  const { targetLang } = useTranslateContext();

  const mood       = message?.mood;
  const moodData   = MOODS.find((m) => m.id === mood);
  const mine       = isMyMessage();

  const [hovered,        setHovered]        = useState(false);
  const [translation,    setTranslation]    = useState(null);
  const [translatedLang, setTranslatedLang] = useState(null);
  const [isTranslating,  setIsTranslating]  = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const messageText = message?.text || "";
  const canTranslate = messageText.trim().length > 0;

  const handleTranslate = async (e) => {
    e.stopPropagation();
    // Toggle off if already showing
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    // Use cached translation ONLY if same language
    if (translation && translatedLang === targetLang) {
      setShowTranslation(true);
      return;
    }
    try {
      setIsTranslating(true);
      const result = await translateText(messageText, targetLang);
      setTranslation(result);
      setTranslatedLang(targetLang);
      setShowTranslation(true);
    } catch {
      setTranslation("⚠️ Translation failed. Try again.");
      setTranslatedLang(null);
      setShowTranslation(true);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div
      className={[
        "mood-message-root",
        moodData  ? `mood-${mood}`   : "",
        mine      ? "mood-mine"      : "mood-theirs",
      ].join(" ")}
      style={
        moodData
          ? { "--mc": moodData.color, "--mg": moodData.glow }
          : undefined
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Mood tag pill */}
      {moodData && (
        <div className={`mood-tag-wrap ${mine ? "mood-tag-wrap-mine" : "mood-tag-wrap-theirs"}`}>
          <div className="mood-tag">
            <span className={`mood-tag-emoji ${moodData.animation}`}>{moodData.emoji}</span>
            <span className="mood-tag-text">{moodData.label}</span>
          </div>
        </div>
      )}

      {/* Stream Chat default bubble */}
      <MessageSimple {...props} />

      {/* Inline Translation result */}
      {showTranslation && translation && (
        <div className={`translate-result ${mine ? "translate-mine" : "translate-theirs"}`}>
          <span className="translate-result-icon">🌐</span>
          <span className="translate-result-text">{translation}</span>
          <button
            className="translate-close-btn"
            onClick={(e) => { e.stopPropagation(); setShowTranslation(false); }}
            title="Close translation"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hover action buttons */}
      {hovered && (
        <div className={`msg-action-row ${mine ? "msg-action-left" : "msg-action-right"}`}>
          {/* Translate button */}
          {canTranslate && (
            <button
              type="button"
              className={`translate-btn ${isTranslating ? "translate-btn-loading" : ""}`}
              onClick={handleTranslate}
              title="Translate message"
            >
              {isTranslating ? "⏳" : "🌐"} {isTranslating ? "..." : "Translate"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MoodMessage;
