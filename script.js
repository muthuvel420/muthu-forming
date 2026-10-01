document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = hamburger.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });
  }

  // Color Theme Switcher Widget
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themePanel = document.getElementById('themePanel');
  const themeButtons = document.querySelectorAll('.theme-option-btn');

  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem('muthu_theme') || 'emerald';
  applyTheme(savedTheme);

  if (themeToggleBtn && themePanel) {
    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themePanel.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!themePanel.contains(e.target) && e.target !== themeToggleBtn) {
        themePanel.classList.remove('active');
      }
    });
  }

  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      applyTheme(theme);
      localStorage.setItem('muthu_theme', theme);
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  function applyTheme(theme) {
    document.body.classList.remove('theme-emerald', 'theme-gold', 'theme-cyber', 'theme-ocean', 'theme-dark');
    if (theme !== 'emerald') {
      document.body.classList.add(`theme-${theme}`);
    }
    themeButtons.forEach(btn => {
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Scroll Animation - Fade Up
  const fadeUpObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15
  });

  document.querySelectorAll('.fade-up').forEach(el => fadeUpObserver.observe(el));

  // Counter Animation for Stats
  const statElements = document.querySelectorAll('.stat-item h3');
  let animated = false;

  function checkStatsScroll() {
    if (animated) return;
    const statsSection = document.querySelector('.stats');
    if (!statsSection) return;

    const rect = statsSection.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.85) {
      animated = true;
      statElements.forEach(stat => {
        const text = stat.innerText;
        const numberMatch = text.match(/\d+/);
        if (numberMatch) {
          const target = parseInt(numberMatch[0]);
          const suffix = text.replace(numberMatch[0], '');
          let count = 0;
          const step = Math.ceil(target / 40);
          const timer = setInterval(() => {
            count += step;
            if (count >= target) {
              count = target;
              clearInterval(timer);
            }
            stat.innerText = count + suffix;
          }, 30);
        }
      });
    }
  }

  window.addEventListener('scroll', checkStatsScroll);
  checkStatsScroll();

  // Active Menu Highlight
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // ========== BACKEND API INTEGRATION ==========
  const API_BASE = 'http://localhost:5000/api';

  // Contact Form Submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

      const payload = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
      };

      try {
        const response = await fetch(`${API_BASE}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        alert(result.message || 'Message sent successfully!');
        contactForm.reset();
      } catch (err) {
        // Fallback LocalStorage if server is not running
        const existing = JSON.parse(localStorage.getItem('muthu_local_contacts') || '[]');
        payload.id = 'cnt_' + Date.now();
        payload.createdAt = new Date().toISOString();
        existing.unshift(payload);
        localStorage.setItem('muthu_local_contacts', JSON.stringify(existing));

        alert('Thank you! Your contact message has been recorded and saved successfully.');
        contactForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Pre-fill Quote Form if product URL parameter exists
  const urlParams = new URLSearchParams(window.location.search);
  const selectedProduct = urlParams.get('product');
  const quoteForm = document.getElementById('quoteForm');
  if (quoteForm && selectedProduct) {
    const qDetails = document.getElementById('qDetails');
    if (qDetails) {
      qDetails.value = `Inquiry for Product: ${selectedProduct}\n` + qDetails.value;
    }
  }

  // Quote Form Submission
  if (quoteForm) {
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = quoteForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

      const payload = {
        name: document.getElementById('qName').value,
        company: document.getElementById('qCompany').value,
        email: document.getElementById('qEmail').value,
        phone: document.getElementById('qPhone').value,
        material: document.getElementById('qMaterial').value,
        process: document.getElementById('qProcess').value,
        thickness: document.getElementById('qThickness').value,
        quantity: document.getElementById('qQuantity').value,
        details: document.getElementById('qDetails').value
      };

      try {
        const response = await fetch(`${API_BASE}/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        alert(result.message || 'Quotation submitted successfully!');
        quoteForm.reset();
      } catch (err) {
        // Fallback LocalStorage if server is not running
        const existing = JSON.parse(localStorage.getItem('muthu_local_quotes') || '[]');
        payload.id = 'qte_' + Date.now();
        payload.status = 'Pending';
        payload.createdAt = new Date().toISOString();
        existing.unshift(payload);
        localStorage.setItem('muthu_local_quotes', JSON.stringify(existing));

        alert('Quotation request submitted! Our agricultural team will review your farm requirements shortly.');
        quoteForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // ========== USER SESSION MANAGEMENT & PAGE GUARD ACROSS ALL PAGES ==========
  function checkUserSession() {
    const savedUserJson = localStorage.getItem('muthu_user');
    const loginNavBtn = document.getElementById('loginNavBtn');
    const currentFileName = window.location.pathname.split('/').pop() || 'index.html';

    // Page Guard: If not logged in and trying to access any page other than login.html, redirect to login.html
    if (!savedUserJson && currentFileName !== 'login.html') {
      window.location.href = 'login.html';
      return;
    }

    if (savedUserJson && loginNavBtn) {
      try {
        const user = JSON.parse(savedUserJson);
        const navItem = loginNavBtn.parentElement;
        const displayName = user.name ? user.name.split(' ')[0] : 'Farmer';
        const displayPhone = user.phone ? `+91 ${user.phone.slice(-4)}` : '';

        navItem.innerHTML = `
          <div class="user-nav-badge">
            <i class="fas fa-user-circle"></i>
            <span>${displayName} ${displayPhone}</span>
            <button class="logout-mini-btn" id="headerLogoutBtn" title="Logout"><i class="fas fa-sign-out-alt"></i></button>
          </div>
        `;

        const headerLogoutBtn = document.getElementById('headerLogoutBtn');
        if (headerLogoutBtn) {
          headerLogoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out of your Muthu Farming account?')) {
              localStorage.removeItem('muthu_user');
              window.location.href = 'login.html';
            }
          });
        }
      } catch (err) {
        console.error('Error parsing user session', err);
      }
    }
  }

  checkUserSession();

  // ========== LOGIN & REGISTRATION PAGE LOGIC ==========
  const phoneLoginForm = document.getElementById('phoneLoginForm');
  const emailLoginForm = document.getElementById('emailLoginForm');
  const registerForm = document.getElementById('registerForm');
  const loggedInState = document.getElementById('loggedInState');
  const loginAlert = document.getElementById('loginAlert');

  function showAlert(msg, type = 'error') {
    if (!loginAlert) return;
    loginAlert.className = `alert-box ${type}`;
    loginAlert.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i> ${msg}`;
    loginAlert.style.display = 'flex';
  }

  function hideAlert() {
    if (loginAlert) loginAlert.style.display = 'none';
  }

  // Update UI if already logged in on login.html page
  const currentUser = JSON.parse(localStorage.getItem('muthu_user') || 'null');
  if (currentUser && loggedInState && phoneLoginForm) {
    phoneLoginForm.style.display = 'none';
    emailLoginForm.style.display = 'none';
    registerForm.style.display = 'none';
    const authTabs = document.querySelector('.auth-tabs');
    if (authTabs) authTabs.style.display = 'none';

    document.getElementById('loggedInUserName').innerText = `Welcome, ${currentUser.name || 'Farmer'}!`;
    document.getElementById('loggedInUserDetails').innerHTML = `
      <i class="fas fa-phone"></i> Mobile: +91 ${currentUser.phone || 'N/A'}<br>
      <i class="fas fa-envelope"></i> Email: ${currentUser.email || 'N/A'}<br>
      <i class="fas fa-location-dot"></i> Location: ${currentUser.location || 'Tamil Nadu'}
    `;
    loggedInState.style.display = 'block';

    const logoutBtnMain = document.getElementById('logoutBtnMain');
    if (logoutBtnMain) {
      logoutBtnMain.addEventListener('click', () => {
        localStorage.removeItem('muthu_user');
        window.location.reload();
      });
    }
  }

  // Auth Tab Switchers
  const tabBtns = document.querySelectorAll('.auth-tabs .tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      hideAlert();
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (phoneLoginForm) phoneLoginForm.style.display = 'none';
      if (emailLoginForm) emailLoginForm.style.display = 'none';
      if (registerForm) registerForm.style.display = 'none';

      const target = btn.getAttribute('data-target');
      if (target === 'phoneForm' && phoneLoginForm) phoneLoginForm.style.display = 'block';
      if (target === 'emailForm' && emailLoginForm) emailLoginForm.style.display = 'block';
      if (target === 'registerForm' && registerForm) registerForm.style.display = 'block';
    });
  });

  // Toggle Password Visibility Eye Icons
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        const icon = btn.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-eye');
          icon.classList.toggle('fa-eye-slash');
        }
      }
    });
  });

  // Phone Auth Mode Radio Switch (Password vs OTP)
  const phoneAuthRadios = document.querySelectorAll('input[name="phoneAuthMode"]');
  const phonePasswordGroup = document.getElementById('phonePasswordGroup');
  const phoneOtpGroup = document.getElementById('phoneOtpGroup');
  const phonePasswordInput = document.getElementById('phonePassword');

  phoneAuthRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'otp') {
        if (phonePasswordGroup) phonePasswordGroup.style.display = 'none';
        if (phoneOtpGroup) phoneOtpGroup.style.display = 'block';
        if (phonePasswordInput) phonePasswordInput.removeAttribute('required');
      } else {
        if (phonePasswordGroup) phonePasswordGroup.style.display = 'block';
        if (phoneOtpGroup) phoneOtpGroup.style.display = 'none';
        if (phonePasswordInput) phonePasswordInput.setAttribute('required', 'required');
      }
    });
  });

  // OTP Send Timer Simulation
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const otpTimer = document.getElementById('otpTimer');
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', () => {
      const phoneVal = document.getElementById('phoneInput').value;
      if (!phoneVal || phoneVal.length !== 10) {
        showAlert('Please enter a valid 10-digit Phone Number first.');
        return;
      }

      sendOtpBtn.disabled = true;
      let count = 30;
      otpTimer.innerText = `Resend OTP in ${count}s`;
      showAlert(`SMS OTP code sent to +91 ${phoneVal}! (Demo OTP: 123456)`, 'success');

      const timer = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(timer);
          sendOtpBtn.disabled = false;
          otpTimer.innerText = '';
        } else {
          otpTimer.innerText = `Resend OTP in ${count}s`;
        }
      }, 1000);
    });
  }

  // Demo Login Quick Buttons
  const demoPhoneBtn = document.getElementById('demoPhoneBtn');
  const demoEmailBtn = document.getElementById('demoEmailBtn');

  if (demoPhoneBtn) {
    demoPhoneBtn.addEventListener('click', () => {
      const phoneTab = document.getElementById('tabPhoneLogin');
      if (phoneTab) phoneTab.click();
      document.getElementById('phoneInput').value = '9876543210';
      document.getElementById('phonePassword').value = 'farmer123';
      showAlert('Demo Phone Credentials filled! Click "Login to Portal".', 'success');
    });
  }

  if (demoEmailBtn) {
    demoEmailBtn.addEventListener('click', () => {
      const emailTab = document.getElementById('tabEmailLogin');
      if (emailTab) emailTab.click();
      document.getElementById('emailInput').value = 'karthik@muthufarming.com';
      document.getElementById('emailPassword').value = 'farmer123';
      showAlert('Demo Email Credentials filled! Click "Login with Email".', 'success');
    });
  }

  // Helper for performing auth requests
  async function performLogin(payload) {
    hideAlert();
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Login failed.');
      }
      localStorage.setItem('muthu_user', JSON.stringify(data.user));
      showAlert(data.message || 'Login successful! Redirecting to Home Page...', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } catch (err) {
      // Fallback check against local seed users if backend offline
      const localUsers = [
        { name: 'Karthik Subramanian', phone: '9876543210', email: 'karthik@muthufarming.com', location: 'Pollachi, Coimbatore', password: 'farmer123' },
        { name: 'Senthil Kumar', phone: '9443088990', email: 'senthil@konguagri.in', location: 'Erode', password: 'agri123' }
      ];

      const inputVal = (payload.identifier || '').toString().toLowerCase().replace(/\D/g, '');
      const emailVal = (payload.identifier || '').toString().toLowerCase();

      const matched = localUsers.find(u =>
        (inputVal && u.phone === inputVal) ||
        (emailVal && u.email === emailVal)
      );

      if (matched && (payload.otp || matched.password === payload.password)) {
        const { password: _, ...cleanUser } = matched;
        localStorage.setItem('muthu_user', JSON.stringify(cleanUser));
        showAlert('Login Successful! Redirecting to Muthu Farming Home Page...', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      } else {
        showAlert(err.message || 'Login failed. Please check your credentials or register account.');
      }
    }
  }

  // Phone Login Submit
  if (phoneLoginForm) {
    phoneLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const phoneVal = document.getElementById('phoneInput').value;
      const passVal = document.getElementById('phonePassword').value;
      const isOtp = document.querySelector('input[name="phoneAuthMode"]:checked').value === 'otp';
      const otpVal = isOtp ? document.getElementById('phoneOtpInput').value : null;

      if (isOtp && !otpVal) {
        showAlert('Please enter the 6-digit OTP code.');
        return;
      }

      performLogin({
        identifier: phoneVal,
        password: passVal,
        otp: otpVal,
        loginType: 'phone'
      });
    });
  }

  // Email Login Submit
  if (emailLoginForm) {
    emailLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailVal = document.getElementById('emailInput').value;
      const passVal = document.getElementById('emailPassword').value;

      performLogin({
        identifier: emailVal,
        password: passVal,
        loginType: 'email'
      });
    });
  }

  // Register Form Submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const payload = {
        name: document.getElementById('regName').value,
        phone: document.getElementById('regPhone').value,
        email: document.getElementById('regEmail').value,
        location: document.getElementById('regLocation').value,
        password: document.getElementById('regPassword').value
      };

      try {
        const res = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Registration failed.');
        }

        localStorage.setItem('muthu_user', JSON.stringify(data.user));
        showAlert('Account registered successfully! Redirecting to Home Page...', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      } catch (err) {
        // Fallback local save if server offline
        const cleanUser = {
          name: payload.name,
          phone: payload.phone.replace(/\D/g, ''),
          email: payload.email,
          location: payload.location || 'Tamil Nadu'
        };
        localStorage.setItem('muthu_user', JSON.stringify(cleanUser));
        showAlert('Account created! Redirecting to Home Page...', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      }
    });
  }
});


