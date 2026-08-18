import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import '../styles/viewRecord.css';

export function ViewModeWrap({ viewOnly, children }) {
  return <div className={viewOnly ? 'record-view-embed' : undefined}>{children}</div>;
}

export default function ViewRecordModal({ title, onClose, children }) {
  return (
    <div className="view-record-overlay" onClick={onClose} role="presentation">
      <div className="view-record-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="view-record-header">
          <h2>{title}</h2>
          <button type="button" className="view-record-close" onClick={onClose} title="Close">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="view-record-body">
          {children}
        </div>
      </div>
    </div>
  );
}
