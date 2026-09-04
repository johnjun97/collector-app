export function getLevelInfo(points) {
  // Find current level
  const level = Math.floor(
    (1 + Math.sqrt(1 + 8 * points)) / 2
  )

  // Points required to reach current level
  const currentLevelPoints =
    level * (level - 1) / 2

  // Points required to reach next level
  const nextLevelPoints =
    level * (level + 1) / 2

  // Progress within current level
  const progressPoints =
    points - currentLevelPoints

  const requiredPoints =
    nextLevelPoints - currentLevelPoints

  const progress =
    (progressPoints / requiredPoints) * 100

  return {
    level,
    currentLevelPoints,
    nextLevelPoints,
    progressPoints,
    requiredPoints,
    progress
  }
}