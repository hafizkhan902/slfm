import React from 'react';

export const MaterialSection = React.memo(function MaterialSection() {
  return (
    <section className="material" id="material">
      <div className="wrap">
        <h2>Why melamine board</h2>
        <div className="feature-row">
          <div className="feature">
            <h3>Moisture resistant</h3>
            <p>Handles humid kitchens and bathrooms without swelling or warping.</p>
          </div>
          <div className="feature">
            <h3>Won't scratch or fade</h3>
            <p>The laminate finish takes daily wear without showing it years later.</p>
          </div>
          <div className="feature">
            <h3>Priced to furnish a whole home</h3>
            <p>The look of solid wood, without needing a solid wood budget.</p>
          </div>
        </div>
      </div>
    </section>
  );
});
