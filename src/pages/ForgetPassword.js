import React from 'react'
import '../styles/login.css'
import { Link } from 'react-router-dom'

export default function ForgetPassword() {
    return (
        <>
            <section className="home-section">
                <div class="container-fluid">
                    <div class="row min-vh-100">
                        <div class="col-lg-6 p-0 d-none d-lg-block">
                            <div class="login-image-section">
                                <div class="overlay"></div>
                                <div class="content-wrapper">
                                    <img src="images/logo.webp" alt="Logo" class="logo-image" />
                                        <h2 class="welcome-text">Reset Your Password</h2>
                                        <p class="subtitle">We'll help you get back to your account</p>
                                </div>
                            </div>
                        </div>

                        <div class="col-lg-6 d-flex align-items-center justify-content-center">
                            <div class="login-form-container">
                                <div class="text-center mb-4 d-lg-none">
                                    <img src="images/logo.webp" alt="Logo" class="logo-mobile"/>
                                </div>

                                <div class="login-form-wrapper">
                                    <h1 class="login-title">Forgot Password?</h1>
                                    <p class="login-subtitle">Enter your email address and we'll send you a link to reset your password</p>

                                    <form id="forgotPasswordForm" class="mt-4">
                                        <div class="mb-3">
                                            <label for="email" class="form-label">
                                                <i class="fas fa-envelope me-2"></i>Email Address
                                            </label>
                                            <input
                                                type="email"
                                                class="form-control"
                                                id="email"
                                                placeholder="Enter your registered email"
                                                required
                                            />
                                        </div>

                                        <button type="submit" class="btn btn-primary w-100 login-btn">
                                            <i class="fas fa-paper-plane me-2"></i>Send Reset Link
                                        </button>
                                    </form>

                                    <div class="text-center mt-4">
                                        <Link to="/" class="forgot-password-link">
                                            Back to Login
                                        </Link>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
