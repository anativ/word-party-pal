// Success sound (happy chime)
export const playSuccessSound = () => {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 523.25; // C5
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);

  // Add second note
  const oscillator2 = audioContext.createOscillator();
  const gainNode2 = audioContext.createGain();
  oscillator2.connect(gainNode2);
  gainNode2.connect(audioContext.destination);

  oscillator2.frequency.value = 659.25; // E5
  oscillator2.type = 'sine';
  gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
  gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

  oscillator2.start(audioContext.currentTime + 0.1);
  oscillator2.stop(audioContext.currentTime + 0.6);
};

// Fail sound (descending tone)
export const playFailSound = () => {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
  oscillator.type = 'sawtooth';
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};
