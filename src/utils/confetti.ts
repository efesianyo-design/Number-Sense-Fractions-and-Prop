import confetti from 'canvas-confetti';

export function fireMathConfetti() {
  try {
    // Left & Right celebratory bursts
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7, x: 0.2 },
      colors: ['#10b981', '#38bdf8', '#a855f7', '#f59e0b', '#ec4899'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7, x: 0.8 },
      colors: ['#10b981', '#38bdf8', '#a855f7', '#f59e0b', '#ec4899'],
      disableForReducedMotion: true,
    });
  } catch (e) {
    console.warn('Confetti effect skipped:', e);
  }
}

export function fireSuperConfetti() {
  try {
    const end = Date.now() + 800;
    const colors = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch {
    // fallback gracefully
  }
}
