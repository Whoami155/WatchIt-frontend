// ✅ dashboard.js — FINAL STABLE VERSION

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ dashboard.js loaded");

  loadUserProfile();
  loadWatchlist();
  loadMyReviews();
  setupProfilePicEvents();
  setupLogout();
});

/* ================= UTIL ================= */
const el = (id) => document.getElementById(id);

const safeHTML = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/* ================= PROFILE LOAD ================= */
function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const nameEl = el("userName");
  const emailEl = el("userEmail");
  const avatarEl = el("profilePic");
  const navAvatar = el("navProfilePic");

  if (!user) {
    nameEl.textContent = "Guest User";
    emailEl.textContent = "guest@example.com";
    avatarEl.src = "assets/profile/default-avatar.png";
    if (navAvatar) navAvatar.src = "assets/profile/default-avatar.png";
    return;
  }

  nameEl.textContent = user.name;
  emailEl.textContent = user.email;

  const pic = user.avatar || "assets/profile/default-avatar.png";

  avatarEl.src = pic;
  if (navAvatar) navAvatar.src = pic;
}

/* ================= PROFILE IMAGE CHANGE ================= */
function setupProfilePicEvents() {
  const changeBtn = el("changePicBtn");
  const uploadInput = el("uploadProfilePic");
  const avatarEl = el("profilePic");
  const navAvatar = el("navProfilePic");

  if (!changeBtn || !uploadInput || !avatarEl) return;

  changeBtn.addEventListener("click", () => uploadInput.click());

  uploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
      const imageUrl = ev.target.result;

      // ✅ Update UI
      avatarEl.src = imageUrl;
      if (navAvatar) navAvatar.src = imageUrl;

      // ✅ Update user object in localStorage
      let user = JSON.parse(localStorage.getItem("user"));
      user.avatar = imageUrl;
      localStorage.setItem("user", JSON.stringify(user));

      console.log("✅ Profile picture updated & saved");
    };

    reader.readAsDataURL(file);
  });
}

/* ================= WATCHLIST ================= */
async function loadWatchlist() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const container = el("watchlist");

  if (!container) return;

  if (!user || !user.watchlist || user.watchlist.length === 0) {
    container.innerHTML = `<p style="color:#999;">Your watchlist is empty 😢</p>`;
    return;
  }

  try {
    const res = await fetch("data/movies.json");
    const movies = await res.json();

    const watchMovies = movies.filter((m) => user.watchlist.includes(m.id));

    container.innerHTML = watchMovies
      .map(
        (m) => `
        <div class="movie-card" style="position:relative;width:140px;">
          <img src="${m.poster}" 
               onclick="location.href='movie.html?id=${m.id}'"
               style="width:100%;height:200px;border-radius:10px;object-fit:cover;">

          <h4 style="font-size:12px;text-align:center">${safeHTML(m.title)}</h4>

          <button onclick="removeFromWatchlist(${m.id})"
            style="position:absolute;top:6px;right:6px;background:#ff3434;
                   border:none;color:white;padding:4px 7px;border-radius:6px;">
            ✖
          </button>
        </div>`
      )
      .join("");
  } catch (err) {
    console.error("❌ loadWatchlist error:", err);
  }
}

async function removeFromWatchlist(movieId) {
  const token = localStorage.getItem("token");
  let user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token) return alert("Login required");

  try {
    const res = await fetch("https://watch-it-fr.onrender.com/api/user/watchlist", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ movieId }),
    });

    const data = await res.json();

    if (data.success) {
      user.watchlist = data.watchlist;
      localStorage.setItem("user", JSON.stringify(user));
      loadWatchlist();
    }
  } catch (err) {
    console.error("❌ removeFromWatchlist error:", err);
  }
}

/* ================= LOAD MY REVIEWS ================= */
async function loadMyReviews() {
  const token = localStorage.getItem("token");
  const container = el("myReviews");

  if (!container) return;

  if (!token) {
    container.innerHTML = "<p>Please login to see your reviews.</p>";
    return;
  }

  try {
    const res = await fetch("https://watch-it-fr.onrender.com/api/reviews/user/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const reviews = await res.json();

    if (!Array.isArray(reviews) || reviews.length === 0) {
      container.innerHTML = "<p style='color:#666;'>You haven't posted any reviews yet.</p>";
      return;
    }

    const movies = await (await fetch("data/movies.json")).json();
    const movieMap = Object.fromEntries(movies.map((m) => [m.id, m]));

    container.innerHTML = reviews
      .map((r) => {
        const m = movieMap[r.movieId] || {
          poster: "assets/default-movie.png",
          title: "Unknown",
        };

        return `
        <div class="review-card-enhanced">
          <img src="${m.poster}" class="review-poster">
          <div class="review-right">
            <h3>${safeHTML(m.title)}</h3>
            <p>⭐ ${r.rating}/5</p>
            <p>${safeHTML(r.text)}</p>
            <div class="review-actions">
              <button class="edit-btn" onclick="editReview('${r._id}', ${r.rating}, \`${safeHTML(
          r.text
        )}\`)">Edit</button>
              <button class="delete-btn" onclick="deleteReview('${r._id}')">Delete</button>
            </div>
          </div>
        </div>`;
      })
      .join("");
  } catch (err) {
    console.error("❌ loadMyReviews error:", err);
  }
}

/* ================= DELETE REVIEW ================= */
async function deleteReview(id) {
  const token = localStorage.getItem("token");
  if (!token) return alert("Login required");

  if (!confirm("Delete this review?")) return;

  try {
    await fetch(`https://watch-it-fr.onrender.com/api/reviews/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    loadMyReviews();
  } catch (err) {
    console.error("❌ deleteReview error:", err);
  }
}

/* ================= EDIT REVIEW ================= */
async function editReview(id, oldRating, oldText) {
  const token = localStorage.getItem("token");
  if (!token) return alert("Login required");

  const newText = prompt("Edit your review:", oldText);
  if (!newText) return;

  const newRating = Number(prompt("Rating 1–5:", oldRating));
  if (newRating < 1 || newRating > 5) return alert("Invalid rating");

  try {
    await fetch(`https://watch-it-fr.onrender.com/api/reviews/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: newText, rating: newRating }),
    });

    loadMyReviews();
  } catch (err) {
    console.error("❌ editReview error:", err);
  }
}

/* ================= LOGOUT ================= */
function setupLogout() {
  const btn = el("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
}





