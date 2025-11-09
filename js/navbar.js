function updateNavbarLogin() {
  const navLogin = document.getElementById("navLogin");
  const navLinks = document.querySelector(".nav-links");

  if (!navLogin || !navLinks) return;

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Remove old logout if exists (prevents duplicates)
  const oldLogout = document.getElementById("logoutNavBtn");
  if (oldLogout) oldLogout.remove();

  if (token && user) {
    // ✅ Change Login → Profile
    navLogin.textContent = `👤 ${user.name}`;
    navLogin.href = "dashboard.html";

    // ✅ Add a logout button next to it
    const logoutBtn = document.createElement("a");
    logoutBtn.id = "logoutNavBtn";
    logoutBtn.textContent = "Logout";
    logoutBtn.style.cursor = "pointer";

    logoutBtn.onclick = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "index.html";
    };

    navLinks.appendChild(logoutBtn);

  } else {
    // ✅ Show normal Login button
    navLogin.textContent = "Login";
    navLogin.href = "login.html";
  }
}

// Run on load
updateNavbarLogin();
