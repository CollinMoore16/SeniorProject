// Dark mode toggle
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("theme-toggle-btn");
  const icon = btn.querySelector("i");
  const text = btn.querySelector("span");
  const current = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark-mode", current === "dark");
  updateToggle(current === "dark");

  btn.addEventListener("click", () => {
	const isDark = document.body.classList.toggle("dark-mode");
	localStorage.setItem("theme", isDark ? "dark" : "light");
	updateToggle(isDark);
  });

  function updateToggle(isDark) {
	if (isDark) {
	  icon.classList.replace("fa-moon", "fa-sun");
	  text.textContent = "Light Mode";
	} else {
	  icon.classList.replace("fa-sun", "fa-moon");
	  text.textContent = "Dark Mode";
	}
  }

  // Password visibility toggle
  const passwordToggle = document.getElementById("password-toggle");
  const passwordInput = document.getElementById("password");
  
  passwordToggle.addEventListener("click", () => {
	const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
	passwordInput.setAttribute("type", type);
	
	const icon = passwordToggle.querySelector("i");
	if (type === "text") {
	  icon.classList.replace("fa-eye", "fa-eye-slash");
	} else {
	  icon.classList.replace("fa-eye-slash", "fa-eye");
	}
  });
});

// Login handler
document.getElementById("loginForm").onsubmit = async (e) => {
  e.preventDefault();
  
  // Reset error messages
  document.querySelectorAll(".error-message").forEach(el => {
	el.style.display = "none";
  });
  
  // Get form values
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  
  // Basic validation
  let isValid = true;
  
  if (!username.trim()) {
	document.getElementById("username-error").style.display = "block";
	isValid = false;
  }
  
  if (!password.trim()) {
	document.getElementById("password-error").style.display = "block";
	isValid = false;
  }
  
  if (!isValid) return;
  
  // Show loading state
  const submitButton = document.querySelector("button[type='submit']");
  submitButton.classList.add("loading");

  try {
	const res = await fetch("http://localhost:3000/login", {
	  method: "POST",
	  headers: { "Content-Type": "application/json" },
	  body: JSON.stringify({ username, password }),
	});
	
	// Hide loading state
	submitButton.classList.remove("loading");
	
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Login failed");
	
	localStorage.setItem("token", data.token);
	window.location.href = "cards.html";
  } catch (err) {
	// Hide loading state
	submitButton.classList.remove("loading");
	alert(err.message);
  }
};