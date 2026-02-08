// login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-login',
  template: `
   <!-- login.component.html -->
<div class="login-container">
  <!-- Left side - Enhanced Illustration -->
  <div class="image-section">
    <div class="floating-elements">
      <div class="floating-circle circle-1"></div>
      <div class="floating-circle circle-2"></div>
      <div class="floating-circle circle-3"></div>
    </div>
    
    <div class="illustration-wrapper">
      <svg class="construction-illustration" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <!-- Enhanced gradient definitions -->
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
          </linearGradient>
          <radialGradient id="glowEffect" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
          </radialGradient>
        </defs>

        <!-- Enhanced sky background -->
        <rect width="800" height="600" fill="url(#skyGradient)" />
        <rect width="800" height="600" fill="url(#glowEffect)" />

        <!-- Enhanced clouds with animation -->
        <g class="clouds">
          <ellipse cx="120" cy="80" rx="40" ry="20" fill="rgba(255,255,255,0.3)" />
          <ellipse cx="140" cy="85" rx="35" ry="18" fill="rgba(255,255,255,0.25)" />
          <ellipse cx="350" cy="60" rx="45" ry="22" fill="rgba(255,255,255,0.3)" />
          <ellipse cx="680" cy="90" rx="38" ry="19" fill="rgba(255,255,255,0.25)" />
        </g>

        <!-- Enhanced Monitor/Computer with glow -->
        <g class="monitor-group">
          <rect x="50" y="200" width="300" height="200" rx="15" fill="#1a1a2e" />
          <rect x="55" y="205" width="290" height="190" rx="12" fill="#16213e" />
          <rect x="65" y="215" width="270" height="170" rx="8" fill="#0f3460" />
          
          <!-- Screen glow effect -->
          <rect x="65" y="215" width="270" height="170" rx="8" fill="url(#glowEffect)" opacity="0.5" />

          <!-- Enhanced chart bars with gradients -->
          <rect x="100" y="320" width="25" height="40" fill="url(#chartGradient)" />
          <rect x="135" y="300" width="25" height="60" fill="url(#chartGradient)" />
          <rect x="170" y="280" width="25" height="80" fill="url(#chartGradient)" />
          <rect x="205" y="260" width="25" height="100" fill="url(#chartGradient)" />
          <rect x="240" y="240" width="25" height="120" fill="url(#chartGradient)" />

          <!-- Enhanced upward arrow with glow -->
          <polygon points="280,240 300,220 290,225 290,250 280,250" fill="#00ff88" />
          <polygon points="280,240 300,220 290,225 290,250 280,250" fill="rgba(0,255,136,0.3)" transform="scale(1.2)" transform-origin="290 235" />
        </g>

        <!-- Monitor stand with modern design -->
        <rect x="170" y="400" width="60" height="15" fill="#2D3748" rx="7" />
        <rect x="190" y="415" width="20" height="30" fill="#2D3748" rx="3" />
        <rect x="160" y="445" width="80" height="10" fill="#2D3748" rx="5" />

        <!-- Enhanced construction worker -->
        <g id="worker" class="worker-animation">
          <!-- Body with better proportions -->
          <rect x="25" y="320" width="40" height="80" fill="#1e3a8a" rx="5" />
          <!-- Enhanced safety vest -->
          <rect x="25" y="320" width="40" height="60" fill="#f59e0b" rx="3" />
          <!-- Reflective stripes -->
          <rect x="25" y="335" width="40" height="4" fill="#fbbf24" />
          <rect x="25" y="355" width="40" height="4" fill="#fbbf24" />
          <!-- Head with better skin tone -->
          <circle cx="45" cy="305" r="15" fill="#fed7aa" />
          <!-- Modern hard hat -->
          <ellipse cx="45" cy="295" rx="18" ry="12" fill="#f59e0b" />
          <ellipse cx="45" cy="295" rx="15" ry="9" fill="#fbbf24" />
          <!-- Arms -->
          <rect x="10" y="340" width="15" height="35" fill="#1e3a8a" rx="7" />
          <rect x="65" y="340" width="15" height="35" fill="#1e3a8a" rx="7" />
          <!-- Pointing arm -->
          <rect x="65" y="320" width="30" height="8" fill="#1e3a8a" transform="rotate(-20 65 324)" rx="4" />
          <!-- Hand -->
          <circle cx="95" cy="315" r="5" fill="#fed7aa" />
          <!-- Legs -->
          <rect x="30" y="400" width="12" height="35" fill="#1e293b" rx="6" />
          <rect x="48" y="400" width="12" height="35" fill="#1e293b" rx="6" />
          <!-- Modern work boots -->
          <ellipse cx="36" cy="440" rx="10" ry="6" fill="#0f172a" />
          <ellipse cx="54" cy="440" rx="10" ry="6" fill="#0f172a" />
        </g>

        <!-- Enhanced building with modern glass effect -->
        <g class="building-group">
          <rect x="500" y="300" width="150" height="200" fill="#1e3a8a" rx="8" />
          <rect x="500" y="300" width="150" height="200" fill="rgba(255,255,255,0.1)" rx="8" />
          
          <!-- Glass reflection effect -->
          <rect x="505" y="305" width="20" height="190" fill="rgba(255,255,255,0.2)" />
          <rect x="625" y="305" width="20" height="190" fill="rgba(255,255,255,0.15)" />

          <!-- Modern windows with lighting -->
          <rect x="520" y="320" width="25" height="30" fill="#0f172a" rx="3" />
          <rect x="522" y="322" width="21" height="26" fill="#fbbf24" opacity="0.6" rx="2" />
          
          <rect x="560" y="320" width="25" height="30" fill="#0f172a" rx="3" />
          <rect x="562" y="322" width="21" height="26" fill="#60a5fa" opacity="0.6" rx="2" />
          
          <rect x="600" y="320" width="25" height="30" fill="#0f172a" rx="3" />
          <rect x="602" y="322" width="21" height="26" fill="#fbbf24" opacity="0.6" rx="2" />
          
          <rect x="520" y="370" width="25" height="30" fill="#0f172a" rx="3" />
          <rect x="522" y="372" width="21" height="26" fill="#34d399" opacity="0.6" rx="2" />
          
          <rect x="560" y="370" width="25" height="30" fill="#0f172a" rx="3" />
          <rect x="562" y="372" width="21" height="26" fill="#f87171" opacity="0.6" rx="2" />
          
          <rect x="600" y="370" width="25" height="30" fill="#0f172a" rx="3" />
          <rect x="602" y="372" width="21" height="26" fill="#a78bfa" opacity="0.6" rx="2" />
        </g>

        <!-- Modern awning -->
        <path d="M 500 500 L 650 500 L 650 485 L 500 485 Q 490 490 500 500" fill="#f59e0b" />
        <path d="M 500 485 L 650 485 L 650 480 L 500 480 Q 490 485 500 485" fill="#fbbf24" />

        <!-- Enhanced construction crane -->
        <g class="crane-group">
          <rect x="680" y="150" width="8" height="300" fill="#f59e0b" rx="4" />
          <rect x="600" y="145" width="150" height="8" fill="#f59e0b" rx="4" />
          <polygon points="680,150 720,180 680,180" fill="#f59e0b" />
          <rect x="595" y="153" width="2" height="20" fill="#1e293b" />
          <rect x="590" y="173" width="12" height="6" fill="#6b7280" rx="3" />
        </g>

        <!-- Modern traffic elements -->
        <polygon points="420,480 440,480 435,440 425,440" fill="#f59e0b" />
        <rect x="422" y="445" width="16" height="3" fill="white" />
        <rect x="422" y="455" width="16" height="3" fill="white" />
        <rect x="422" y="465" width="16" height="3" fill="white" />

        <rect x="450" y="470" width="80" height="30" fill="#f59e0b" rx="5" />
        <rect x="450" y="475" width="80" height="3" fill="white" />
        <rect x="450" y="485" width="80" height="3" fill="white" />
        <rect x="450" y="495" width="80" height="3" fill="white" />

        <!-- Enhanced decorative plant -->
        <ellipse cx="30" cy="480" rx="15" ry="8" fill="#1e293b" />
        <path d="M 25 475 Q 30 460 35 475" fill="#10b981" />
        <path d="M 30 475 Q 35 460 40 475" fill="#34d399" />
        <path d="M 20 475 Q 25 465 30 475" fill="#059669" />

        <!-- Additional gradient definitions -->
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>

  <!-- Right side - Enhanced Login Form -->
  <div class="form-section">
    <div class="form-content">
      <div class="logo">
        <h1>SP⚡DASH</h1>
        <div class="logo-tagline">Digital Construction Platform</div>
      </div>

      <div class="form-header">
        <h2>Welcome Back</h2>
        <p>Sign in with your email or phone number to continue</p>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form" novalidate>
        <!-- Enhanced Email/Phone Field -->
        <div class="form-group">
          <label for="identifier">Email or Phone Number</label>
          <div class="input-wrapper">
            <div class="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <input type="text"
                   id="identifier"
                   formControlName="identifier"
                   class="form-control"
                   [class.error]="hasFieldError('identifier')"
                   placeholder="Enter email or phone number"
                   (focus)="onInputFocus('identifier')"
                   autocomplete="username">
          </div>
          <div class="error-message" *ngIf="hasFieldError('identifier')">
            {{ getIdentifierErrorMessage() }}
          </div>
        </div>

        <!-- Enhanced Password Field -->
        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <div class="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <input [type]="showPassword ? 'text' : 'password'"
                   id="password"
                   formControlName="password"
                   class="form-control"
                   [class.error]="hasFieldError('password')"
                   placeholder="Enter your password"
                   (focus)="onInputFocus('password')"
                   autocomplete="current-password">
            <button type="button" 
                    class="password-toggle"
                    (click)="togglePasswordVisibility()"
                    [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'">
              <svg *ngIf="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg *ngIf="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
          <div class="error-message" *ngIf="hasFieldError('password')">
            {{ getPasswordErrorMessage() }}
          </div>
        </div>

        <!-- Forgot Password Link -->
      

        <!-- Error Alert -->
        <div class="error-alert" *ngIf="error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {{ error }}
        </div>

        <!-- Enhanced Submit Button -->
        <button type="submit"
                class="btn-login"
                [disabled]="loading || loginForm.invalid">
          <span *ngIf="loading" class="spinner"></span>
          <svg *ngIf="!loading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
          </svg>
          {{ getButtonText() }}
        </button>
      </form>

      <!-- Enhanced Support Information -->
      <div class="support-info">
        <div class="support-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11a3 3 0 1 1 6 0c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <span>Need help?</span>
        </div>
        <p>Contact our support team for assistance</p>
        <a href="mailto:sandeepsingh2&#64;zepto.com"
           class="support-email"
           (click)="onSupportClick()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          sandeep.kumar2&#64;zeptonow.com
        </a>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
   /* Enhanced login.component.css with modern design */

/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:host {
  display: block;
  width: 100%;
  height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Main container with modern grid */
.login-container {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 50% 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Enhanced left side with floating elements */
.image-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #8B5CF6 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* Floating background elements */
.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.floating-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation: float1 8s ease-in-out infinite;
}

.circle-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation: float2 10s ease-in-out infinite reverse;
}

.circle-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation: float3 6s ease-in-out infinite;
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -20px) rotate(120deg); }
  66% { transform: translate(-20px, 10px) rotate(240deg); }
}

@keyframes float2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-30px, -30px) rotate(180deg); }
}

@keyframes float3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -40px) scale(1.1); }
}

/* Enhanced animated background overlay */
.image-section::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
  z-index: 1;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Enhanced illustration wrapper */
.illustration-wrapper {
  position: relative;
  z-index: 2;
  width: 85%;
  height: 85%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Enhanced SVG with modern effects */
.construction-illustration {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  object-fit: contain;
  filter: drop-shadow(0 25px 50px rgba(0,0,0,0.3));
  animation: slideInLeft 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* SVG animations */
.clouds {
  animation: cloudFloat 15s ease-in-out infinite;
}

.monitor-group {
  animation: screenGlow 3s ease-in-out infinite alternate;
}

.worker-animation {
  animation: workerWave 4s ease-in-out infinite;
}

.building-group {
  animation: buildingPulse 8s ease-in-out infinite;
}

.crane-group {
  animation: craneSwing 10s ease-in-out infinite;
}

@keyframes cloudFloat {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(20px); }
}

@keyframes screenGlow {
  0% { filter: brightness(1); }
  100% { filter: brightness(1.2); }
}

@keyframes workerWave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes buildingPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes craneSwing {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(2deg); }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-100px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Enhanced right side with glassmorphism */
.form-section {
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%);
  backdrop-filter: blur(20px);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.form-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
  animation: shimmer 3s ease-in-out infinite;
  z-index: 1;
}

@keyframes shimmer {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

/* Enhanced form container */
.form-content {
  width: 100%;
  max-width: 440px;
  padding: 60px 40px;
  position: relative;
  z-index: 2;
}

/* Enhanced logo with modern styling */
.logo {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInDown 0.8s ease-out 0.2s both;
}

.logo h1 {
  color: #667eea;
  font-size: 48px;
  font-weight: 900;
  letter-spacing: 3px;
  text-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-tagline {
  color: #718096;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 8px;
  opacity: 0.8;
}

/* Enhanced form header */
.form-header {
  text-align: center;
  margin-bottom: 50px;
  animation: fadeInDown 0.8s ease-out 0.4s both;
}

.form-header h2 {
  color: #2d3748;
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 16px;
  line-height: 1.2;
}

.form-header p {
  color: #718096;
  font-size: 16px;
  line-height: 1.6;
  font-weight: 500;
}

/* Enhanced form styling */
.login-form {
  width: 100%;
  animation: fadeInUp 0.8s ease-out 0.6s both;
}

.form-group {
  margin-bottom: 32px;
  position: relative;
}

.form-group label {
  display: block;
  color: #4a5568;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: color 0.3s ease;
}

/* Enhanced input wrapper with icon support */
.input-wrapper {
  position: relative;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-wrapper:focus-within {
  transform: translateY(-2px);
}

.input-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  transition: color 0.3s ease;
  z-index: 2;
}

.input-wrapper:focus-within .input-icon {
  color: #667eea;
}

/* Enhanced form controls */
.form-control {
  width: 100%;
  padding: 20px 24px 20px 54px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  color: #2d3748;
  font-family: inherit;
  font-weight: 500;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 1);
}

.form-control.error {
  border-color: #e53e3e;
  box-shadow: 0 0 0 4px rgba(229, 62, 62, 0.15);
}

.form-control::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

/* Password toggle button */
.password-toggle {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.3s ease;
  z-index: 2;
}

.password-toggle:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.password-toggle:focus {
  outline: none;
  color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

/* Enhanced error messages */
.error-message {
  color: #e53e3e;
  font-size: 13px;
  margin-top: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  animation: fadeInUp 0.3s ease-out;
  padding: 8px 12px;
  background: rgba(229, 62, 62, 0.1);
  border-radius: 8px;
  border-left: 3px solid #e53e3e;
}

.error-message::before {
  content: '⚠';
  margin-right: 8px;
  font-size: 16px;
}

/* Enhanced forgot password link */
.forgot-password {
  text-align: right;
  margin-top: 16px;
  margin-bottom: 20px;
}

.forgot-link {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
}

.forgot-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -2px;
  left: 0;
  background-color: #667eea;
  transition: width 0.3s ease;
}

.forgot-link:hover::after {
  width: 100%;
}

.forgot-link:hover {
  color: #764ba2;
}

/* Enhanced error alert */
.error-alert {
  background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
  color: #c53030;
  padding: 18px 20px;
  border-radius: 16px;
  margin-bottom: 28px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #fc8181;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: shake 0.5s ease-in-out;
  backdrop-filter: blur(10px);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

/* Enhanced submit button with modern design */
.btn-login {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 22px 32px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 24px;
  position: relative;
  overflow: hidden;
  font-family: inherit;
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.btn-login::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.6s;
}

.btn-login:hover::before {
  left: 100%;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.btn-login:active:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(102, 126, 234, 0.4);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
}

/* Enhanced spinner animation */
.spinner {
  width: 22px;
  height: 22px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Enhanced support information */
.support-info {
  text-align: center;
  margin-top: 50px;
  padding-top: 40px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  animation: fadeInUp 0.8s ease-out 0.8s both;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px 25px;
}

.support-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #4a5568;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 12px;
}

.support-info p {
  color: #718096;
  font-size: 14px;
  margin-bottom: 16px;
  font-weight: 500;
}

.support-email {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.support-email:hover {
  color: #764ba2;
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
}

/* Enhanced fade animations */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Enhanced Mobile Responsive Design */
@media (max-width: 1200px) {
  .login-container {
    grid-template-columns: 45% 55%;
  }
}

@media (max-width: 1024px) {
  .login-container {
    grid-template-columns: 40% 60%;
  }
  
  .form-content {
    max-width: 400px;
    padding: 40px 30px;
  }
}

@media (max-width: 768px) {
  .login-container {
    grid-template-columns: 1fr;
    grid-template-rows: 35% 65%;
  }

  .image-section {
    height: 100%;
    min-height: 280px;
  }

  .illustration-wrapper {
    width: 80%;
    height: 90%;
  }

  .form-section {
    justify-content: flex-start;
    padding-top: 30px;
  }

  .form-content {
    padding: 30px 25px;
    max-width: 100%;
  }

  .logo h1 {
    font-size: 40px;
    letter-spacing: 2px;
  }

  .logo-tagline {
    font-size: 10px;
  }

  .form-header h2 {
    font-size: 28px;
  }

  .form-header p {
    font-size: 15px;
  }

  .form-control {
    padding: 18px 22px 18px 50px;
    font-size: 16px;
    border-radius: 14px;
  }

  .btn-login {
    padding: 20px 28px;
    font-size: 15px;
    letter-spacing: 0.5px;
    border-radius: 14px;
  }

  .support-info {
    margin-top: 40px;
    padding: 25px 20px;
  }
}

@media (max-width: 480px) {
  .login-container {
    grid-template-rows: 30% 70%;
  }

  .form-content {
    padding: 25px 20px;
  }

  .logo h1 {
    font-size: 32px;
    letter-spacing: 1px;
  }

  .form-header h2 {
    font-size: 24px;
  }

  .form-header {
    margin-bottom: 40px;
  }

  .form-group {
    margin-bottom: 28px;
  }

  .form-control {
    padding: 16px 20px 16px 48px;
    border-radius: 12px;
  }

  .btn-login {
    padding: 18px 24px;
    font-size: 14px;
    border-radius: 12px;
  }

  .support-info {
    padding: 20px 15px;
    margin-top: 35px;
  }

  .support-email {
    font-size: 14px;
    padding: 10px 16px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .form-section {
    background: linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.9) 100%);
  }
  
  .form-header h2 {
    color: #f7fafc;
  }
  
  .form-group label {
    color: #cbd5e0;
  }
  
  .form-control {
    background: rgba(45, 55, 72, 0.8);
    border-color: #4a5568;
    color: #f7fafc;
  }
  
  .support-info {
    background: rgba(45, 55, 72, 0.5);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .form-control {
    border-width: 3px;
  }

  .btn-login {
    border: 3px solid #333;
  }

  .error-message {
    font-weight: 800;
    border-left-width: 5px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .floating-circle {
    animation: none;
  }
  
  .image-section::before {
    animation: none;
  }
}

/* Print styles */
@media print {
  .login-container {
    display: none;
  }
}

/* Focus styles for better accessibility */
.form-control:focus,
.btn-login:focus,
.forgot-link:focus,
.support-email:focus,
.password-toggle:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* Loading state styles */
.form-section.loading {
  pointer-events: none;
}

.form-section.loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 9999;
}
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]], // Changed from email to identifier
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // ✅ Check token expiry before redirect
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      // If token exists but expired, force clear
      const token = this.authService.getToken();
      if (token && !this.authService.hasValidToken()) {
        this.authService.clearAuthData(); // Cleanup expired token
      }
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  // Property to track loading state (rename from isLoading to loading to match template)
  loading = false;

  // Property to track error state (rename from errorMessage to error to match template)
  error = '';

  // Function to check if a field has an error
  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Updated function to get identifier error message (supports both email and phone)
  getIdentifierErrorMessage(): string {
    const identifierControl = this.loginForm.get('identifier');
    if (identifierControl?.hasError('required')) {
      return 'Email address or phone number is required';
    }
    return '';
  }

  // Function to get password error message
  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Password is required';
    }
    return '';
  }

  // Function to handle input focus (clears error state)
  onInputFocus(fieldName: string): void {
    // Clear error when user starts typing
    if (this.error) {
      this.error = '';
    }

    // Optional: Clear field-specific errors
    const control = this.loginForm.get(fieldName);
    if (control && control.invalid) {
      control.markAsUntouched();
    }
  }

  // Function to get button text based on loading state
  getButtonText(): string {
    return this.loading ? 'Signing In...' : 'Sign In';
  }

  // Function to toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Function to handle forgot password
  onForgotPassword(event: Event): void {
    event.preventDefault();
    // Navigate to forgot password page or show modal
    // this.router.navigate(['/forgot-password']);
    console.log('Forgot password clicked');
  }

  // Function to handle support email click
  onSupportClick(): void {
    // Optional: Add analytics tracking or other logic
    console.log('Support email clicked');
  }

  // Helper function to detect if input is email or phone
  private isEmail(input: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  }

  // Helper function to detect if input is phone number
  private isPhoneNumber(input: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(input.replace(/[\s\-\(\)]/g, ''));
  }

  // Updated onSubmit method to handle both email and phone
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true; // Changed from isLoading
      this.error = ''; // Changed from errorMessage

      const identifier = this.loginForm.value.identifier.trim();
      const password = this.loginForm.value.password;

      // Determine if input is email or phone number
      let credentials: any = {
        password: password
      };

      if (this.isEmail(identifier)) {
        credentials.email = identifier;
      } else if (this.isPhoneNumber(identifier)) {
        credentials.phone = identifier;
      } else {
        // If neither email nor phone format, try as email for backward compatibility
        credentials.email = identifier;
      }

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.error = error.error?.error || 'Login failed. Please check your credentials.'; // Changed from errorMessage
          this.loading = false; // Changed from isLoading
        },
        complete: () => {
          this.loading = false; // Changed from isLoading
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
