import React from 'react';

export const Ticker = React.memo(function Ticker() {
  const items = [
    " 25% OFF Festive Teak Sale",
    " Free White-Glove Delivery over ৳50,000",
    "️ 10-Year Craftsmanship Guarantee",
    " Bespoke Interior Consultation",
    " Chittagong Teak & Melamine Board",
    " bKash, Nagad & Cash on Delivery Available"
  ];

  const repeatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {repeatedItems.map((item, idx) => (
          <span className="ticker-item" key={idx}>
            <span className="dot"></span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
});
