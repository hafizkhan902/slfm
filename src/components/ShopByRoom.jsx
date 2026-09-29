import React from 'react';
import { useProducts } from '../context/ProductContext';

export function ShopByRoom({ selectedRoom, setSelectedRoom }) {
  const { roomsList } = useProducts();
  const getRoomIcon = (roomId) => {
    switch (roomId) {
      case 'reading-room':
        return (
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5c3-1.5 6-1.5 9 0v14c-3-1.5-6-1.5-9 0V5Z" />
            <path d="M21 5c-3-1.5-6-1.5-9 0v14c3-1.5 6-1.5 9 0V5Z" />
          </svg>
        );
      case 'dining-room':
        return (
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="9" width="18" height="2.5" rx="1" />
            <path d="M6 11.5V20M18 11.5V20" />
          </svg>
        );
      case 'bedroom':
        return (
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 19v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
            <path d="M3 16h18" />
            <path d="M6 11V8a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3" />
          </svg>
        );
      case 'living-room':
        return (
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 12v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" />
            <path d="M4 12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
            <path d="M6 17v2M18 17v2" />
          </svg>
        );
      case 'decoration':
        return (
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="6" y="3" width="12" height="16" rx="1" />
            <path d="M6 15c2-2 4-2 6 0s4 2 6 0" />
          </svg>
        );
      case 'kids-room':
        return (
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleRoomClick = (roomId) => {
    setSelectedRoom(roomId);
    const shopEl = document.getElementById('shop');
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="rooms" id="rooms">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>Shop by room</h2>
            <p>Six ways we've organised the catalogue — pick where you're furnishing.</p>
          </div>
        </div>

        <div className="room-grid">
          {roomsList.map((rm) => (
            <div
              key={rm.id}
              className={`room-card ${selectedRoom === rm.id ? 'active-room' : ''}`}
              onClick={() => handleRoomClick(rm.id)}
            >
              <span className="swatch" style={{ background: rm.color }}></span>
              <h3>{rm.name}</h3>
              <p>{rm.desc}</p>
              {getRoomIcon(rm.id)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
