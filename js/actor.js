// ✅ Extract actor name + movieId from URL
const params = new URLSearchParams(window.location.search);
const actorName = params.get("name");
const fromMovieId = params.get("movieId"); // movie from which actor was clicked

// ✅ DOM references
const actorPhoto = document.getElementById("actorPhoto");
const actorNameElem = document.getElementById("actorName");
const actorNameInline = document.getElementById("actorNameInline");
const actorMovies = document.getElementById("actorMovies");
const charNameElem = document.getElementById("characterName");

fetch("data/movies.json")
  .then(res => res.json())
  .then(movies => {
    if (!Array.isArray(movies)) {
      console.error("❌ Invalid movies.json format");
      return;
    }

    let foundPhoto = null;
    let foundCharacter = null;

    /* ======================================================
       🎯 1. FIRST — Check the clicked movieId (highest priority)
    ====================================================== */
    if (fromMovieId) {
      const clickedMovie = movies.find(
        m => String(m.id).trim() === String(fromMovieId).trim()
      );

      if (clickedMovie?.castDetail?.length) {
        const exactActor = clickedMovie.castDetail.find(
          c => c.name.trim().toLowerCase() === actorName.trim().toLowerCase()
        );

        if (exactActor) {
          foundPhoto = exactActor.photo || null;
          foundCharacter = exactActor.character || null;
          console.log("✅ Using movie-specific actor:", fromMovieId, exactActor);
        }
      }
    }

    /* ======================================================
       🎯 2. SECOND — Find all movies where actor appears
    ====================================================== */
    const actorResults = movies.filter(movie =>
      movie.castDetail?.some(cast =>
        cast.name.trim().toLowerCase() === actorName.trim().toLowerCase()
      )
    );

    /* ======================================================
       🎯 3. THIRD — If no movieId photo, fallback to first found
    ====================================================== */
    if (!foundPhoto && actorResults.length > 0) {
      for (const m of actorResults) {
        const match = m.castDetail?.find(
          c => c.name.trim().toLowerCase() === actorName.trim().toLowerCase()
        );
        if (match?.photo) {
          foundPhoto = match.photo;
          foundCharacter = match.character || foundCharacter;
          console.log("ℹ️ Using fallback actor photo from:", m.title);
          break;
        }
      }
    }

    /* ======================================================
       ✅ 4. Update the actor header section
    ====================================================== */
    actorNameElem.textContent = actorName;
    actorNameInline.textContent = actorName;
    actorPhoto.src = foundPhoto || "assets/default_actor.png";

    if (foundCharacter) {
      charNameElem.textContent = `as ${foundCharacter}`;
      charNameElem.style.display = "block";
    } else {
      charNameElem.style.display = "none";
    }

    /* ======================================================
       ✅ 5. Render movies featuring this actor
    ====================================================== */
    if (actorResults.length === 0) {
      actorMovies.innerHTML = `<p style="color:#999;text-align:center;">No movies found for this actor.</p>`;
      return;
    }

    actorMovies.innerHTML = actorResults
      .map(movie => {
        const cast = movie.castDetail.find(
          c => c.name.trim().toLowerCase() === actorName.trim().toLowerCase()
        );
        return `
          <div class="actor-movie-card" onclick="location.href='movie.html?id=${movie.id}'">
            <img src="${movie.poster}" alt="${movie.title}">
            <h4>${movie.title}</h4>
            ${cast?.character ? `<p class='movie-character'>as ${cast.character}</p>` : ""}
          </div>
        `;
      })
      .join("");
  })
  .catch(err => console.error("Error loading actor:", err));
s
