import React from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import LogoutButton from '../components/LogoutButton'

export default function Header() {

    return (
        <>
            <nav className="top-navbar justify-content-between">

                <LogoutButton className="logout-btn" />

                <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                    {/* ── Meetings Calendar shortcut ────────────────────────── */}
                    <Link
                        to="/meetings-calendar"
                        title="Meetings Calendar"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #F47B20, #e8660f)',
                            color: 'white',
                            textDecoration: 'none',
                            boxShadow: '0 3px 10px rgba(244,123,32,0.35)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.08)';
                            e.currentTarget.style.boxShadow = '0 5px 16px rgba(244,123,32,0.5)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 3px 10px rgba(244,123,32,0.35)';
                        }}
                    >
                        <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '16px' }} />
                    </Link>

                    {/* ── User profile ──────────────────────────────────────── */}
                    <div className="user-profile">
                        <img
                            src="https://ui-avatars.com/api/?name=Admin+User&background=F47B20&color=fff"
                            alt="User"
                        />
                        <span>Admin User</span>
                    </div>
                </div>
            </nav>
        </>
    )
}