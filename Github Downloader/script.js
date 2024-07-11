document.getElementById('downloadBtn').addEventListener('click', function() {
    const githubUrl = document.getElementById('githubUrl').value.trim();
    const messageElement = document.getElementById('message');

    messageElement.textContent = ''; // Clear previous messages

    if (!githubUrl) {
        messageElement.textContent = 'Please enter a GitHub URL.';
        return;
    }

    // URL validation
    const repositoryRegex = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/;
    const fileRegex = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/;
    const directoryRegex = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)$/;

    let match;

    if (repositoryRegex.test(githubUrl)) {
        // Download entire repository
        match = githubUrl.match(repositoryRegex);
        const user = match[1];
        const repo = match[2];
        const downloadUrl = `https://github.com/${user}/${repo}/archive/refs/heads/main.zip`; // Replace 'main' with default_branch from GitHub API if necessary

        messageElement.textContent = 'Downloading repository...';

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = `${repo}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a); // Remove element from DOM after download
        messageElement.textContent = 'Download started!';
    } else if (fileRegex.test(githubUrl)) {
        // Download specific file
        match = githubUrl.match(fileRegex);
        const user = match[1];
        const repo = match[2];
        const branch = match[3];
        const filePath = match[4];
        const apiUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${filePath}`;

        messageElement.textContent = 'Fetching file...';

        fetch(apiUrl)
            .then(response => {
                if (response.ok) {
                    return response.blob();
                } else {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filePath.split('/').pop();
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                messageElement.textContent = 'Download started!';
            })
            .catch(error => {
                messageElement.textContent = `Failed to fetch: ${error.message}`;
            });
    } else if (directoryRegex.test(githubUrl)) {
        // Download entire directory
        match = githubUrl.match(directoryRegex);
        const user = match[1];
        const repo = match[2];
        const branch = match[3];
        const directoryPath = match[4];
        const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${directoryPath}?ref=${branch}`;

        messageElement.textContent = 'Fetching directory contents...';

        const zip = new JSZip();
        fetchDirectoryContents(apiUrl, zip, directoryPath)
            .then(() => {
                zip.generateAsync({ type: 'blob' })
                    .then(content => {
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        const url = window.URL.createObjectURL(content);
                        a.href = url;
                        a.download = `${directoryPath.split('/').pop()}.zip`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        messageElement.textContent = 'Download started!';
                    });
            })
            .catch(error => {
                messageElement.textContent = `Failed to fetch directory contents: ${error.message}`;
            });
    } else {
        messageElement.textContent = 'Invalid GitHub URL.';
    }
});

// Function to fetch directory contents recursively and add to zip
function fetchDirectoryContents(apiUrl, zip, path) {
    return fetch(apiUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
        })
        .then(data => {
            const promises = data.map(item => {
                if (item.type === 'file') {
                    return fetch(item.download_url)
                        .then(response => {
                            if (response.ok) {
                                return response.blob();
                            } else {
                                throw new Error(`Error: ${response.status} ${response.statusText}`);
                            }
                        })
                        .then(blob => {
                            const relativePath = item.path.replace(path + '/', '');
                            zip.file(relativePath, blob);
                        });
                } else if (item.type === 'dir') {
                    return fetchDirectoryContents(item.url, zip, path);
                }
            });
            return Promise.all(promises);
        });
}


document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('githubUrl');
    const tooltip = document.getElementById('tooltip');

    // Show tooltip on small screens
    function showTooltip() {
        if (window.innerWidth <= 1200) {
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
        }
    }

    // Hide tooltip when not on small screens
    function hideTooltip() {
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
    }

    // Add event listeners for input focus and blur
    inputField.addEventListener('focus', showTooltip);
    inputField.addEventListener('blur', hideTooltip);

    // Initialize tooltip visibility based on screen size
    hideTooltip();

    // Update tooltip visibility on window resize
    window.addEventListener('resize', hideTooltip);
});

