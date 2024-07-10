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

        fetch(apiUrl)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
            })
            .then(data => {
                // Traverse all items in the directory
                data.forEach(item => {
                    if (item.type === 'file') {
                        // Download files if needed
                        downloadFile(item.download_url, item.name);
                    } else if (item.type === 'dir') {
                        // Handle directories if needed
                        console.log(`Found directory: ${item.name}`);
                    }
                });
                messageElement.textContent = 'Download started!';
            })
            .catch(error => {
                messageElement.textContent = `Failed to fetch directory contents: ${error.message}`;
            });
    } else {
        messageElement.textContent = 'Invalid GitHub URL.';
    }
});

// Function to download a file
function downloadFile(url, fileName) {
    fetch(url)
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
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error('Failed to download file:', error);
        });
}
