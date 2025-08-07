'use strict'
document.addEventListener('DOMContentLoaded', function() {
    const authSection = document.getElementById('authSection');
    const adminSection = document.getElementById('adminSection');
    const authForm = document.getElementById('authForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    
    const authMessage = document.getElementById('authMessage');
    const logoutButton = document.getElementById('logoutButton');

    const addItemForm = document.getElementById('addItemForm');
    const itemNameInput = document.getElementById('itemName');
    const addItemMessage = document.getElementById('addItemMessage');
    const itemsList = document.getElementById('itemsList');

    const API_BASE_URL = '/api'; // Adjust if your server is on a different port/domain

    // --- Helper Functions ---
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }

    function getToken() {
        return localStorage.getItem('authToken');
    }

    function setToken(token) {
        localStorage.setItem('authToken', token);
    }

    function removeToken() {
        localStorage.removeItem('authToken');
    }

    // --- UI State Management ---
    function updateUI() {
        const token = getToken();
        if (token) {
            authSection.style.display = 'none';
            adminSection.style.display = 'block';
            fetchItems(); // Load items if authenticated
        } else {
            authSection.style.display = 'block';
            adminSection.style.display = 'none';
        }
    }

    // --- API Calls ---
    async function authRequest(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return response; // Return the full response object
        } catch (error) {
            console.error(`Error during ${endpoint}:`, error);
            showMessage(authMessage, `Network error during ${endpoint}.`, 'error');
            return null;
        }
    }

    async function protectedRequest(endpoint, method = 'GET', data = null) {
        const token = getToken();
        if (!token) {
            showMessage(addItemMessage, 'Not authenticated. Please log in.', 'error');
            updateUI(); // Redirect to login if no token
            return null;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const config = {
            method: method,
            headers: headers
        };
        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);

            if (response.status === 401 || response.status === 403) {
                removeToken(); // Token expired or invalid
                showMessage(addItemMessage, 'Session expired or unauthorized. Please log in again.', 'error');
                updateUI();
                return null;
            }
            return response;
        } catch (error) {
            console.error(`Error during ${endpoint} ${method}:`, error);
            showMessage(addItemMessage, `Network error during ${endpoint} ${method}.`, 'error');
            return null;
        }
    }

    async function fetchItems() {
        itemsList.innerHTML = 'Loading items...';
        const response = await protectedRequest('items', 'GET');
        if (response && response.ok) {
            const items = await response.json();
            itemsList.innerHTML = ''; // Clear loading message
            if (items.length === 0) {
                itemsList.innerHTML = '<li>No items found.</li>';
            } else {
                items.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${item.name}</span>
                        <button data-id="${item.id}">Delete</button>
                    `;
                    li.querySelector('button').addEventListener('click', deleteItem);
                    itemsList.appendChild(li);
                });
            }
        } else if (response) {
            const errorData = await response.json();
            showMessage(addItemMessage, `Failed to load items: ${errorData.message || response.statusText}`, 'error');
        }
    }

    async function addItem(event) {
        event.preventDefault();
        const itemName = itemNameInput.value.trim();
        if (!itemName) {
            showMessage(addItemMessage, 'Item name cannot be empty.', 'error');
            return;
        }

        const response = await protectedRequest('items', 'POST', { name: itemName });
        if (response && response.ok) {
            const data = await response.json();
            showMessage(addItemMessage, `Item "${data.name}" added successfully!`, 'success');
            itemNameInput.value = '';
            fetchItems(); // Refresh list
        } else if (response) {
            const errorData = await response.json();
            showMessage(addItemMessage, `Failed to add item: ${errorData.message || response.statusText}`, 'error');
        }
    }

    async function deleteItem(event) {
        const itemId = event.target.dataset.id;
        if (!confirm(`Are you sure you want to delete item ID ${itemId}?`)) {
            return;
        }

        const response = await protectedRequest(`items/${itemId}`, 'DELETE');
        if (response && response.ok) {
            const data = await response.json();
            showMessage(addItemMessage, data.message, 'success');
            fetchItems(); // Refresh list
        } else if (response) {
            const errorData = await response.json();
            showMessage(addItemMessage, `Failed to delete item: ${errorData.message || response.statusText}`, 'error');
        }
    }

    // --- Event Listeners ---
    authForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission
        // This form handles both login and register based on which button was clicked
    });

    loginBtn.addEventListener('click', async function() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const response = await authRequest('login', { username, password });

        if (response && response.ok) {
            const data = await response.json();
            setToken(data.token);
            showMessage(authMessage, data.message, 'success');
            usernameInput.value = '';
            passwordInput.value = '';
            updateUI();
        } else if (response) {
            const errorData = await response.json();
            showMessage(authMessage, errorData.message || 'Login failed.', 'error');
        }
    });

    logoutButton.addEventListener('click', function() {
        removeToken();
        showMessage(authMessage, 'Logged out successfully.', 'success');
        updateUI();
    });

    addItemForm.addEventListener('submit', addItem);

    // Initial UI update on page load
    updateUI();
});