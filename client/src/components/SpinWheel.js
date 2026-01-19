import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import '../styles/SpinWheel.css';

const SpinWheel = ({ onPrizeWon }) => {
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
  const colors = ['#004f9e', '#0066cc', '#003d7a', '#0052a3', '#005bb5', '#0047a0', '#0059b3', '#004080'];

  return (
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
            return (
              <div
                key={index}
                className="wheel-segment"
                style={{
                  transform: `rotate(${startAngle}deg)`,
                  backgroundColor: colors[index % colors.length]
                }}
              >
                <div className="prize-text" style={{ transform: `rotate(${segmentAngle / 2}deg)` }}>
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
  );
};

export default SpinWheel;
