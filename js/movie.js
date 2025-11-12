// ✅ movie.js — FINAL STABLE VERSION (Render + Auto-Retry Reviews)

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
let selectedRating = 0;

if (!id) {
  document.addEventListener("DOMContentLoaded", () => {
    document.body.innerHTML =
      "<h2 style='color:white;text-align:center;'>❌ Movie not found!</h2>";
  });
} else {
  document.addEventListener("DOMContentLoaded", initPage);
}

async function initPage() {
  initStarRating();

  try {
    const movies = await safeFetchJSON("data/movies.json");
    if (!Array.isArray(movies)) return showFatal("⚠️ Could not load movies.");

    const movie = movies.find((m) => String(m.id) === String(id));
    if (!movie) return showFatal("⚠️ Movie not found!");

    renderMovieDetails(movie);
    renderCast(movie);
    renderSimilarMovies(movies, movie);
    initWatchlistButton(movie);

    // ✅ Load reviews with auto-retry after small delay
    setTimeout(() => loadReviews(0), 300);
  } catch (err) {
    console.error("❌ Error loading movie:", err);
    showFatal("Server Error 😢");
  }
}

/* ============================= HELPERS ============================= */

function showFatal(msg) {
  document.body.innerHTML = `<h2 style="color:white;text-align:center;">${msg}</h2>`;
}

async function safeFetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Fetch failed for ${url}: ${res.statusText}`);
  return res.json();
}

/* ============================= MOVIE DETAILS ============================= */

function renderMovieDetails(movie) {
  const backdrop = document.getElementById("movieBackdrop");
  if (backdrop) backdrop.style.backgroundImage = `url('${movie.backdrop || movie.poster}')`;

  document.getElementById("moviePoster").src = movie.poster;
  document.getElementById("movieTitle").textContent = movie.title || "Untitled";
  document.getElementById("movieYear").textContent = movie.year || "";
  document.getElementById("movieRelease").textContent = `Released: ${movie.released || "N/A"}`;
  document.getElementById("movieDescription").textContent = movie.description || "";
  document.getElementById("trailerFrame").src = `https://www.youtube.com/embed/${movie.trailer}`;
  document.getElementById("genreTags").innerHTML = movie.genre
    ? movie.genre.split(/[,/]/).map((g) => `<span>${g.trim()}</span>`).join("")
    : "";
}

/* ============================= CAST SECTION ============================= */

function renderCast(movie) {
  const container = document.getElementById("castList");
  if (!container) return;

  container.innerHTML = "";

  if (Array.isArray(movie.castDetail) && movie.castDetail.length) {
    container.innerHTML = movie.castDetail
      .map(
        (a) => `
      <div class="cast-card" onclick="location.href='actor.html?name=${encodeURIComponent(a.name)}&movieId=${movie.id}'">
        <img src="${a.photo}" alt="${a.name}">
        <p>${a.name}</p>
      </div>`
      )
      .join("");
  } else if (Array.isArray(movie.cast)) {
    container.innerHTML = movie.cast
      .map(
        (n) => `
      <div class="cast-card">
        <div style="width:90px;height:90px;border-radius:50%;background:#222;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;">?</div>
        <p>${n}</p>
      </div>`
      )
      .join("");
  } else {
    container.innerHTML = `<p style="color:#999;">No cast info.</p>`;
  }
}

/* ============================= SIMILAR MOVIES ============================= */

function renderSimilarMovies(all, movie) {
  const container = document.getElementById("similarMovies");
  if (!container) return;

  const genre = (movie.genre || "").split("/")[0].trim().toLowerCase();
  const similar = all
    .filter((m) => m.id !== movie.id && (m.genre || "").toLowerCase().includes(genre))
    .slice(0, 6);

  container.innerHTML = similar.length
    ? similar.map(
        (m) => `
      <div class="similar-card" onclick="location.href='movie.html?id=${m.id}'">
        <img src="${m.poster}" alt="${m.title}">
        <h4>${m.title}</h4>
      </div>`
      ).join("")
    : `<p style="color:#aaa;">No similar movies found.</p>`;
}

/* ============================= WATCHLIST ============================= */

function initWatchlistButton(movie) {
  const btn = document.getElementById("watchlistBtn");
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!btn) return;

  if (!token || !user) {
    btn.textContent = "⭐ Login to Save";
    btn.onclick = () => (window.location.href = "login.html");
    return;
  }

  if (user.watchlist?.includes(movie.id)) btn.textContent = "✅ In Watchlist";

  btn.onclick = async () => {
    try {
      const data = await safeFetchJSON("https://watch-it-fr.onrender.com/api/user/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId: movie.id }),
      });

      if (data?.success) {
        btn.textContent = "✅ Added!";
        user.watchlist = data.watchlist;
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (e) {
      console.error("Watchlist error:", e);
    }
  };
}

/* ============================= REVIEWS (AUTO RETRY) ============================= */

async function loadReviews(retryCount = 0) {
  const container = document.getElementById("userReviews");
  if (!container) return;

  try {
    const res = await fetch(`https://watch-it-fr.onrender.com/api/reviews/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Network error: ${res.status}`);

    const reviews = await res.json();

    if (!Array.isArray(reviews) || reviews.length === 0) {
      container.innerHTML = `<p style="color:#aaa;">No reviews yet.</p>`;
      return;
    }

    container.innerHTML = reviews
      .map(
        (r) => `
      <div class="review-item">
        <strong>${escapeHTML(r.userName || "User")}</strong>
        <span>⭐ ${r.rating}/5</span>
        <p>${escapeHTML(r.text)}</p>
        <small>${new Date(r.createdAt).toLocaleString()}</small>
      </div>`
      )
      .join("");
  } catch (err) {
    console.warn(`Review load failed (attempt ${retryCount + 1}):`, err);

    // 🧠 Auto-retry logic (5 attempts, 3s apart)
    if (retryCount < 5) {
      container.innerHTML = `<p style="color:#999;">⏳ Connecting to server... (Attempt ${
        retryCount + 1
      }/5)</p>`;
      setTimeout(() => loadReviews(retryCount + 1), 3000);
    } else {
      container.innerHTML = `<p style="color:#aaa;">⚠️ Couldn't load reviews. Please try again later.</p>`;
    }
  }
}

/* ============================= POST REVIEW ============================= */

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("submitReviewBtn");
  const textBox = document.getElementById("reviewText");
  if (!btn || !textBox) return;

  btn.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const text = textBox.value.trim();

    if (!token || !user) {
      alert("Please login to post a review.");
      return (window.location.href = "login.html");
    }

    if (!selectedRating || !text) {
      alert("Please enter rating and review text.");
      return;
    }

    try {
      const res = await fetch("https://watch-it-fr.onrender.com/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId: Number(id), rating: selectedRating, text }),
      });

      if (!res.ok) throw new Error("Failed to post review.");

      alert("✅ Review posted!");
      textBox.value = "";
      selectedRating = 0;
      document.querySelectorAll("#starRating span").forEach((s) => (s.style.color = "gray"));
      loadReviews(0);
    } catch (err) {
      console.error("POST review error:", err);
      alert("Failed to post review.");
    }
  });
});

/* ============================= UTILITIES ============================= */

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function initStarRating() {
  const stars = document.querySelectorAll("#starRating span");
  if (!stars.length) return;

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      selectedRating = Number(star.dataset.star);
      stars.forEach((s) => {
        s.style.color = Number(s.dataset.star) <= selectedRating ? "gold" : "gray";
      });
    });
  });
}







