const HIGH_SCORE_KEY = "froggy_high_score";

export function getHighScore() {
  const raw = localStorage.getItem(HIGH_SCORE_KEY);
  const value = raw === null ? 0 : parseInt(raw, 10);
  return Number.isNaN(value) ? 0 : value;
}

export function setHighScoreIfBetter(score) {
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
    return true;
  }
  return false;
}
