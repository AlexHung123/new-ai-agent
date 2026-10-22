'use client';

import { Plus } from 'lucide-react';

const Navbar = () => {
  return (
    <div className="chat-topbar">
      <div className="chat-topbar-actions">
        <button
          type="button"
          className="chat-topbar-icon"
          title="New conversation"
          aria-label="New conversation"
          onClick={() => {
            window.location.href = '/itms/ai/';
          }}
        >
          <Plus size={13} strokeWidth={2} />
          <span>New</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
