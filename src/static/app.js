document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");

  // Search and filter elements
  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");

  // Authentication elements
  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  // Announcements elements
  const announcementBanner = document.getElementById("announcement-banner");
  const announcementMessage = document.getElementById("announcement-message");
  const announcementIndicators = document.getElementById("announcement-indicators");
  const manageAnnouncementsButton = document.getElementById(
    "manage-announcements-button"
  );
  const announcementsModal = document.getElementById("announcements-modal");
  const closeAnnouncementsModal = document.querySelector(
    ".close-announcements-modal"
  );
  const announcementsList = document.getElementById("announcements-list");
  const announcementsMessage = document.getElementById("announcements-message");
  const announcementForm = document.getElementById("announcement-form");
  const announcementIdInput = document.getElementById("announcement-id");
  const announcementMessageInput = document.getElementById(
    "announcement-message-input"
  );
  const announcementStartDateInput = document.getElementById(
    "announcement-start-date"
  );
  const announcementExpiresAtInput = document.getElementById(
    "announcement-expires-at"
  );
  const announcementCancelEditButton = document.getElementById(
    "announcement-cancel-edit"
  );
  const announcementSaveButton = document.getElementById(
    "announcement-save-button"
  );

  // Activity categories with corresponding colors
  const activityTypes = {
    sports: { label: "Esportes", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Artes", color: "#f3e5f5", textColor: "#7b1fa2" },
    academic: { label: "Acadêmico", color: "#e3f2fd", textColor: "#1565c0" },
    community: { label: "Comunidade", color: "#fff3e0", textColor: "#e65100" },
    technology: { label: "Tecnologia", color: "#e8eaf6", textColor: "#3949ab" },
  };

  // State for activities and filters
  let allActivities = {};
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";

  // Authentication state
  let currentUser = null;

  // Announcements state
  let activeAnnouncements = [];
  let allAnnouncements = [];
  let currentAnnouncementIndex = 0;
  let announcementRotationTimer = null;

  // Time range mappings for the dropdown
  const timeRanges = {
    morning: { start: "06:00", end: "08:00" }, // Antes das aulas
    afternoon: { start: "15:00", end: "18:00" }, // Após as aulas
    weekend: { days: ["Saturday", "Sunday"] }, // Final de semana
  };

  // Initialize filters from active elements
  function initializeFilters() {
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "Sem data";
    }

    return new Date(`${dateString}T00:00:00`).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function getAnnouncementStatus(announcement) {
    const today = new Date().toISOString().slice(0, 10);

    if (announcement.expires_at < today) {
      return { label: "Expirado", className: "status-expired" };
    }

    if (announcement.start_date && announcement.start_date > today) {
      return { label: "Agendado", className: "status-scheduled" };
    }

    return { label: "Ativo", className: "status-active" };
  }

  function renderAnnouncementBanner() {
    clearInterval(announcementRotationTimer);

    if (activeAnnouncements.length === 0) {
      announcementBanner.classList.add("hidden");
      announcementMessage.textContent = "";
      announcementIndicators.innerHTML = "";
      return;
    }

    if (currentAnnouncementIndex >= activeAnnouncements.length) {
      currentAnnouncementIndex = 0;
    }

    const currentAnnouncement = activeAnnouncements[currentAnnouncementIndex];
    announcementMessage.textContent = currentAnnouncement.message;

    announcementIndicators.innerHTML = activeAnnouncements
      .map(
        (_, index) =>
          `<button type="button" class="announcement-dot ${
            index === currentAnnouncementIndex ? "active" : ""
          }" data-index="${index}" aria-label="Ver anúncio ${index + 1}"></button>`
      )
      .join("");

    announcementIndicators.querySelectorAll(".announcement-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        currentAnnouncementIndex = Number(dot.dataset.index);
        renderAnnouncementBanner();
      });
    });

    announcementBanner.classList.remove("hidden");

    if (activeAnnouncements.length > 1) {
      announcementRotationTimer = setInterval(() => {
        currentAnnouncementIndex =
          (currentAnnouncementIndex + 1) % activeAnnouncements.length;
        renderAnnouncementBanner();
      }, 6000);
    }
  }

  async function fetchActiveAnnouncements() {
    try {
      const response = await fetch("/announcements/active");
      if (!response.ok) {
        throw new Error("Falha ao carregar anúncios ativos");
      }

      activeAnnouncements = await response.json();
      renderAnnouncementBanner();
    } catch (error) {
      clearInterval(announcementRotationTimer);
      announcementRotationTimer = null;
      activeAnnouncements = [];
      currentAnnouncementIndex = 0;
      renderAnnouncementBanner();
      console.error("Erro ao carregar anúncios ativos:", error);
    }
  }

  // Function to set day filter
  function setDayFilter(day) {
    currentDay = day;

    dayFilters.forEach((btn) => {
      if (btn.dataset.day === day) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Function to set time range filter
  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;

    timeFilters.forEach((btn) => {
      if (btn.dataset.time === timeRange) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Check if user is already logged in (from localStorage)
  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        validateUserSession(currentUser.username);
      } catch (error) {
        console.error("Error parsing saved user", error);
        logout();
      }
    }

    updateAuthBodyClass();
  }

  // Validate user session with the server
  async function validateUserSession(username) {
    try {
      const response = await fetch(
        `/auth/check-session?username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        logout();
        return;
      }

      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  // Update UI based on authentication state
  function updateAuthUI() {
    if (currentUser) {
      loginButton.classList.add("hidden");
      userInfo.classList.remove("hidden");
      displayName.textContent = currentUser.display_name;
      manageAnnouncementsButton.classList.remove("hidden");
    } else {
      loginButton.classList.remove("hidden");
      userInfo.classList.add("hidden");
      displayName.textContent = "";
      manageAnnouncementsButton.classList.add("hidden");
      closeAnnouncementsModalHandler();
    }

    updateAuthBodyClass();
    fetchActivities();
  }

  // Update body class for CSS targeting
  function updateAuthBodyClass() {
    if (currentUser) {
      document.body.classList.remove("not-authenticated");
    } else {
      document.body.classList.add("not-authenticated");
    }
  }

  // Login function
  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showLoginMessage(data.detail || "Usuário ou senha inválidos", "error");
        return false;
      }

      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Bem-vindo, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Falha no login. Por favor, tente novamente.", "error");
      return false;
    }
  }

  // Logout function
  function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    updateAuthUI();
    showMessage("Você saiu da conta.", "info");
  }

  // Show message in login modal
  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  // Open login modal
  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  // Close login modal
  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 300);
  }

  function showAnnouncementsMessage(text, type) {
    announcementsMessage.textContent = text;
    announcementsMessage.className = `message ${type}`;
    announcementsMessage.classList.remove("hidden");
  }

  function resetAnnouncementForm() {
    announcementForm.reset();
    announcementIdInput.value = "";
    announcementCancelEditButton.classList.add("hidden");
    announcementSaveButton.textContent = "Salvar anúncio";
  }

  function populateAnnouncementForm(announcement) {
    announcementIdInput.value = announcement.id;
    announcementMessageInput.value = announcement.message;
    announcementStartDateInput.value = announcement.start_date || "";
    announcementExpiresAtInput.value = announcement.expires_at;
    announcementCancelEditButton.classList.remove("hidden");
    announcementSaveButton.textContent = "Atualizar anúncio";
    announcementMessageInput.focus();
  }

  async function fetchAllAnnouncements() {
    const response = await fetch(
      `/announcements?teacher_username=${encodeURIComponent(currentUser.username)}`
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Falha ao buscar anúncios");
    }

    allAnnouncements = data;
  }

  function renderAnnouncementsList() {
    if (allAnnouncements.length === 0) {
      announcementsList.innerHTML =
        '<p class="empty-announcements">Nenhum anúncio cadastrado até o momento.</p>';
      return;
    }

    announcementsList.innerHTML = allAnnouncements
      .map((announcement) => {
        const status = getAnnouncementStatus(announcement);

        return `
          <article class="announcement-item">
            <header>
              <span class="announcement-status ${status.className}">${status.label}</span>
              <div class="announcement-item-actions">
                <button type="button" class="secondary-action edit-announcement" data-id="${announcement.id}">Editar</button>
                <button type="button" class="danger-action delete-announcement" data-id="${announcement.id}">Excluir</button>
              </div>
            </header>
            <p>${escapeHtml(announcement.message)}</p>
            <div class="announcement-item-dates">
              <span>Início: ${announcement.start_date ? formatDate(announcement.start_date) : "Imediato"}</span>
              <span>Expira em: ${formatDate(announcement.expires_at)}</span>
            </div>
          </article>
        `;
      })
      .join("");

    announcementsList.querySelectorAll(".edit-announcement").forEach((button) => {
      button.addEventListener("click", () => {
        const announcement = allAnnouncements.find(
          (item) => item.id === button.dataset.id
        );

        if (announcement) {
          populateAnnouncementForm(announcement);
        }
      });
    });

    announcementsList
      .querySelectorAll(".delete-announcement")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const announcement = allAnnouncements.find(
            (item) => item.id === button.dataset.id
          );

          if (!announcement) {
            return;
          }

          showConfirmationDialog(
            `Tem certeza que deseja excluir este anúncio?\n\n"${announcement.message}"`,
            async () => {
              try {
                const response = await fetch(
                  `/announcements/${encodeURIComponent(
                    announcement.id
                  )}?teacher_username=${encodeURIComponent(
                    currentUser.username
                  )}`,
                  {
                    method: "DELETE",
                  }
                );

                const data = await response.json();
                if (!response.ok) {
                  throw new Error(data.detail || "Erro ao excluir anúncio");
                }

                showAnnouncementsMessage("Anúncio excluído com sucesso.", "success");
                resetAnnouncementForm();
                await refreshAnnouncementsManager();
                fetchActiveAnnouncements();
              } catch (error) {
                showAnnouncementsMessage(error.message, "error");
              }
            }
          );
        });
      });
  }

  async function refreshAnnouncementsManager() {
    announcementsList.innerHTML =
      '<p class="empty-announcements">Carregando anúncios...</p>';

    try {
      await fetchAllAnnouncements();
      renderAnnouncementsList();
    } catch (error) {
      showAnnouncementsMessage(error.message, "error");
      announcementsList.innerHTML =
        '<p class="empty-announcements">Falha ao carregar anúncios.</p>';
    }
  }

  function openAnnouncementsModal() {
    if (!currentUser) {
      showMessage("Faça login para gerenciar anúncios.", "error");
      return;
    }

    announcementsMessage.classList.add("hidden");
    resetAnnouncementForm();
    announcementsModal.classList.remove("hidden");
    setTimeout(() => {
      announcementsModal.classList.add("show");
    }, 10);
    refreshAnnouncementsManager();
  }

  function closeAnnouncementsModalHandler() {
    announcementsModal.classList.remove("show");
    setTimeout(() => {
      announcementsModal.classList.add("hidden");
      resetAnnouncementForm();
      announcementsMessage.classList.add("hidden");
    }, 300);
  }

  // Event listeners for authentication and announcements
  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", logout);
  closeLoginModal.addEventListener("click", closeLoginModalHandler);
  closeAnnouncementsModal.addEventListener("click", closeAnnouncementsModalHandler);
  announcementCancelEditButton.addEventListener("click", resetAnnouncementForm);
  manageAnnouncementsButton.addEventListener("click", openAnnouncementsModal);

  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }

    if (event.target === announcementsModal) {
      closeAnnouncementsModalHandler();
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  // Handle announcements form submission
  announcementForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      showAnnouncementsMessage("Faça login para gerenciar anúncios.", "error");
      return;
    }

    const payload = {
      message: announcementMessageInput.value.trim(),
      start_date: announcementStartDateInput.value || null,
      expires_at: announcementExpiresAtInput.value,
    };

    if (!payload.message) {
      showAnnouncementsMessage("A mensagem do anúncio é obrigatória.", "error");
      return;
    }

    if (!payload.expires_at) {
      showAnnouncementsMessage("A data de expiração é obrigatória.", "error");
      return;
    }

    if (payload.start_date && payload.expires_at < payload.start_date) {
      showAnnouncementsMessage(
        "A data de expiração deve ser igual ou posterior à data de início.",
        "error"
      );
      return;
    }

    const isEditing = Boolean(announcementIdInput.value);
    const endpoint = isEditing
      ? `/announcements/${encodeURIComponent(
          announcementIdInput.value
        )}?teacher_username=${encodeURIComponent(currentUser.username)}`
      : `/announcements?teacher_username=${encodeURIComponent(currentUser.username)}`;

    try {
      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Falha ao salvar anúncio");
      }

      showAnnouncementsMessage(
        isEditing
          ? "Anúncio atualizado com sucesso."
          : "Anúncio criado com sucesso.",
        "success"
      );
      resetAnnouncementForm();
      await refreshAnnouncementsManager();
      fetchActiveAnnouncements();
    } catch (error) {
      showAnnouncementsMessage(error.message, "error");
    }
  });

  // Show loading skeletons
  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";

    for (let i = 0; i < 9; i++) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  // Format schedule for display - handles both old and new format
  function formatSchedule(details) {
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");

      const formatTime = (time24) => {
        const [hours, minutes] = time24.split(":").map((num) => parseInt(num));
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
      };

      const startTime = formatTime(details.schedule_details.start_time);
      const endTime = formatTime(details.schedule_details.end_time);

      return `${days}, ${startTime} - ${endTime}`;
    }

    return details.schedule;
  }

  // Função para determinar o tipo de atividade (idealmente viria do backend)
  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();

    if (
      name.includes("futebol") ||
      name.includes("basquete") ||
      name.includes("esporte") ||
      name.includes("fitness") ||
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      desc.includes("time") ||
      desc.includes("jogo") ||
      desc.includes("game") ||
      desc.includes("atlético") ||
      desc.includes("athletic")
    ) {
      return "sports";
    }

    if (
      name.includes("arte") ||
      name.includes("art") ||
      name.includes("música") ||
      name.includes("music") ||
      name.includes("teatro") ||
      name.includes("theater") ||
      name.includes("drama") ||
      desc.includes("criativo") ||
      desc.includes("creative") ||
      desc.includes("pintura") ||
      desc.includes("paint")
    ) {
      return "arts";
    }

    if (
      name.includes("ciência") ||
      name.includes("science") ||
      name.includes("matemática") ||
      name.includes("math") ||
      name.includes("acadêmico") ||
      name.includes("academic") ||
      name.includes("estudo") ||
      name.includes("study") ||
      name.includes("olimpíada") ||
      name.includes("olympiad") ||
      desc.includes("aprendizagem") ||
      desc.includes("learning") ||
      desc.includes("educação") ||
      desc.includes("education") ||
      desc.includes("competição") ||
      desc.includes("competition")
    ) {
      return "academic";
    }

    if (
      name.includes("voluntário") ||
      name.includes("volunteer") ||
      name.includes("comunidade") ||
      name.includes("community") ||
      desc.includes("serviço") ||
      desc.includes("service") ||
      desc.includes("voluntário") ||
      desc.includes("volunteer")
    ) {
      return "community";
    }

    if (
      name.includes("computador") ||
      name.includes("computer") ||
      name.includes("programação") ||
      name.includes("coding") ||
      name.includes("tecnologia") ||
      name.includes("tech") ||
      name.includes("robótica") ||
      name.includes("robotics") ||
      desc.includes("programação") ||
      desc.includes("programming") ||
      desc.includes("tecnologia") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robô") ||
      desc.includes("robot")
    ) {
      return "technology";
    }

    return "academic";
  }

  // Function to fetch activities from API with optional day and time filters
  async function fetchActivities() {
    showLoadingSkeletons();

    try {
      let queryParams = [];

      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      if (currentTimeRange) {
        const range = timeRanges[currentTimeRange];

        if (currentTimeRange !== "weekend" && range) {
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      const activities = await response.json();

      allActivities = activities;
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Falha ao carregar atividades. Por favor, tente novamente mais tarde.</p>";
      console.error("Erro ao buscar atividades:", error);
    }
  }

  // Function to display filtered activities
  function displayFilteredActivities() {
    activitiesList.innerHTML = "";

    let filteredActivities = {};

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);

      if (currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      if (currentTimeRange === "weekend" && details.schedule_details) {
        const activityDays = details.schedule_details.days;
        const isWeekendActivity = activityDays.some((day) =>
          timeRanges.weekend.days.includes(day)
        );

        if (!isWeekendActivity) {
          return;
        }
      }

      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");

      if (searchQuery && !searchableContent.includes(searchQuery.toLowerCase())) {
        return;
      }

      filteredActivities[name] = details;
    });

    if (Object.keys(filteredActivities).length === 0) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>Nenhuma atividade encontrada</h4>
          <p>Tente ajustar sua busca ou filtros</p>
        </div>
      `;
      return;
    }

    Object.entries(filteredActivities).forEach(([name, details]) => {
      renderActivityCard(name, details);
    });
  }

  // Function to render a single activity card
  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];
    const formattedSchedule = formatSchedule(details);

    const tagHtml = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
    `;

    const capacityIndicator = `
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} inscritos</span>
          <span>${spotsLeft} vagas restantes</span>
        </div>
      </div>
    `;

    activityCard.innerHTML = `
      ${tagHtml}
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p class="tooltip">
        <strong>Horário:</strong> ${formattedSchedule}
        <span class="tooltip-text">Encontros regulares neste horário durante o semestre</span>
      </p>
      ${capacityIndicator}
      <div class="participants-list">
        <h5>Participantes atuais:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${email}
              ${
                currentUser
                  ? `
                <span class="delete-participant tooltip" data-activity="${name}" data-email="${email}">
                  ✖
                  <span class="tooltip-text">Remover este estudante</span>
                </span>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `
          <button class="register-button" data-activity="${name}" ${
                isFull ? "disabled" : ""
              }>
            ${isFull ? "Atividade Lotada" : "Registrar Estudante"}
          </button>
        `
            : `
          <div class="auth-notice">
            Apenas professores podem registrar estudantes.
          </div>
        `
        }
      </div>
    `;

    const deleteButtons = activityCard.querySelectorAll(".delete-participant");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    if (currentUser) {
      const registerButton = activityCard.querySelector(".register-button");
      if (!isFull) {
        registerButton.addEventListener("click", () => {
          openRegistrationModal(name);
        });
      }
    }

    activitiesList.appendChild(activityCard);
  }

  // Event listeners for search and filter
  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      categoryFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      dayFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  // Open registration modal
  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  // Close registration modal
  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 300);
  }

  closeRegistrationModal.addEventListener("click", closeRegistrationModalHandler);

  window.addEventListener("click", (event) => {
    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }
  });

  // Create and show confirmation dialog
  function showConfirmationDialog(message, confirmCallback) {
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirmar Ação</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="cancel-btn">Cancelar</button>
            <button id="confirm-button" class="confirm-btn">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      const cancelBtn = confirmDialog.querySelector("#cancel-button");
      const confirmBtn = confirmDialog.querySelector("#confirm-button");

      cancelBtn.style.backgroundColor = "#f1f1f1";
      cancelBtn.style.color = "#333";

      confirmBtn.style.backgroundColor = "#dc3545";
      confirmBtn.style.color = "white";
    }

    const confirmMessage = document.getElementById("confirm-message");
    confirmMessage.textContent = message;

    confirmDialog.classList.remove("hidden");
    setTimeout(() => {
      confirmDialog.classList.add("show");
    }, 10);

    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");

    const newCancelButton = cancelButton.cloneNode(true);
    const newConfirmButton = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    newCancelButton.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    newConfirmButton.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    confirmDialog.addEventListener("click", (event) => {
      if (event.target === confirmDialog) {
        confirmDialog.classList.remove("show");
        setTimeout(() => {
          confirmDialog.classList.add("hidden");
        }, 300);
      }
    });
  }

  // Handle unregistration with confirmation
  async function handleUnregister(event) {
    if (!currentUser) {
      showMessage(
        "Você precisa estar logado como professor para remover estudantes.",
        "error"
      );
      return;
    }

    const activity = event.target.dataset.activity;
    const email = event.target.dataset.email;

    showConfirmationDialog(
      `Tem certeza que deseja remover ${email} da atividade ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(
              activity
            )}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            {
              method: "POST",
            }
          );

          const result = await response.json();

          if (response.ok) {
            showMessage(result.message, "success");
            fetchActivities();
          } else {
            showMessage(result.detail || "Ocorreu um erro", "error");
          }
        } catch (error) {
          showMessage(
            "Falha ao remover estudante. Por favor, tente novamente.",
            "error"
          );
          console.error("Erro ao remover estudante:", error);
        }
      }
    );
  }

  // Show message function
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      showMessage(
        "Você precisa estar logado como professor para registrar estudantes.",
        "error"
      );
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        fetchActivities();
      } else {
        showMessage(result.detail || "Ocorreu um erro", "error");
      }
    } catch (error) {
      showMessage("Falha ao registrar estudante. Por favor, tente novamente.", "error");
      console.error("Erro ao registrar estudante:", error);
    }
  });

  // Expose filter functions to window for future UI control
  window.activityFilters = {
    setDayFilter,
    setTimeRangeFilter,
  };

  // Initialize app
  checkAuthentication();
  initializeFilters();
  fetchActiveAnnouncements();
  fetchActivities();
});
