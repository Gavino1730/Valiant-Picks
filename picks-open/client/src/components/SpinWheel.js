import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from '../utils/axios';
import '../styles/SpinWheel.css';
import popupQueue from '../utils/popupQueue';
import { useOrg } from '../context/OrgContext';

const SpinWheel = ({ isOpen, onClose, onPrizeWon }) => {
  const { config } = useOrg();
  const currencyName = config.currency_name || 'Picks Bucks';
  // Short label for wheel segments (max 4 chars)
  const currencyAbbrev = currencyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [spinsRemaining, setSpinsRemaining] = useState(0);
  const [prizes, setPrizes] = useState([500, 750, 1000, 2000, 3000, 5000, 7500, 10000]);
  const [showResult, setShowResult] = useState(false);
  const [wonAmount, setWonAmount] = useState(0);

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

      const prizeIndex = prizes.indexOf(prizeAmount);
      if (prizeIndex === -1) {
        console.error('Prize amount not found in prizes array:', prizeAmount, prizes);
      }

      const segmentAngle = 360 / prizes.length;
      const segmentStartAngle = prizeIndex * segmentAngle;
      const segmentCenterAngle = segmentStartAngle + (segmentAngle / 2);
      const targetAngle = -segmentCenterAngle;
      const spins = 3 + Math.random() * 2;
      const normalizedCurrent = ((rotation % 360) + 360) % 360;
      const normalizedTarget = ((targetAngle % 360) + 360) % 360;
      const delta = (normalizedTarget - normalizedCurrent + 360) % 360;
      const totalRotation = rotation + (spins * 360) + delta;

      setRotation(totalRotation);

      setTimeout(() => {
        setSpinning(false);
        setWonAmount(prizeAmount);
        setShowResult(true);
        setSpinsRemaining(remaining);
        setCanSpin(remaining > 0);
        if (onPrizeWon) {
          onPrizeWon(prizeAmount, newBalance);
        }
      }, 2000);

    } catch (error) {
      setSpinning(false);
      alert(error.response?.data?.message || 'Error spinning wheel');
    }
  };

  const segmentAngle = 360 / prizes.length;
  const colors = [
    { base: '#8B0000', dark: '#5A0000' },
    { base: '#FF4500', dark: '#CC3700' },
    { base: '#FFD700', dark: '#CCB000' },
    { base: '#32CD32', dark: '#28A428' },
    { base: '#1E90FF', dark: '#1873CC' },
    { base: '#9370DB', dark: '#7659B3' },
    { base: '#FF1493', dark: '#CC1075' },
    { base: '#FF8C00', dark: '#CC7000' }
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

                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;

                const x1 = 100 + 100 * Math.cos(startRad);
                const y1 = 100 + 100 * Math.sin(startRad);
                const x2 = 100 + 100 * Math.cos(endRad);
                const y2 = 100 + 100 * Math.sin(endRad);

                const largeArc = segmentAngle > 180 ? 1 : 0;
                const pathData = `M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`;

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
                      {prize} {currencyAbbrev}
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
                fill="var(--color-brand)"
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
                <div className="prize-amount">{wonAmount} {currencyName}</div>
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
