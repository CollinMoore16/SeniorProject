// Dark mode functionality
document.addEventListener("DOMContentLoaded", () => {
	const themeToggleBtn = document.getElementById('theme-toggle-btn');
	const icon = themeToggleBtn.querySelector('i');
	const text = themeToggleBtn.querySelector('span');
	
	// Check for saved theme preference
	const currentTheme = localStorage.getItem('theme') || 'light';
	document.body.classList.toggle('dark-mode', currentTheme === 'dark');
	
	// Update button appearance based on current theme
	updateThemeToggle(currentTheme === 'dark');
	
	// Toggle theme when button is clicked
	themeToggleBtn.addEventListener('click', () => {
		const isDarkMode = document.body.classList.toggle('dark-mode');
		localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
		updateThemeToggle(isDarkMode);
	});
	
	function updateThemeToggle(isDarkMode) {
		if (isDarkMode) {
			icon.classList.remove('fa-moon');
			icon.classList.add('fa-sun');
			text.textContent = 'Light Mode';
		} else {
			icon.classList.remove('fa-sun');
			icon.classList.add('fa-moon');
			text.textContent = 'Dark Mode';
		}
	}
	
	// Apply theme on page load
	document.body.style.visibility = 'visible';
});

// Function to send a POST request to add a new card to the API
async function sendRequest() {
	const data = {
		name: document.getElementById("card_name").value,
		category: document.getElementById("category").value,
		set_name: document.getElementById("set_name").value,
		rarity: document.getElementById("rarity").value,
		condition: document.getElementById("condition").value,
		value: document.getElementById("value").value,
		favorite: false,  
	};
	
	// Validate form before submission
	if (!validateForm(data)) {
		return;
	}
	
	try {
		const response = await fetch('http://localhost:3000/cards', {
			method: 'POST',
			headers: {
				Authorization: "Bearer " + (localStorage.getItem("token") || "fake-token"),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});
		
		if (!response.ok) {
			throw new Error('Failed to add card');
		}
		
		const result = await response.json();
		showNotification('Card added successfully!', 'success');
		
		// Redirect after a short delay
		setTimeout(() => {
			window.location.href = 'cards.html';
		}, 1500);
		
	} catch (error) {
		console.error('Error:', error);
		showNotification('Failed to add card: ' + error.message, 'error');
	}
}

// Form validation
function validateForm(data) {
	// Check if all required fields are filled
	for (const key in data) {
		if (!data[key] && key !== 'favorite') {
			showNotification(`Please fill in all required fields`, 'error');
			return false;
		}
	}
	return true;
}

// Show notification message
function showNotification(message, type) {
	// Remove any existing notification
	const existingNotification = document.querySelector('.notification');
	if (existingNotification) {
		existingNotification.remove();
	}
	
	// Create notification element
	const notification = document.createElement('div');
	notification.className = `notification ${type}`;
	notification.innerHTML = `
		<div class="notification-content">
			<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
			<span>${message}</span>
		</div>
	`;
	
	// Add to document
	document.body.appendChild(notification);
	
	// Remove after timeout
	setTimeout(() => {
		notification.classList.add('fade-out');
		setTimeout(() => notification.remove(), 500);
	}, 3000);
}