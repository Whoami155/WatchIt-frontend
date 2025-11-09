document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("loginMsg");

  if (!email || !password) {
    msg.style.color = "red";
    msg.textContent = "Please enter both email and password.";
    return;
  }

  try {
    const res = await fetch("https://watch-it-fr.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      msg.style.color = "#00ffa2";
      msg.textContent = "Login successful! Redirecting...";

      // Save user data for session
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1500);
    } else {
      msg.style.color = "red";
      msg.textContent = data.msg || "Invalid credentials. Try again.";
    }
  } catch (err) {
    console.error(err);
    msg.style.color = "red";
    msg.textContent = "Server error. Please try again later.";
  }

  if (res.ok) {
  msg.style.color = "#00ffa2";
  msg.textContent = "Login successful! Redirecting...";

  // Save token temporarily
  localStorage.setItem("token", data.token);

  // ✅ Fetch full user with watchlist
  const profileRes = await fetch("https://watch-it-fr.onrender.com/api/user/me", {
    headers: {
      Authorization: `Bearer ${data.token}`
    }
  });

  const profile = await profileRes.json();

  // ✅ Store REAL user data including watchlist
  localStorage.setItem("user", JSON.stringify(profile.user));

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1200);
}

});
