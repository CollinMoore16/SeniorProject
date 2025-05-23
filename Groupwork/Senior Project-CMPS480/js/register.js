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
	
	// Password strength indicator
	const passwordInput = document.getElementById("password");
	const strengthBar = document.getElementById("password-strength-bar");
	
	passwordInput.addEventListener("input", () => {
		const password = passwordInput.value;
		let strength = 0;
		
		// Check password length
		if (password.length >= 8) strength += 1;
		
		// Check for numbers
		if (/\d/.test(password)) strength += 1;
		
		// Check for special characters
		if (/[^A-Za-z0-9]/.test(password)) strength += 1;
		
		// Check for uppercase and lowercase
		if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
		
		// Update the strength bar
		strengthBar.className = "password-strength-bar";
		if (strength === 0) {
			strengthBar.style.width = "0";
		} else if (strength <= 2) {
			strengthBar.classList.add("strength-weak");
		} else if (strength === 3) {
			strengthBar.classList.add("strength-medium");
		} else {
			strengthBar.classList.add("strength-strong");
		}
	});
});

// Form validation and submission
document.getElementById("registerForm").addEventListener("submit", async (e) => {
	e.preventDefault();
	
	// Reset error messages
	const errorMessages = document.querySelectorAll(".error-message");
	errorMessages.forEach(msg => msg.style.display = "none");
	
	// Get form values
	const email = document.getElementById("email").value;
	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;
	const confirmPassword = document.getElementById("confirmPassword").value;
	
	// Validate form
	let isValid = true;
	
	// Email validation
	if (!validateEmail(email)) {
		document.getElementById("email-error").style.display = "block";
		isValid = false;
	}
	
	// Username validation
	if (username.length < 3) {
		document.getElementById("username-error").style.display = "block";
		isValid = false;
	}
	
	// Password validation
	if (password.length < 8) {
		document.getElementById("password-error").style.display = "block";
		isValid = false;
	}
	
	// Confirm password validation
	if (password !== confirmPassword) {
		document.getElementById("confirm-password-error").style.display = "block";
		isValid = false;
	}
	
	// If form is valid, submit it
	if (isValid) {
		await sendRequest();
	}
});

// Email validation helper
function validateEmail(email) {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(email);
}

// Send registration request to API
async function sendRequest() {
	const data = {
		email: document.getElementById("email").value,
		username: document.getElementById("username").value, 
		password: document.getElementById("password").value,
		confirmPassword: document.getElementById("confirmPassword").value,
	};

	try {
		const response = await fetch('http://localhost:3000/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Failed to register account');
		}

		alert("Account registered successfully!");
		window.location.href = 'login.html';
	} catch (error) {
		console.error('Error:' + error);
		alert('Failed to register account: ' + error.message);
	}
}