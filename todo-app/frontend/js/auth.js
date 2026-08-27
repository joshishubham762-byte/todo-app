// If the user is already logged in, skip straight to the dashboard
if (getToken() && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
  window.location.href = 'dashboard.html';
}

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}Error`);

  if (input) input.classList.add('input-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}Error`);

  if (input) input.classList.remove('input-error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
}

function clearFormErrors(form) {
  form.querySelectorAll('.field-error').forEach((error) => {
    error.textContent = '';
    error.style.display = 'none';
  });

  form.querySelectorAll('input').forEach((input) => {
    input.classList.remove('input-error');
  });
}

function setLoadingState(button, isLoading, label) {
  if (!button) return;

  const btnText = button.querySelector('.btn-text');
  button.disabled = isLoading;
  button.classList.toggle('loading', isLoading);

  if (btnText) {
    btnText.textContent = label;
  }
}

function goToDashboard() {
  document.body.classList.add('page-exit');
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 220);
}

function bindFieldValidation(form) {
  if (!form) return;

  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      const fieldId = input.id;
      if (fieldId && input.value.trim() !== '') {
        clearFieldError(fieldId);
      }
    });
  });
}

// --- Signup form handling ---
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  bindFieldValidation(signupForm);

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(signupForm);

    const submitBtn = document.getElementById('submitBtn');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let hasError = false;

    if (!name) {
      setFieldError('name', 'Name is required');
      hasError = true;
    }

    if (!email) {
      setFieldError('email', 'Email is required');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('email', 'Please enter a valid email');
      hasError = true;
    }

    if (!password) {
      setFieldError('password', 'Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setFieldError('password', 'Password must be at least 6 characters');
      hasError = true;
    }

    if (!confirmPassword) {
      setFieldError('confirmPassword', 'Please confirm your password');
      hasError = true;
    } else if (confirmPassword !== password) {
      setFieldError('confirmPassword', 'Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    setLoadingState(submitBtn, true, 'Creating account...');

    try {
      const data = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      setToken(data.token);
      localStorage.setItem('userName', data.user.name);
      goToDashboard();
    } catch (error) {
      const message = error.message || 'Unable to create account';
      setFieldError('email', message);
      setLoadingState(submitBtn, false, 'Sign Up');
    }
  });
}

// --- Login form handling ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  bindFieldValidation(loginForm);

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(loginForm);

    const submitBtn = document.getElementById('submitBtn');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let hasError = false;

    if (!email) {
      setFieldError('email', 'Email is required');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('email', 'Please enter a valid email');
      hasError = true;
    }

    if (!password) {
      setFieldError('password', 'Password is required');
      hasError = true;
    }

    if (hasError) return;

    setLoadingState(submitBtn, true, 'Logging in...');

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(data.token);
      localStorage.setItem('userName', data.user.name);
      goToDashboard();
    } catch (error) {
      const message = error.message || 'Invalid email or password';
      setFieldError('email', message);
      setFieldError('password', message);
      setLoadingState(submitBtn, false, 'Log In');
    }
  });
}
