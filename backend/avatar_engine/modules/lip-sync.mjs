export const lipSync = async (audioBuffer) => {
  const duration = (audioBuffer.length / 44100) / 2;
  const mouthCues = [];
  const shapes = ["A", "B", "C", "D", "E", "F", "X"];

  for (let i = 0; i < Math.ceil(duration * 6.5); i++) {
    mouthCues.push({
      start: i * 0.15,
      end: (i + 1) * 0.15,
      value: shapes[Math.floor(Math.random() * shapes.length)],
    });
  }

  mouthCues.push({ start: duration, end: duration + 0.1, value: "X" });

  return {
    metadata: { duration },
    mouthCues,
  };
};