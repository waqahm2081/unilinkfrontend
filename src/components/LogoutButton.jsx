import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";

export default function LogoutButton({ className, children }) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <button onClick={handleLogout} className={className}>
            {children || (
                <>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                </>
            )}
        </button>
    );
}