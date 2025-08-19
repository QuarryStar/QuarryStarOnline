'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // DOM
  const authSection   = document.getElementById('authSection');
  const adminSection  = document.getElementById('adminSection');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn      = document.getElementById('loginBtn');
  const logoutButton  = document.getElementById('logoutButton');

  const addItemForm   = document.getElementById('addItemForm');
  const itemNameInput = document.getElementById('itemName');

  const authMessage   = document.getElementById('authMessage');
  const addItemMessage= document.getElementById('addItemMessage');
  const itemsList     = document.getElementById('itemsList');

  // helpers
  function showMessage(el, text, type='info') {
    if (!el) return;
    el.textContent = text;
    el.className = type; // style by [success|error|info]
  }

  async function isAuthed() {
    try {
      const r = await fetch('/api/me', { credentials: 'include' });
      return r.ok;
    } catch {
      return false;
    }
  }

  async function updateUI() {
    const ok = await isAuthed();
    if (ok) {
      authSection.style.display  = 'none';
      adminSection.style.display = 'block';
      await fetchItems();
    } else {
      authSection.style.display  = 'block';
      adminSection.style.display = 'none';
    }
  }

  // API wrappers (cookies!)
  async function apiPost(path, bodyObj) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(bodyObj || {})
    });
    return res;
  }

  async function apiGet(path) {
    const res = await fetch(path, {
      method: 'GET',
      credentials: 'include'
    });
    return res;
  }

  // login/logout
  loginBtn.addEventListener('click', async () => {
    const username = (usernameInput.value || '').trim();
    const password = (passwordInput.value || '').trim();

    if (!username || !password) {
      showMessage(authMessage, 'Enter username and password', 'error');
      return;
    }

    const r = await apiPost('/api/login', { username, password });
    if (r.ok) {
      showMessage(authMessage, 'Logged in', 'success');
      usernameInput.value = '';
      passwordInput.value = '';
      await updateUI();
    } else {
      const err = await r.json().catch(() => ({}));
      showMessage(authMessage, err.error || 'Login failed', 'error');
    }
  });

  logoutButton.addEventListener('click', async () => {
    await apiPost('/api/logout', {});
    showMessage(authMessage, 'Logged out', 'success');
    await updateUI();
  });

  // example protected calls
  async function fetchItems() {
    if (!itemsList) return;
    itemsList.innerHTML = '';
    const r = await apiGet('/api/items');      // <-- keep your existing endpoint
    if (r.status === 401) {
      showMessage(addItemMessage, 'Please log in.', 'error');
      await updateUI();
      return;
    }
    if (!r.ok) {
      showMessage(addItemMessage, 'Failed to load items.', 'error');
      return;
    }
    const items = await r.json();
    items.forEach(it => {
      const li = document.createElement('li');
      li.textContent = it.name || JSON.stringify(it);
      itemsList.appendChild(li);
    });
  }

  addItemForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (itemNameInput.value || '').trim();
    if (!name) return;

    const r = await apiPost('/api/items', { name }); // <-- your existing POST endpoint
    if (r.ok) {
      showMessage(addItemMessage, 'Added', 'success');
      itemNameInput.value = '';
      await fetchItems();
    } else if (r.status === 401) {
      showMessage(addItemMessage, 'Please log in.', 'error');
      await updateUI();
    } else {
      showMessage(addItemMessage, 'Add failed.', 'error');
    }
  });

  // boot
  updateUI();
});