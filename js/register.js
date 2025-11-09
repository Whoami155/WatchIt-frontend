document.getElementById("registerBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("registerMsg");

  if (!name || !email || !password) {
    msg.style.color = "red";
    msg.textContent = "Please fill out all fields.";
    return;
  }

  try {
    const res = await fetch("https://watch-it-fr.onrender.com/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      msg.style.color = "#00ffa2";
      msg.textContent = "Registration successful! Redirecting...";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } else {
      msg.style.color = "red";
      msg.textContent = data.msg || "Registration failed. Try again.";
    }
  } catch (err) {
    msg.style.color = "red";
    msg.textContent = "Server error. Please try later.";
    console.error(err);
  }
});
