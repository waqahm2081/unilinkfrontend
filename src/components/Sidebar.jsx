import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUsers,
  faUserGraduate,
  faFileAlt,
  faPassport,
  faWallet,
  faDatabase,
  faUserCog,
  faUserTie,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import LogoutButton from '../components/LogoutButton'


export default function Sidebar() {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLeadMenuOpen, setIsLeadMenuOpen] = useState(false);
    const [isMasterDataMenuOpen, setIsMasterDataMenuOpen] = useState(false);
    const [isFinanceMenuOpen, setIsFinanceMenuOpen] = useState(
      location.pathname.startsWith('/finance') || location.pathname.startsWith('/expenses') || location.pathname.startsWith('/create-invoice')
    );

    useEffect(() => {
        const handleToggle = () => setIsCollapsed(prev => !prev);
        window.addEventListener('toggleSidebar', handleToggle);
        return () => window.removeEventListener('toggleSidebar', handleToggle);
    }, []);

    useEffect(() => {
        if (
          location.pathname.startsWith('/finance') ||
          location.pathname.startsWith('/expenses') ||
          location.pathname.startsWith('/create-invoice') ||
          location.pathname.startsWith('/invoice-pdf') ||
          location.pathname.startsWith('/payment-receipt')
        ) {
            setIsFinanceMenuOpen(true);
        }
    }, [location.pathname]);

    const toggleLeadMenu = () => setIsLeadMenuOpen(prev => !prev);
    const toggleMasterDataMenu = () => setIsMasterDataMenuOpen(prev => !prev);
    const toggleFinanceMenu = () => setIsFinanceMenuOpen(prev => !prev);

    return (
        <>
            <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} id="sidebar">
                <div className="sidebar-header">
                    <img src="/images/logo.webp" alt="Logo" className="sidebar-logo" />
                    <h5 className="sidebar-title">Admin Panel</h5>
                </div>

                <ul className="sidebar-menu">

                    <li className="menu-item">
                        <Link to="/dashboard">
                            <FontAwesomeIcon icon={faHome} />
                            <span>Dashboard</span>
                        </Link>
                    </li>

                    <li className="menu-section">
                        <span>MANAGEMENT</span>
                    </li>

                    {/* Lead Management */}
                    <li className="menu-item">
                        <div className="menu-item-parent" onClick={toggleLeadMenu}>
                            <div className="menu-item-content">
                                <FontAwesomeIcon icon={faUsers} />
                                <span>Lead Management</span>
                            </div>
                            <FontAwesomeIcon
                                icon={isLeadMenuOpen ? faChevronUp : faChevronDown}
                                className="submenu-arrow"
                            />
                        </div>
                        <ul className={`submenu ${isLeadMenuOpen ? 'open' : ''}`}>
                            <li>
                                <Link to="/leads"><span>Lead Details</span></Link>
                            </li>
                            <li>
                                <Link to="/follow-ups"><span>Follow Ups</span></Link>
                            </li>
                        </ul>
                    </li>

                    <li className="menu-item">
                        <Link to="/students">
                            <FontAwesomeIcon icon={faUserGraduate} />
                            <span>Manage Students</span>
                        </Link>
                    </li>
                    <li className="menu-item">
                        <Link to="/counselors">
                            <FontAwesomeIcon icon={faUserTie} />
                            <span>Manage Counselors</span>
                        </Link>
                    </li>
                    <li className="menu-item">
                        <Link to="/applications">
                            <FontAwesomeIcon icon={faFileAlt} />
                            <span>Manage Applications</span>
                        </Link>
                    </li>
                    <li className="menu-item">
                        <Link to="/visa">
                            <FontAwesomeIcon icon={faPassport} />
                            <span>Visa Management</span>
                        </Link>
                    </li>
                    <li className="menu-item">
                        <div className="menu-item-parent" onClick={toggleFinanceMenu}>
                            <div className="menu-item-content">
                                <FontAwesomeIcon icon={faWallet} />
                                <span>Finance</span>
                            </div>
                            <FontAwesomeIcon
                                icon={isFinanceMenuOpen ? faChevronUp : faChevronDown}
                                className="submenu-arrow"
                            />
                        </div>
                        <ul className={`submenu ${isFinanceMenuOpen ? 'open' : ''}`}>
                            <li>
                                <Link to="/finance"><span>Finance Overview</span></Link>
                            </li>
                            <li>
                                <Link to="/finance/invoices"><span>Manage Invoices</span></Link>
                            </li>
                            <li>
                                <Link to="/finance/bank-accounts"><span>Manage Bank Account</span></Link>
                            </li>
                            <li>
                                <Link to="/finance/expenses"><span>Manage Expenses</span></Link>
                            </li>
                        </ul>
                    </li>
                    <li className="menu-item">
                        <Link to="/visitor-logs">
                            <FontAwesomeIcon icon={faUserCog} />
                            <span>Visitor Logs</span>
                        </Link>
                    </li>

                    <li className="menu-section">
                        <span>HR & OPERATIONS</span>
                    </li>

                    <li className="menu-item">
                        <Link to="/employees">
                            <FontAwesomeIcon icon={faUsers} />
                            <span>HR &mdash; Employees</span>
                        </Link>
                    </li>

                    <li className="menu-section">
                        <span>MASTER DATA</span>
                    </li>

                    {/* Master Data */}
                    <li className="menu-item">
                        <div className="menu-item-parent" onClick={toggleMasterDataMenu}>
                            <div className="menu-item-content">
                                <FontAwesomeIcon icon={faDatabase} />
                                <span>Master Data</span>
                            </div>
                            <FontAwesomeIcon
                                icon={isMasterDataMenuOpen ? faChevronUp : faChevronDown}
                                className="submenu-arrow"
                            />
                        </div>
                        <ul className={`submenu ${isMasterDataMenuOpen ? 'open' : ''}`}>
                            <li>
                                <Link to="/countries"><span>Manage Countries</span></Link>
                            </li>
                            <li>
                                <Link to="/universities"><span>Manage Universities</span></Link>
                            </li>
                            <li>
                                <Link to="/intakes"><span>Manage Intakes</span></Link>
                            </li>
                        </ul>
                    </li>

                </ul>
            </div>

            <style jsx>{`
                .menu-item-parent {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 28px;
                    cursor: pointer;
                    position: relative;
                    transition: background-color 0.2s ease;
                }

                .menu-item-parent:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }

                .menu-item-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .submenu-arrow {
                    position: absolute;
                    right: 34px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 14px;
                }

                .submenu {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                    background-color: rgba(0, 0, 0, 0.2);
                }

                .submenu.open {
                    max-height: 280px;
                }

                .submenu li {
                    list-style: none;
                }
            `}</style>
        </>
    )
}