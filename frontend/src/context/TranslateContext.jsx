import { createContext, useContext, useState } from "react";

export const LANGUAGES = [
  { code: "hi", label: "🇮🇳 Hindi" },
  { code: "es", label: "🇪🇸 Spanish" },
  { code: "fr", label: "🇫🇷 French" },
  { code: "de", label: "🇩🇪 German" },
  { code: "ja", label: "🇯🇵 Japanese" },
  { code: "zh", label: "🇨🇳 Chinese" },
  { code: "ar", label: "🇸🇦 Arabic" },
  { code: "pt", label: "🇧🇷 Portuguese" },
  { code: "ru", label: "🇷🇺 Russian" },
  { code: "ko", label: "🇰🇷 Korean" },
  { code: "it", label: "🇮🇹 Italian" },
  { code: "bn", label: "🇧🇩 Bengali" },
  { code: "tr", label: "🇹🇷 Turkish" },
];

const TranslateContext = createContext({
  targetLang: "hi",
  setTargetLang: () => {},
});

export const TranslateProvider = ({ children }) => {
  const [targetLang, setTargetLang] = useState("hi");
  return (
    <TranslateContext.Provider value={{ targetLang, setTargetLang }}>
      {children}
    </TranslateContext.Provider>
  );
};

export const useTranslateContext = () => useContext(TranslateContext);

// Translate text using the free MyMemory API (no key needed)
export async function translateText(text, targetLang) {
  if (!text?.trim()) return "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data?.responseStatus === 200) {
    return data.responseData.translatedText;
  }
  throw new Error(data?.responseDetails || "Translation failed");
}
