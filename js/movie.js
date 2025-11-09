// js/movie.js

// ------- URL + global state -------
const params = new URLSearchParams(window.location.search);
const id = params.get("id"); // movieId as string from ?id=#
let selectedRating = 0; // for star rating UI

if (!id) {
  document.addEventListener("DOMContentLoaded", () => {
    document.body.innerHTML =
      "<h2 style='color:white;text-align:center;'>❌ Movie not found!</h2>";
  });
} else {
  document.addEventListener("DOMContentLoaded", initPage);
}

async function initPage() {
  // Init star rating UI ASAP so user can click even before data returns
  initStarRating();

  try {
    const movies = await safeFetchJSON("data/movies.json");
    if (!Array.isArray(movies)) {
      console.error("movies.json did not return an array:", movies);
      return showFatal("⚠️ Could not load local movies data.");
    }

    const movie = movies.find((m) => String(m.id) === String(id));
    if (!movie) {
      return showFatal("⚠️ Movie not found in local JSON!");
    }

    renderMovieDetails(movie);
    renderCast(movie);
    renderSimilarMovies(movies, movie);
    initWatchlistButton(movie);

    // ✅ Only call AFTER the DOM has the #userReviews element and movie content is in place
    await loadReviews();

  } catch (err) {
    console.error("❌ Error loading movie:", err);
    showFatal("Server Error 😢");
  }
}

// ------- Helpers -------

function showFatal(msg) {
  document.body.innerHTML = `<h2 style="color:white;text-align:center;">${msg}</h2>`;
}

async function safeFetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed ${res.status} ${res.statusText} for ${url} :: ${text}`);
  }
  return res.json();
}

function initStarRating() {
  const stars = document.querySelectorAll("#starRating span");
  if (!stars || !stars.length) return;

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      selectedRating = Number(star.dataset.star || 0);
      stars.forEach((s) => {
        s.style.color = Number(s.dataset.star) <= selectedRating ? "gold" : "gray";
      });
    });
  });
}

function renderMovieDetails(movie) {
  const backdrop = document.getElementById("movieBackdrop");
  if (backdrop) {
    backdrop.style.backgroundImage = `url('${movie.backdrop || movie.poster}')`;
  }

  const posterEl = document.getElementById("moviePoster");
  const titleEl = document.getElementById("movieTitle");
  const yearEl = document.getElementById("movieYear");
  const relEl = document.getElementById("movieRelease");
  const descEl = document.getElementById("movieDescription");
  const trailerEl = document.getElementById("trailerFrame");
  const genreTags = document.getElementById("genreTags");

  if (posterEl) posterEl.src = movie.poster;
  if (titleEl) titleEl.textContent = movie.timelineTitle || movie.title || "Untitled";
  if (yearEl) yearEl.textContent = `${movie.year || "N/A"} • ${movie.runtime || ""}`;
  if (relEl) relEl.textContent = `Released: ${movie.released || "N/A"}`;
  if (descEl) descEl.textContent = movie.description || "";
  if (trailerEl && movie.trailer) {
    trailerEl.src = `https://www.youtube.com/embed/${movie.trailer}`;
  }
  if (genreTags && movie.genre) {
    genreTags.innerHTML = movie.genre
      .split(/[,/]/)
      .map((g) => `<span>${g.trim()}</span>`)
      .join("");
  }
}

function renderCast(movie) {
  const castContainer = document.getElementById("castList");
  if (!castContainer) return;

  castContainer.innerHTML = ""; // clear first

  // ✅ Case 1: castDetail array with photos
  if (Array.isArray(movie.castDetail) && movie.castDetail.length > 0) {
    castContainer.innerHTML = movie.castDetail
      .map(
        (actor) => `
        <div class="cast-card"
             onclick="location.href='actor.html?name=${encodeURIComponent(actor.name)}&movieId=${movie.id}'">

          <img src="${actor.photo}" alt="${actor.name}">
          <p>${actor.name}</p>
        </div>
      `
      )
      .join("");
    return;
  }

  // ✅ Case 2: cast array with only names
  if (Array.isArray(movie.cast) && movie.cast.length > 0) {
    castContainer.innerHTML = movie.cast
      .map(
        (name) => `
        <div class="cast-card"
             onclick="location.href='actor.html?name=${encodeURIComponent(name)}'">

          <div style="
                width:90px;
                height:90px;
                border-radius:50%;
                background:#222;
                display:flex;
                align-items:center;
                justify-content:center;
                color:#aaa;
                font-size:12px;">
            ?
          </div>
          <p>${name}</p>
        </div>
      `
      )
      .join("");
    return;
  }

  // ✅ Case 3: No cast data at all
  castContainer.innerHTML = `<p style="color:#999;">Cast information not available.</p>`;
}


function renderSimilarMovies(all, movie) {
  const similarContainer = document.getElementById("similarMovies");
  if (!similarContainer) return;

  const genreMain = (movie.genre || "").split("/")[0].trim().toLowerCase();
  const similar = all
    .filter(
      (m) =>
        String(m.id) !== String(movie.id) &&
        (m.genre || "").toLowerCase().startsWith(genreMain)
    )
    .slice(0, 6);

  if (!similar.length) {
    similarContainer.innerHTML = `<p style="color:#aaa;">No similar movies found.</p>`;
    return;
  }

  similarContainer.innerHTML = similar
    .map(
      (m) => `
      <div class="similar-card" onclick="location.href='movie.html?id=${m.id}'">
        <img src="${m.poster}" alt="${m.title}">
        <h4>${m.title}</h4>
      </div>`
    )
    .join("");
}

function initWatchlistButton(movie) {
  const btn = document.getElementById("watchlistBtn") || document.querySelector(".watchlist-btn");
  if (!btn) return;

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user) {
    btn.textContent = "⭐ Login to Save";
    btn.onclick = () => (window.location.href = "login.html");
    return;
  }

  const already = Array.isFinite ? user.watchlist?.includes(movie.id) : (user.watchlist || []).includes(movie.id);
  if (already) btn.textContent = "✅ In Watchlist";

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
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        u.watchlist = data.watchlist;
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (e) {
      console.error("Watchlist error:", e);
    }
  };
}

// ------- Reviews -------

async function loadReviews() {
  const container = document.getElementById("userReviews");
  if (!container) {
    console.warn("#userReviews container not found in DOM when loading reviews.");
    return;
  }

  try {
    const url = `https://watch-it-fr.onrender.com/api/reviews/${encodeURIComponent(id)}`;
    const res = await fetch(url);

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("GET /reviews failed:", res.status, res.statusText, t);
      container.innerHTML = `<p style="color:#aaa;">Error loading reviews.</p>`;
      return;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn("Unexpected reviews response:", data);
      container.innerHTML = `<p style="color:#aaa;">No reviews yet.</p>`;
      return;
    }

    if (data.length === 0) {
      container.innerHTML = `<p style="color:#aaa;">No reviews yet.</p>`;
      return;
    }

    container.innerHTML = data
      .map(
        (r) => `
        <div class="review-item">
          <strong>${escapeHTML(r.userName || "User")}</strong>
          <span>⭐ ${Number(r.rating) || 0}/5</span>
          <p>${escapeHTML(r.text || "")}</p>
          <small>${formatDate(r.createdAt)}</small>
        </div>`
      )
      .join("");
  } catch (err) {
    console.error("Review load error:", err);
    container.innerHTML = `<p style="color:#aaa;">Error loading reviews.</p>`;
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// ------- Submit Review -------

document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submitReviewBtn");
  const reviewText = document.getElementById("reviewText");

  if (!submitBtn || !reviewText) return;

  submitBtn.addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    const text = reviewText.value.trim();

    if (!user || !token) {
      alert("Please login to post a review.");
      window.location.href = "login.html";
      return;
    }
    if (!selectedRating || !text) {
      alert("Please enter rating and review text.");
      return;
    }

    try {
      const data = await safeFetchJSON("https://watch-it-fr.onrender.com/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId: Number(id),
          rating: Number(selectedRating),
          text,
        }),
      });

      // Reset UI
      alert("Review posted!");
      reviewText.value = "";
      selectedRating = 0;
      document.querySelectorAll("#starRating span").forEach((s) => (s.style.color = "gray"));

      // ✅ Re-fetch reviews to show the new one + any existing ones
      await loadReviews();
    } catch (e) {
      console.error("POST review failed:", e);
      alert("Failed to post review.");
    }
  });
});






