import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";

const app = express();
app.use(express.json());

const sessions = new Map();

const wordLists = {
  prefixes: ["Bloxy", "Roblox", "Game", "Virtual", "Meta", "Pixel", "Block", "Cube"],
  nouns: ["Cross", "World", "Adventure", "Quest", "Journey", "Realm", "Universe", "Dimension"],
  verbs: ["Play", "Join", "Enter", "Start", "Launch", "Access", "Connect", "Verify"],
  adjectives: ["Awesome", "Epic", "Random", "Secure", "Magic", "Digital", "Online", "Interactive"],
  gamingTerms: ["Player", "Token", "Level", "Quest", "Item", "XP", "Coin", "Badge"],
  statusWords: ["Accepted", "Verified", "Confirmed", "Approved", "Valid", "Active", "Ready", "Live"]
};

function generateRandomCode() {
  return Math.floor(Math.random() * 1e15).toString();
}

function generateRandomPhase() {
  const templates = [
    () => `${getRandomWord(wordLists.prefixes)}${getRandomWord(wordLists.nouns)} | ${getRandomWord(wordLists.verbs)} ${getRandomWord(wordLists.adjectives)} ${getRandomWord(wordLists.gamingTerms)}`,
    
    () => `${getRandomWord(wordLists.adjectives)} ${getRandomWord(wordLists.nouns)} | ${getRandomWord(wordLists.statusWords)} ${getRandomWord(wordLists.gamingTerms)}`,
    
    () => `${getRandomWord(wordLists.prefixes)} ${getRandomWord(wordLists.gamingTerms)} | ${getRandomWord(wordLists.verbs)} ${getRandomWord(wordLists.statusWords)} ${getRandomWord(wordLists.nouns)}`,
    
    () => `${getRandomWord(wordLists.adjectives)} ${getRandomWord(wordLists.adjectives)} ${getRandomWord(wordLists.nouns)} | ${getRandomWord(wordLists.gamingTerms)} ${getRandomWord(wordLists.statusWords)}`,
    
    () => `${getRandomWord(wordLists.prefixes)} ${getRandomWord(wordLists.adjectives)} ${getRandomWord(wordLists.nouns)} | ${getRandomWord(wordLists.verbs)} ${getRandomWord(wordLists.gamingTerms)}`
  ];

  // Pick a random template and execute it
  const template = templates[Math.floor(Math.random() * templates.length)];
  const basePhrase = template();
  
  const tag = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${basePhrase} [${tag}]`;
}

function getRandomWord(wordArray) {
  return wordArray[Math.floor(Math.random() * wordArray.length)];
}

app.post("/login", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      success: false,
      message: "Username is required.",
    });
  }

  const url = "https://users.roblox.com/v1/usernames/users";
  const payload = {
    usernames: [username],
    excludeBannedUsers: false,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Roblox API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const user = data.data[0];
      const code = generateRandomCode();
      const phase = generateRandomPhase();

      const session = {
        username: user.name,
        userId: user.id,
        displayName: user.displayName,
        code,
        phase,
        createdAt: Date.now(),
      };

      sessions.set(code, session);

      setTimeout(() => {
        sessions.delete(code);
        console.log(`🗑️ Session with code ${code} expired and deleted.`);
      }, 10 * 60 * 1000);

      return res.json({
        success: true,
        message: "OK",
        code,
        phase,
        user: {
          username: user.name,
          userId: user.id,
          displayName: user.displayName,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

app.get("/sessions", (req, res) => {
  res.json(Object.fromEntries(sessions));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
