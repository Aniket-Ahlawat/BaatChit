import { useState } from "react";
import { XIcon } from "lucide-react";

export const MOODS = [
  { id: "happy",     emoji: "😊", label: "Happy",      color: "#FFD700", glow: "rgba(255,215,0,0.35)",    animation: "mood-float"     },
  { id: "lol",       emoji: "😂", label: "LOL",        color: "#FF8C00", glow: "rgba(255,140,0,0.35)",    animation: "mood-bounce"    },
  { id: "love",      emoji: "😍", label: "Love",       color: "#FF69B4", glow: "rgba(255,105,180,0.45)",  animation: "mood-heartbeat" },
  { id: "angry",     emoji: "😡", label: "Angry",      color: "#FF4500", glow: "rgba(255,69,0,0.35)",     animation: "mood-shake"     },
  { id: "sad",       emoji: "😢", label: "Sad",        color: "#6495ED", glow: "rgba(100,149,237,0.35)",  animation: "mood-droop"     },
  { id: "hype",      emoji: "🔥", label: "Hype",       color: "#FF6347", glow: "rgba(255,99,71,0.45)",    animation: "mood-burn"      },
  { id: "bored",     emoji: "😴", label: "Bored",      color: "#9370DB", glow: "rgba(147,112,219,0.35)",  animation: "mood-sway"      },
  { id: "mindblown", emoji: "🤯", label: "Mind Blown", color: "#00CED1", glow: "rgba(0,206,209,0.35)",    animation: "mood-spin"      },
];

const MoodPicker = ({ selectedMood, onMoodSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = MOODS.find((m) => m.id === selectedMood);

  return (
    <div className="mood-picker-root">
      {/* Trigger button */}
      <button
        type="button"
        className="mood-trigger-btn"
        onClick={() => setIsOpen((p) => !p)}
        title="Pick a mood"
        style={current ? { color: current.color, borderColor: current.color } : {}}
      >
        <span className="mood-trigger-emoji">{current ? current.emoji : "😶"}</span>
        {current && (
          <span className="mood-trigger-label" style={{ color: current.color }}>
            {current.label}
          </span>
        )}
      </button>

      {/* Popup grid */}
      {isOpen && (
        <div className="mood-popup">
          <div className="mood-popup-header">
            <span>How are you feeling?</span>
            <button
              type="button"
              className="mood-popup-close"
              onClick={() => setIsOpen(false)}
            >
              <XIcon size={14} />
            </button>
          </div>

          <div className="mood-grid">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                type="button"
                className={`mood-item ${selectedMood === mood.id ? "mood-item-selected" : ""}`}
                style={{ "--mc": mood.color, "--mg": mood.glow }}
                onClick={() => {
                  onMoodSelect(selectedMood === mood.id ? null : mood.id);
                  setIsOpen(false);
                }}
              >
                <span className="mood-item-emoji">{mood.emoji}</span>
                <span className="mood-item-label">{mood.label}</span>
              </button>
            ))}
          </div>

          {selectedMood && (
            <button
              type="button"
              className="mood-clear-btn"
              onClick={() => { onMoodSelect(null); setIsOpen(false); }}
            >
              ✕ Clear mood
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MoodPicker;
