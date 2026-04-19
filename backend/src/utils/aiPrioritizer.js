// Rule-based AI priority scoring (expandable to ML model later)
const HIGH_RISK_KEYWORDS = [
  'gun', 'knife', 'weapon', 'attack', 'stab', 'shoot', 'bomb',
  'fire', 'explosion', 'rape', 'assault', 'bleeding', 'unconscious',
  'help', 'danger', 'emergency', 'dying', 'dead',
];

const MEDIUM_RISK_KEYWORDS = [
  'theft', 'robbery', 'stolen', 'fighting', 'suspicious', 'threatening',
  'harassment', 'vandalism', 'break in', 'intruder',
];

const TYPE_SCORES = {
  panic: 90,
  fire: 85,
  medical: 80,
  assault: 85,
  suspicious: 50,
  general: 30,
  theft: 55,
  other: 35,
};

const calculateAIPriority = ({ type, message }) => {
  let score = TYPE_SCORES[type] || 40;

  if (message) {
    const lowerMsg = message.toLowerCase();

    for (const keyword of HIGH_RISK_KEYWORDS) {
      if (lowerMsg.includes(keyword)) {
        score = Math.min(score + 15, 100);
        break;
      }
    }

    for (const keyword of MEDIUM_RISK_KEYWORDS) {
      if (lowerMsg.includes(keyword)) {
        score = Math.min(score + 8, 100);
        break;
      }
    }
  }

  return score;
};

const getPriorityLabel = (score) => {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

module.exports = { calculateAIPriority, getPriorityLabel };