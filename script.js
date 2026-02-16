// API Configuration
const API_BASE_URL = "http://localhost:3000/api";

// State Management
let currentUser = null;
let authToken = localStorage.getItem("authToken");
let favorites = new Set();
let activeFilter = "all";
let currentListings = [];
let subscriptionPlans = [];

// DOM Elements
const resultsList = document.getElementById("results-list");
const resultsCount = document.getElementById("results-count");
const sortSelect = document.getElementById("sort-select");
const searchButton = document.getElementById("search-button");
const locationInput = document.getElementById("location");
const filterChips = document.querySelectorAll(".chip--filter");
const headerProfile = document.querySelector(".header__profile");
const headerHostBtn = document.querySelector(".header__host-btn");

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Ошибка запроса");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// Authentication Functions
async function checkAuth() {
  if (!authToken) return false;

  try {
    const data = await apiRequest("/auth/me");
    currentUser = data;
    updateUIForAuth();
    return true;
  } catch (error) {
    localStorage.removeItem("authToken");
    authToken = null;
    return false;
  }
}

async function login(email, password) {
  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem("authToken", authToken);
    updateUIForAuth();
    closeModal("auth-modal");
    showNotification("Успешный вход!", "success");
    return data;
  } catch (error) {
    showNotification(error.message, "error");
    throw error;
  }
}

async function register(name, email, password) {
  try {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem("authToken", authToken);
    updateUIForAuth();
    closeModal("auth-modal");
    showNotification("Регистрация успешна!", "success");
    return data;
  } catch (error) {
    showNotification(error.message, "error");
    throw error;
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem("authToken");
  updateUIForAuth();
  showNotification("Вы вышли из системы", "success");
}

// Subscription Functions
async function loadSubscriptionPlans() {
  try {
    const data = await apiRequest("/subscriptions/plans");
    subscriptionPlans = data;
    return data;
  } catch (error) {
    console.error("Error loading subscription plans:", error);
    return [];
  }
}

async function getMySubscription() {
  if (!authToken) return null;
  try {
    const data = await apiRequest("/subscriptions/my");
    return data.subscription;
  } catch (error) {
    return null;
  }
}

async function subscribe(planId) {
  try {
    const data = await apiRequest("/subscriptions/subscribe", {
      method: "POST",
      body: JSON.stringify({ planId }),
    });
    showNotification("Подписка успешно активирована!", "success");
    closeModal("subscription-modal");
    return data;
  } catch (error) {
    showNotification(error.message, "error");
    throw error;
  }
}

// Property Functions
async function loadProperties() {
  try {
    const data = await apiRequest("/properties");
    currentListings = data;
    return data;
  } catch (error) {
    console.error("Error loading properties:", error);
    return [];
  }
}

async function createProperty(propertyData) {
  try {
    const data = await apiRequest("/properties", {
      method: "POST",
      body: JSON.stringify(propertyData),
    });
    showNotification("Объект успешно создан!", "success");
    closeModal("property-modal");
    await loadProperties();
    applyFilter();
    return data;
  } catch (error) {
    showNotification(error.message, "error");
    throw error;
  }
}

// Booking Functions
async function createBooking(propertyId, checkIn, checkOut, guests) {
  try {
    const data = await apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify({
        propertyId,
        checkIn,
        checkOut,
        guests,
      }),
    });
    showNotification("Бронирование создано!", "success");
    closeModal("booking-modal");
    return data;
  } catch (error) {
    showNotification(error.message, "error");
    throw error;
  }
}

// UI Helper Functions
function formatPrice(price) {
  return `$${price.toLocaleString("en-US")}`;
}

function getPlural(count, forms) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

function renderListings(listings) {
  resultsList.innerHTML = "";

  if (listings.length === 0) {
    resultsList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <p style="font-size: 18px; color: var(--color-text-light);">
          Объекты не найдены. Попробуйте изменить параметры поиска.
        </p>
      </div>
    `;
    resultsCount.textContent = "Подходящих вариантов не найдено";
    return;
  }

  listings.forEach((listing) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = listing.id;

    card.innerHTML = `
      <div class="card__image">
        <div class="card__image-overlay"></div>
        <div class="card__badge">
          ${listing.premium ? "Премиум" : "Популярное"}
        </div>
        <button
          class="card__favorite ${favorites.has(listing.id) ? "card__favorite--active" : ""}"
          aria-label="Добавить в избранное"
          data-favorite-id="${listing.id}"
        >
          ${favorites.has(listing.id) ? "♥" : "♡"}
        </button>
      </div>
      <div class="card__meta">
        <h3 class="card__title">${listing.title}</h3>
        <div class="card__location">${listing.location}</div>
        <div class="card__bottom-row">
          <div class="card__price">
            ${formatPrice(listing.price)} <span>/ ночь</span>
          </div>
          <div class="card__rating">
            <span class="card__rating-star">★</span>
            <span>${(listing.rating || 0).toFixed(1)}</span>
            <span>(${listing.reviews || 0})</span>
          </div>
        </div>
        <div class="card__tags">
          ${
            listing.instant
              ? '<span class="card__tag card__tag--accent">Мгновенное бронирование</span>'
              : ""
          }
          ${
            listing.type === "house"
              ? '<span class="card__tag">Дом целиком</span>'
              : '<span class="card__tag">Квартира</span>'
          }
          ${(listing.amenities || []).slice(0, 2).map((tag) => `<span class="card__tag">${tag}</span>`).join("")}
        </div>
        ${currentUser ? `<button class="card__book-btn" data-property-id="${listing.id}">Забронировать</button>` : ""}
      </div>
    `;

    resultsList.appendChild(card);
  });

  const countText = `Найдено ${listings.length} ${getPlural(listings.length, [
    "вариант",
    "варианта",
    "вариантов",
  ])}`;

  resultsCount.textContent = countText;
}

function sortListings(listings, sort) {
  const sorted = [...listings];

  if (sort === "price-asc") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    sorted.sort((a, b) => b.price - a.price);
  } else if (sort === "rating-desc") {
    sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else {
    sorted.sort((a, b) => (b.rating || 0) * (b.reviews || 0) - (a.rating || 0) * (a.reviews || 0));
  }

  return sorted;
}

function applyFilter() {
  let filtered = [...currentListings];

  if (activeFilter === "apartment") {
    filtered = filtered.filter((item) => item.type === "apartment");
  } else if (activeFilter === "house") {
    filtered = filtered.filter((item) => item.type === "house");
  } else if (activeFilter === "luxury") {
    filtered = filtered.filter((item) => item.premium);
  } else if (activeFilter === "instant") {
    filtered = filtered.filter((item) => item.instant);
  }

  const locationQuery = locationInput.value.trim().toLowerCase();
  if (locationQuery) {
    filtered = filtered.filter(
      (item) =>
        item.location.toLowerCase().includes(locationQuery) ||
        item.title.toLowerCase().includes(locationQuery)
    );
  }

  const sorted = sortListings(filtered, sortSelect.value);
  renderListings(sorted);
}

function handleFavoriteToggle(event) {
  const button = event.target.closest("[data-favorite-id]");
  if (!button) return;

  const id = button.dataset.favoriteId;
  if (favorites.has(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }

  applyFilter();
}

function updateUIForAuth() {
  if (currentUser) {
    headerProfile.innerHTML = `
      <span class="header__profile-icon">${currentUser.name.charAt(0).toUpperCase()}</span>
    `;
    headerProfile.setAttribute("title", currentUser.name);
  } else {
    headerProfile.innerHTML = `<span class="header__profile-icon">👤</span>`;
    headerProfile.removeAttribute("title");
  }
}

// Modal Functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("modal--active");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("modal--active");
  }
}

function showNotification(message, type = "info") {
  // Simple notification - можно улучшить
  const notification = document.createElement("div");
  notification.className = `notification notification--${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === "success" ? "#00a699" : type === "error" ? "#ff385c" : "#222"};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Event Handlers
function attachEvents() {
  // Filter chips
  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filterChips.forEach((c) => c.classList.remove("chip--active"));
      chip.classList.add("chip--active");
      activeFilter = chip.dataset.filter || "all";
      applyFilter();
    });
  });

  // Sort select
  sortSelect.addEventListener("change", () => {
    applyFilter();
  });

  // Search button
  searchButton.addEventListener("click", () => {
    applyFilter();
  });

  // Location input
  locationInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      applyFilter();
    }
  });

  // Favorites toggle
  resultsList.addEventListener("click", handleFavoriteToggle);

  // Profile button
  headerProfile.addEventListener("click", () => {
    if (currentUser) {
      showModal("profile-modal");
    } else {
      showModal("auth-modal");
    }
  });

  // Host button
  headerHostBtn.addEventListener("click", async () => {
    if (!currentUser) {
      showModal("auth-modal");
      return;
    }

    const subscription = await getMySubscription();
    if (!subscription || subscription.status !== "active") {
      showModal("subscription-modal");
    } else {
      showModal("property-modal");
    }
  });

  // Booking buttons
  resultsList.addEventListener("click", async (e) => {
    const bookBtn = e.target.closest(".card__book-btn");
    if (bookBtn) {
      if (!currentUser) {
        showModal("auth-modal");
        return;
      }
      const propertyId = bookBtn.dataset.propertyId;
      showModal("booking-modal");
      document.getElementById("booking-property-id").value = propertyId;
    }
  });

  // Modal close buttons
  document.querySelectorAll(".modal__close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      if (modal) {
        modal.classList.remove("modal--active");
      }
    });
  });

  // Auth form
  const authForm = document.getElementById("auth-form");
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(authForm);
      const isLogin = authForm.dataset.mode === "login";

      if (isLogin) {
        await login(formData.get("email"), formData.get("password"));
      } else {
        await register(formData.get("name"), formData.get("email"), formData.get("password"));
      }
    });
  }

  // Auth mode toggle
  const authModeToggle = document.getElementById("auth-mode-toggle");
  if (authModeToggle) {
    authModeToggle.addEventListener("click", () => {
      const authForm = document.getElementById("auth-form");
      const isLogin = authForm.dataset.mode === "login";
      authForm.dataset.mode = isLogin ? "register" : "login";
      document.getElementById("auth-title").textContent = isLogin ? "Регистрация" : "Вход";
      document.getElementById("auth-submit").textContent = isLogin ? "Зарегистрироваться" : "Войти";
      authModeToggle.textContent = isLogin ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться";
    });
  }

  // Property form
  const propertyForm = document.getElementById("property-form");
  if (propertyForm) {
    propertyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(propertyForm);
      await createProperty({
        title: formData.get("title"),
        description: formData.get("description"),
        location: formData.get("location"),
        price: formData.get("price"),
        type: formData.get("type"),
        bedrooms: formData.get("bedrooms"),
        bathrooms: formData.get("bathrooms"),
        guests: formData.get("guests"),
        amenities: formData.get("amenities").split(",").map((s) => s.trim()).filter(Boolean),
        instant: formData.get("instant") === "on",
      });
    });
  }

  // Booking form
  const bookingForm = document.getElementById("booking-form");
  if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(bookingForm);
      await createBooking(
        formData.get("propertyId"),
        formData.get("checkIn"),
        formData.get("checkOut"),
        formData.get("guests")
      );
    });
  }

  // Subscription buttons
  document.querySelectorAll(".subscription-plan").forEach((plan) => {
    plan.addEventListener("click", async () => {
      if (!currentUser) {
        showModal("auth-modal");
        return;
      }
      const planId = plan.dataset.planId;
      await subscribe(planId);
    });
  });
}

// Make functions available globally for inline scripts
window.showModal = showModal;
window.closeModal = closeModal;
window.logout = logout;
window.getMySubscription = getMySubscription;
window.loadSubscriptionPlans = loadSubscriptionPlans;

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  await loadSubscriptionPlans();
  await loadProperties();
  applyFilter();
  attachEvents();
  
  // Update profile modal if user is logged in
  if (currentUser) {
    updateProfileModal();
  }
});

// Update profile modal function
async function updateProfileModal() {
  if (!currentUser) return;
  const nameEl = document.getElementById("profile-name");
  const emailEl = document.getElementById("profile-email");
  const subDiv = document.getElementById("profile-subscription");
  
  if (nameEl) nameEl.textContent = currentUser.name;
  if (emailEl) emailEl.textContent = currentUser.email;
  
  if (subDiv) {
    const subscription = await getMySubscription();
    if (subscription && subscription.status === "active") {
      const expiresAt = new Date(subscription.expiresAt);
      subDiv.innerHTML = `
        <p><strong>Подписка:</strong> <span class="subscription-badge">Активна</span></p>
        <p><strong>План:</strong> ${subscription.planId}</p>
        <p><strong>Действует до:</strong> ${expiresAt.toLocaleDateString("ru-RU")}</p>
      `;
    } else {
      subDiv.innerHTML = `
        <p><strong>Подписка:</strong> <span class="subscription-badge subscription-badge--expired">Неактивна</span></p>
        <p>Для размещения объектов необходима активная подписка.</p>
      `;
    }
  }
}

// Load subscription plans UI
async function loadSubscriptionPlansUI() {
  const plans = await loadSubscriptionPlans();
  const container = document.getElementById("subscription-plans");
  if (!container) return;
  
  container.innerHTML = plans.map(plan => `
    <div class="subscription-plan" data-plan-id="${plan.id}" style="
      padding: 24px;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.2s;
    ">
      <h3 style="margin-bottom: 8px;">${plan.name}</h3>
      <div style="font-size: 32px; font-weight: 700; color: var(--color-primary); margin: 16px 0;">
        $${plan.price}<span style="font-size: 16px; font-weight: 400;">/месяц</span>
      </div>
      <ul style="list-style: none; padding: 0; margin: 16px 0;">
        ${plan.features.map(f => `<li style="padding: 8px 0; border-bottom: 1px solid var(--color-border);">✓ ${f}</li>`).join("")}
      </ul>
    </div>
  `).join("");
  
  // Attach click handlers
  container.querySelectorAll(".subscription-plan").forEach((plan) => {
    plan.addEventListener("click", async () => {
      if (!currentUser) {
        showModal("auth-modal");
        return;
      }
      const planId = plan.dataset.planId;
      await subscribe(planId);
      await updateProfileModal();
    });
  });
}

window.loadSubscriptionPlansUI = loadSubscriptionPlansUI;
window.updateProfileModal = updateProfileModal;
