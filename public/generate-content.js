function generateContent() {
    console.log("generateContent function called"); // Debug log
    const textarea = document.getElementById('content');
    const titleInput = document.getElementById('title');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (!titleInput.value) {
        alert('Please enter a title first');
        return;
    }

    console.log("Showing loading indicator"); // Debug log
    // Show loading indicator
    loadingIndicator.classList.remove('d-none');
    
    console.log("Making API call"); // Debug log
    // Make API call to generate content
    fetch(`/generate-content?title=${encodeURIComponent(titleInput.value)}`)
    .then(response => response.json())
    .then(data => {
        console.log("Content received:", data); // Debug log
        // Update textarea with generated content
        textarea.value = data.content;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to generate content. Please try again.');
    })
    .finally(() => {
        console.log("Hiding loading indicator"); // Debug log
        // Hide loading indicator
        loadingIndicator.classList.add('d-none');
    });
}
