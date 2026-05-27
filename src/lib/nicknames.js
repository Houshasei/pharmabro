// Random funny pharmacist nicknames
const ADJ = [
  "Phantom", "Wizard", "Sensei", "Doktor", "Captain", "Ninja", "Master",
  "Suplado", "Padayon", "Lakas", "Bigtime", "Pogi", "Sikat", "Mighty",
  "Galactic", "Quantum", "Atomic", "Stellar", "Cosmic", "Cyber", "Neon",
  "Sleepy", "Wired", "Caffeinated", "Sugar-Free", "Buffered", "Crystal",
];

const NOUN = [
  "Mortar", "Pestle", "Capsule", "Tablet", "Syrup", "Buffer", "Titrant",
  "Excipient", "Enzyme", "Mitochondria", "Ribosome", "Alkaloid", "Glycoside",
  "Tinik", "Mainit", "Sabaw", "Patatas", "Bombero", "Pinata",
  "Beaker", "Pipette", "Eppendorf", "Centrifuge", "Hypotonic", "Isotonic",
];

const SUFFIX = ["", " 47", " X", " Prime", " Jr.", " Sr.", " IX", " 99", " 2.0"];

export function generateNickname() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  const s = SUFFIX[Math.floor(Math.random() * SUFFIX.length)];
  return `${a} ${n}${s}`;
}
