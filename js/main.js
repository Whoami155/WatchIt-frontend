document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("data/movies.json");
    const movies = await res.json();

    if (!Array.isArray(movies)) {
      console.error("❌ movies.json is not a valid array");
      return;
    }

    /* ====================================================
       ✅ Helper – Render movie rows
    ==================================================== */
    function renderMovies(movieArray, containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = movieArray
        .map(
          (m) => `
        <div class="movie-card" onclick="location.href='movie.html?id=${m.id}'">
          <div class="movie-thumb">
            <img src="${m.poster}" alt="${m.title}" class="poster-img">
            <iframe
              src="https://www.youtube.com/embed/${m.trailer}?autoplay=1&mute=1&controls=0&loop=1&playlist=${m.trailer}"
              frameborder="0"
              allow="autoplay; encrypted-media"
              allowfullscreen
              class="trailer-preview">
            </iframe>
          </div>
          <h3>${m.title}</h3>
          <p>${m.year} • ${m.genre}</p>
        </div>`
        )
        .join("");
    }

    /* ====================================================
       ✅ HOMEPAGE ROWS (Your requested order)
    ==================================================== */
    renderMovies(movies.slice(0, 5), "recommendedMovies");
    renderMovies(movies.slice(5, 10), "topRatedMovies");

    const trending = [...movies].sort(() => Math.random() - 0.5).slice(0, 12);
    renderMovies(trending, "trendingMovies");

    const actionAdv = movies.filter(
      (m) =>
        m.genre.toLowerCase().includes("action") ||
        m.genre.toLowerCase().includes("adventure")
    );
    renderMovies(actionAdv, "actionAdventureMovies");

    const romanceDrama = movies.filter(
      (m) =>
        m.genre.toLowerCase().includes("romantic") ||
        m.genre.toLowerCase().includes("drama")
    );
    renderMovies(romanceDrama, "romanticDramaMovies");

    const scifiFantasy = movies.filter(
      (m) =>
        m.genre.toLowerCase().includes("sci-fi") ||
        m.genre.toLowerCase().includes("fantasy")
    );
    renderMovies(scifiFantasy, "scifiMovies");

    const thrillerCrime = movies.filter(
      (m) =>
        m.genre.toLowerCase().includes("thriller") ||
        m.genre.toLowerCase().includes("crime")
    );
    renderMovies(thrillerCrime, "thrillerCrimeMovies");

    const comedyMovies = movies.filter((m) =>
      m.genre.toLowerCase().includes("comedy")
    );
    renderMovies(comedyMovies, "comedyMovies");

    /* ====================================================
       ✅ Trailer Hover Effect
    ==================================================== */
    document.addEventListener("mouseover", (event) => {
      const thumb = event.target.closest(".movie-thumb");
      if (!thumb) return;

      clearTimeout(thumb.trailerTimeout);
      const delay = 3000 + Math.random() * 2000;

      thumb.trailerTimeout = setTimeout(() => {
        const img = thumb.querySelector(".poster-img");
        const trailer = thumb.querySelector(".trailer-preview");
        if (img && trailer) {
          img.style.opacity = "0";
          trailer.style.display = "block";
          trailer.style.opacity = "1";
        }
      }, delay);
    });

    document.addEventListener("mouseout", (event) => {
      const thumb = event.target.closest(".movie-thumb");
      if (!thumb) return;

      clearTimeout(thumb.trailerTimeout);
      const img = thumb.querySelector(".poster-img");
      const trailer = thumb.querySelector(".trailer-preview");

      if (img && trailer) {
        img.style.opacity = "1";
        trailer.style.opacity = "0";
        setTimeout(() => {
          trailer.style.display = "none";
        }, 300);
      }
    });

    /* ====================================================
       ✅ SEARCH + FILTER FIX (Fully Stable)
    ==================================================== */
    const input = document.getElementById("searchInput");
    const genreFilter = document.getElementById("genreFilter");
    const yearFilter = document.getElementById("yearFilter");
    const searchSection = document.getElementById("searchSection");
    const searchGrid = document.getElementById("searchGrid");
    const rows = document.querySelectorAll(".movie-row");

    // Animation helper for smooth appearance
    function fadeToggle(el, show) {
      el.style.transition = "opacity 0.25s ease";
      if (show) {
        el.style.display = "block";
        requestAnimationFrame(() => (el.style.opacity = "1"));
      } else {
        el.style.opacity = "0";
        setTimeout(() => (el.style.display = "none"), 250);
      }
    }

    function showHomepage() {
      fadeToggle(searchSection, false);
      if (searchGrid) searchGrid.innerHTML = "";
      rows.forEach((r) => (r.style.display = "block"));
    }

    function showResults(matched) {
      if (!searchSection || !searchGrid) return;
      rows.forEach((r) => (r.style.display = "none"));
      fadeToggle(searchSection, true);

      if (!matched || matched.length === 0) {
        searchGrid.innerHTML = `<p style="color:#aaa;padding:20px;">No results found</p>`;
        return;
      }

      searchGrid.innerHTML = matched
        .map(
          (m) => `
          <div class="movie-card" onclick="location.href='movie.html?id=${m.id}'">
            <div class="movie-thumb">
              <img src="${m.poster}" alt="${m.title}" class="poster-img">
            </div>
            <h3>${m.title}</h3>
            <p>${m.year || ""} • ${m.genre || ""}</p>
          </div>`
        )
        .join("");
    }

    function applyFilters(movies) {
      const q = input?.value.trim().toLowerCase() || "";
      const selectedGenre = (genreFilter?.value || "").toLowerCase();
      const selectedYear = (yearFilter?.value || "").trim();

      // If everything empty → show homepage
      if (!q && !selectedGenre && !selectedYear) {
        showHomepage();
        return;
      }

      const matched = movies.filter((m) => {
        const title = (m.title || "").toLowerCase();
        const genre = (m.genre || "").toLowerCase();
        const year = String(
          m.year || (m.release_date ? m.release_date.split("-")[0] : "")
        );

        const textMatch = q ? title.includes(q) || genre.includes(q) : true;
        const genreMatch = selectedGenre ? genre.includes(selectedGenre) : true;
        const yearMatch = selectedYear ? year === selectedYear : true;

        return textMatch && genreMatch && yearMatch;
      });

      showResults(matched);
    }

    // ✅ Debounce
    const debounce = (fn, delay = 200) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
      };
    };

    const runFilters = debounce(() => applyFilters(movies), 200);

    if (input) input.addEventListener("input", runFilters);
    if (genreFilter) genreFilter.addEventListener("change", () => applyFilters(movies));
    if (yearFilter) yearFilter.addEventListener("change", () => applyFilters(movies));

    // ✅ Fix: restore homepage when cleared
    input.addEventListener("input", () => {
      if (!input.value.trim() && !genreFilter.value && !yearFilter.value) {
        showHomepage();
      }
    });

    // ✅ Click outside → hide results if search empty
    document.addEventListener("click", (e) => {
      const inside =
        e.target.closest("#searchInput") ||
        e.target.closest("#genreFilter") ||
        e.target.closest("#yearFilter") ||
        e.target.closest("#searchSection");
      if (!inside && !input.value.trim()) {
        showHomepage();
      }
    });

    // ✅ ESC resets all
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        input.value = "";
        genreFilter.value = "";
        yearFilter.value = "";
        showHomepage();
      }
    });

    /* ====================================================
       ✅ Drag-to-scroll for all sliders
    ==================================================== */
    document.querySelectorAll(".movie-slider").forEach((row) => {
      let isDown = false,
        startX = 0,
        scrollLeft = 0;

      row.addEventListener("mousedown", (e) => {
        isDown = true;
        row.classList.add("dragging");
        startX = e.pageX - row.offsetLeft;
        scrollLeft = row.scrollLeft;
      });

      row.addEventListener("mouseleave", () => {
        isDown = false;
        row.classList.remove("dragging");
      });

      row.addEventListener("mouseup", () => {
        isDown = false;
        row.classList.remove("dragging");
      });

      row.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - row.offsetLeft;
        const walk = (x - startX) * 1.2;
        row.scrollLeft = scrollLeft - walk;
      });
    });
  } catch (error) {
    console.error("❌ Error loading movies:", error);
  }
});










