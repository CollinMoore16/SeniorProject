class FeedbackManager {
    constructor() {
        this.setupFeedbackSystem();
    }

    setupFeedbackSystem() {
        const feedbackButton = document.createElement('button');
        feedbackButton.className = 'feedback-button';
        feedbackButton.innerHTML = '💬';
        feedbackButton.setAttribute('title', 'Send Feedback');

        const feedbackModal = document.createElement('div');
        feedbackModal.className = 'feedback-modal';
        feedbackModal.innerHTML = `
            <button class="close-feedback">&times;</button>
            <h3>Website Feedback</h3>
            <form class="feedback-form">
                <textarea placeholder="Please enter your feedback here..." required></textarea>
                <button type="submit">Submit Feedback</button>
            </form>
        `;

        document.body.appendChild(feedbackButton);
        document.body.appendChild(feedbackModal);

        feedbackButton.addEventListener('click', () => {
            feedbackModal.classList.add('active');
        });

        feedbackModal.querySelector('.close-feedback').addEventListener('click', () => {
            feedbackModal.classList.remove('active');
        });

        feedbackModal.querySelector('.feedback-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const feedback = feedbackModal.querySelector('textarea').value;
            this.saveFeedback(feedback);
            feedbackModal.querySelector('textarea').value = '';
            feedbackModal.classList.remove('active');
            alert('Thank you for your feedback!');
        });
    }

    saveFeedback(feedback) {

        const feedbacks = JSON.parse(localStorage.getItem('website_feedback') || '[]');
        feedbacks.push({
            feedback: feedback,
            timestamp: new Date().toISOString(),
            page: window.location.pathname
        });
        localStorage.setItem('website_feedback', JSON.stringify(feedbacks));
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new FeedbackManager();
});
