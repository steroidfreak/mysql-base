function generateContent() {
    const title = document.getElementById('title').value;
    
    if (!title) {
        alert('Please enter a title first');
        return;
    }

    fetch(`/generate-content?title=${encodeURIComponent(title)}`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('content').value = data.content;  // Changed from data.generatedContent to data.content
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to generate content');
    });
}