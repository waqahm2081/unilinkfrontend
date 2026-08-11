import React, { useState } from 'react';
import '../styles/login.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://unilinkapi-production.up.railway.app';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                login(data.token, data.user);
                navigate('/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <>
            <section className="home-section">
                <div className="container-fluid">
                    <div className="row min-vh-100">
                        <div className="col-lg-6 p-0 d-none d-lg-block">
                            <div className="login-image-section">
                                <div className="overlay"></div>
                                <div className="content-wrapper">
                                    <img src="images/logo.webp" alt="Logo" className="logo-image"/>
                                    <h2 className="welcome-text">Welcome to Admin Dashboard</h2>
                                    <p className="subtitle">Manage your student counseling system efficiently</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6 d-flex align-items-center justify-content-center">
                            <div className="login-form-container">
                                <div className="text-center mb-4 d-lg-none">
                                    <img src="images/logo.webp" alt="Logo" className="logo-mobile" />
                                </div>

                                <div className="login-form-wrapper">
                                    <h1 className="login-title">Admin Login</h1>
                                    <p className="login-subtitle">Enter your credentials to access the dashboard</p>

                                    {error && (
                                        <div style={{
                                            background: '#fee2e2',
                                            color: '#991b1b',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            marginBottom: '20px',
                                            border: '1px solid #fecaca',
                                            fontSize: '14px'
                                        }}>
                                            {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="mt-4">
                                        <div className="mb-3">
                                            <label htmlFor="email" className="form-label">
                                                <i className="fas fa-envelope me-2"></i>Email Address
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="password" className="form-label">
                                                <i className="fas fa-lock me-2"></i>Password
                                            </label>
                                            <div className="password-input-wrapper">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="form-control"
                                                    id="password"
                                                    placeholder="Enter your password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    disabled={loading}
                                                />
                                                <button 
                                                    type="button" 
                                                    className="toggle-password" 
                                                    onClick={togglePassword}
                                                >
                                                    <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <div className="form-check">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    id="rememberMe"
                                                    checked={rememberMe}
                                                    onChange={(e) => setRememberMe(e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor="rememberMe">
                                                    Remember me
                                                </label>
                                            </div>
                                            {/* <Link to="/forgot-password" className="forgot-password-link">
                                                Forgot Password?
                                            </Link> */}
                                        </div>

                                        <button 
                                            type="submit" 
                                            className="btn btn-primary w-100 login-btn"
                                            disabled={loading}
                                        >
                                            <i className="fas fa-sign-in-alt me-2"></i>
                                            {loading ? 'Logging in...' : 'Login'}
                                        </button>

                                        {/* <div className="text-center mt-3">
                                            <p className="mb-0">
                                                Don't have an account? <Link to="/register" style={{color: '#F47B20'}}>Register</Link>
                                            </p>
                                        </div> */}
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}