import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from '../utils/axios';
import '../styles/SpinWheel.css';
import popupQueue from '../utils/popupQueue';

const SpinWheel = ({ isOpen, onClose, onPrizeWon }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [spinsRemaining, setSpinsRemaining] = useState(0);
  const [prizes, setPrizes] = useState([500, 750, 1000, 2000, 3000, 5000, 7500, 10000]);
  const [showResult, setShowResult] = useState(false);
  const [wonAmount, setWonAmount] = useState(0);

  // Handle close with queue dismissal
  const handleClose = () => {
    popupQueue.dismiss('spinWheel');
    onClose();
  };

  useEffect(() => {
    checkCanSpin();
    loadConfig();
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Scroll the modal into view when opened
      setTimeout(() => {
        const modal = document.querySelector('.spin-wheel-modal');
        if (modal) {
          modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [isOpen]);

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
      // Set defaults on error to prevent infinite retries
      setCanSpin(false);
      setSpinsRemaining(0);
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
      
      // If prize not found in array, log error but continue
      if (prizeIndex === -1) {
        console.error('Prize amount not found in prizes array:', prizeAmount, prizes);
      }
      
      const segmentAngle = 360 / prizes.length;
      
      // Segments are drawn starting from top (-90 degrees) and going clockwise
      // Segment 0 starts at -90 degrees (top)
      // The pointer is at the top (0 degrees in transform space)
      // We need to rotate the wheel so the target segment center aligns with the pointer
      
      // Calculate the angle of the segment center from the top
      // Since segments start at top and go clockwise, segment 0 center is at -90 + segmentAngle/2
      const segmentStartAngle = prizeIndex * segmentAngle;
      const segmentCenterAngle = segmentStartAngle + (segmentAngle / 2);
      
      // To align the segment with the top pointer, we need to rotate by negative of the segment center angle
      // This brings the segment center to 0 degrees (top)
      const targetAngle = -segmentCenterAngle;
      
      // Spin multiple times + target angle
      const spins = 5 + Math.random() * 3; // 5-8 full rotations
      const totalRotation = rotation + (spins * 360) + targetAngle;

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

  return ReactDOM.createPortal(
    <div className="spin-wheel-overlay" onClick={handleClose}>
      <div className="spin-wheel-modal" onClick={(e) => e.stopPropagation()}>
        <button className="spin-wheel-close" onClick={handleClose}>&times;</button>
        <div className="spin-wheel-container">
      <div className="wheel-header">
        <h2>Daily Spin Wheel</h2>
        <p className="spins-remaining">
          {canSpin ? `${spinsRemaining} spin${spinsRemaining !== 1 ? 's' : ''} remaining today` : 'No spins remaining today'}
        </p>
      </div>

      <div className="wheel-wrapper">
        <div className="wheel-pointer">▼</div>
        <svg 
          className={`wheel ${spinning ? 'spinning' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
          viewBox="0 0 200 200"
        >
          {prizes.map((prize, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const colorPair = colors[index % colors.length];
            
            // Convert angles to radians
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            // Calculate path for pie slice
            const x1 = 100 + 100 * Math.cos(startRad);
            const y1 = 100 + 100 * Math.sin(startRad);
            const x2 = 100 + 100 * Math.cos(endRad);
            const y2 = 100 + 100 * Math.sin(endRad);
            
            const largeArc = segmentAngle > 180 ? 1 : 0;
            const pathData = `M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`;
            
            // Text position (middle of segment, 70% from center)
            const midAngle = (startAngle + segmentAngle / 2 - 90) * Math.PI / 180;
            const textX = 100 + 70 * Math.cos(midAngle);
            const textY = 100 + 70 * Math.sin(midAngle);
            const textAngle = startAngle + segmentAngle / 2;
            
            return (
              <g key={index}>
                <defs>
                  <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colorPair.base} />
                    <stop offset="100%" stopColor={colorPair.dark} />
                  </linearGradient>
                </defs>
                <path
                  d={pathData}
                  fill={`url(#gradient-${index})`}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="0.5"
                />
                <text
                  x={textX}
                  y={textY}
                  fill="white"
                  fontSize="10"
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
                  }}
                >
                  {prize} VB
                </text>
              </g>
            );
          })}
          
          {/* Center circle */}
          <circle cx="100" cy="100" r="15" fill="url(#centerGradient)" stroke="white" strokeWidth="2" />
          <defs>
            <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#ffed4e" />
              <stop offset="100%" stopColor="#ffd700" />
            </linearGradient>
          </defs>
          <text
            x="100"
            y="100"
            fill="#004f9e"
            fontSize="8"
            fontWeight="900"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
          >
            SPIN
          </text>
        </svg>
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
    </div>,
    document.body
  );
};

export default SpinWheel;
