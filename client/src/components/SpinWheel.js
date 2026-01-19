import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import '../styles/SpinWheel.css';

const SpinWheel = ({ isOpen, onClose, onPrizeWon }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [spinsRemaining, setSpinsRemaining] = useState(0);
  const [prizes, setPrizes] = useState([10, 25, 50, 100, 150, 200, 500, 1000]);
  const [showResult, setShowResult] = useState(false);
  const [wonAmount, setWonAmount] = useState(0);

  useEffect(() => {
    checkCanSpin();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await axios.get('/wheel/config');
      if (response.data.prize_amounts) {
        setPrizes(response.data.prize_amounts);
      }
    } catch (error) {
      console.error('Error loading wheel config:', error);
    }
  };

  const checkCanSpin = async () => {
    try {
      const response = await axios.get('/wheel/can-spin');
      setCanSpin(response.data.canSpin);
      setSpinsRemaining(response.data.spinsRemaining);
    } catch (error) {
      console.error('Error checking spin availability:', error);
    }
  };

  const spinWheel = async () => {
    if (spinning || !canSpin) return;

    setSpinning(true);
    setShowResult(false);

    try {
      const response = await axios.post('/wheel/spin');
      const { prizeAmount, newBalance, spinsRemaining: remaining } = response.data;

      // Calculate rotation to land on prize
      const prizeIndex = prizes.indexOf(prizeAmount);
      const segmentAngle = 360 / prizes.length;
      const targetAngle = prizeIndex * segmentAngle;
      
      // Spin multiple times + target angle
      const spins = 5 + Math.random() * 3; // 5-8 full rotations
      const totalRotation = rotation + (spins * 360) + (360 - targetAngle);

      setRotation(totalRotation);

      // Wait for animation to complete
      setTimeout(() => {
        setSpinning(false);
        setWonAmount(prizeAmount);
        setShowResult(true);
        setSpinsRemaining(remaining);
        setCanSpin(remaining > 0);
        
        if (onPrizeWon) {
          onPrizeWon(prizeAmount, newBalance);
        }
      }, 4000);

    } catch (error) {
      setSpinning(false);
      alert(error.response?.data?.message || 'Error spinning wheel');
    }
  };

  const segmentAngle = 360 / prizes.length;
  const colors = [
    { base: '#8B0000', dark: '#5A0000' }, // Dark Red
    { base: '#FF4500', dark: '#CC3700' }, // Orange Red
    { base: '#FFD700', dark: '#CCB000' }, // Gold
    { base: '#32CD32', dark: '#28A428' }, // Lime Green
    { base: '#1E90FF', dark: '#1873CC' }, // Dodger Blue
    { base: '#9370DB', dark: '#7659B3' }, // Medium Purple
    { base: '#FF1493', dark: '#CC1075' }, // Deep Pink
    { base: '#FF8C00', dark: '#CC7000' }  // Dark Orange
  ];

  if (!isOpen) return null;

  return (
    <div className="spin-wheel-overlay" onClick={onClose}>
      <div className="spin-wheel-modal" onClick={(e) => e.stopPropagation()}>
        <button className="spin-wheel-close" onClick={onClose}>&times;</button>
        <div className="spin-wheel-container">
      <div className="wheel-header">
        <h2>Daily Spin Wheel</h2>
        <p className="spins-remaining">
          {canSpin ? `${spinsRemaining} spin${spinsRemaining !== 1 ? 's' : ''} remaining today` : 'No spins remaining today'}
        </p>
      </div>

      <div className="wheel-wrapper">
        <div className="wheel-pointer">▼</div>
        <div 
          className={`wheel ${spinning ? 'spinning' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {prizes.map((prize, index) => {
            const startAngle = index * segmentAngle;
            const colorPair = colors[index % colors.length];
            return (
              <div
                key={index}
                className="wheel-segment"
                style={{
                  transform: `rotate(${startAngle}deg)`,
                  '--segment-color': colorPair.base,
                  '--segment-color-dark': colorPair.dark
                }}
              >
                <div className="prize-text" style={{ transform: `rotate(${-startAngle + 90 - segmentAngle / 2}deg) translateX(-60px)` }}>
                  {prize} VB
                </div>
              </div>
            );
          })}
          <div className="wheel-center">
            <span>SPIN</span>
          </div>
        </div>
      </div>

      <button 
        className="spin-button"
        onClick={spinWheel}
        disabled={spinning || !canSpin}
      >
        {spinning ? 'Spinning...' : canSpin ? 'Spin the Wheel!' : 'No Spins Left Today'}
      </button>

      {showResult && (
        <div className="spin-result">
          <div className="result-content">
            <h3>🎉 You Won! 🎉</h3>
            <div className="prize-amount">{wonAmount} Valiant Bucks</div>
            <button onClick={() => setShowResult(false)}>Close</button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;
