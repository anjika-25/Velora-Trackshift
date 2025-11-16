import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrackName, Track } from '../types/models';
import { tracks } from '../utils/trackData';
import '../styles/track-selection.css';

interface TrackSelectionProps {
  onSelectTrack?: (track: TrackName) => void;
}

const TrackCard: React.FC<{ track: Track; onSelect: () => void; index: number }> = ({ track, onSelect, index }) => {
  return (
    <motion.div
      className="track-card"
      onClick={onSelect}
      whileHover={{ y: -8, scale: 1.03 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 100,
        delay: index * 0.05
      }}
    >
      {/* Track Preview Image Container */}
      <div className="track-image-container">
        <div className="track-image-wrapper">
          <img 
            src={track.previewImage} 
            alt={`${track.name} layout`}
            className="track-image"
          />
        </div>
        {/* Overlay gradient */}
        <div className="track-image-overlay"></div>
        {/* Track number badge */}
        <div className="track-number-badge">
          {String(index + 1).padStart(2, '0')}
        </div>
      </div>
      
      {/* Track Info */}
      <div className="track-info">
        <div className="track-header">
          <div>
            <p className="track-layout-label">TRACK LAYOUT</p>
            <h3 className="track-name">{track.name}</h3>
          </div>
        </div>
        
        <div className="track-type-container">
          <span className={`track-type-badge ${track.type === 'grandPrix' ? 'grand-prix' : track.type === 'street' ? 'street' : 'circuit'}`}>
            {track.type === 'grandPrix' ? 'GRAND PRIX' :
             track.type === 'street' ? 'STREET' :
             'CIRCUIT'}
          </span>
        </div>
        
        <p className="track-description">{track.description}</p>
        
        <div className="track-select-indicator">
          <span>SELECT TRACK</span>
          <svg className="track-select-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      {/* Hover effect border */}
      <div className="track-card-border"></div>
    </motion.div>
  );
};

export const TrackSelection: React.FC<TrackSelectionProps> = ({ onSelectTrack }) => {
  const navigate = useNavigate();

  const handleTrackSelect = (trackName: TrackName) => {
    if (onSelectTrack) {
      onSelectTrack(trackName);
    }
    // Navigate to dashboard with track parameter
    navigate(`/dashboard/${trackName}`);
  };

  return (
    <div className="track-selection-container">
      <div className="track-selection-header">
        <motion.h1 
          className="track-selection-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          SELECT YOUR TRACK
        </motion.h1>
        <motion.div 
          className="track-selection-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Choose from {Object.keys(tracks).length} legendary circuits
        </motion.div>
      </div>
      
      <div className="track-grid">
        {Object.values(tracks).map((track, index) => (
          <TrackCard
            key={track.id}
            track={track}
            index={index}
            onSelect={() => handleTrackSelect(track.name as TrackName)}
          />
        ))}
      </div>
    </div>
  );
};