import React from 'react';

const DefaultAvatar = ({ username, size = 40, style = {} }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradientColors = (name) => {
    if (!name) return ['#6B7280', '#9CA3AF'];
    
    const colors = [
      ['#FF6B6B', '#4ECDC4'], // Red to Teal
      ['#45B7D1', '#96CEB4'], // Blue to Green
      ['#FFEAA7', '#DDA0DD'], // Yellow to Plum
      ['#A8E6CF', '#DCEDC8'], // Mint to Light Green
      ['#FFB3BA', '#BAFFC9'], // Pink to Light Green
      ['#BAE1FF', '#FFB3BA'], // Light Blue to Pink
      ['#FFD93D', '#FF6B6B'], // Yellow to Red
      ['#6C5CE7', '#A29BFE'], // Purple to Light Purple
      ['#00B894', '#00CEC9'], // Green to Cyan
      ['#FDCB6E', '#E17055'], // Orange to Red Orange
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const initials = getInitials(username);
  const [color1, color2] = getGradientColors(username);
  
  // Ensure size is a valid number
  const validSize = typeof size === 'number' && !isNaN(size) ? size : 40;
  const fontSize = Math.max(validSize * 0.4, 12);

  return (
    <div
      style={{
        width: validSize,
        height: validSize,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color1}, ${color2})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: fontSize,
        fontWeight: 'bold',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        ...style
      }}
    >
      {initials}
    </div>
  );
};

export default DefaultAvatar; 