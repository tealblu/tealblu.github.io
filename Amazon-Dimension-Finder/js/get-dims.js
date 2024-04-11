
async function findKeyword(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'document', // Specify that you want the response as an HTML document
            headers: {
              'Accept': 'text/html' // Request the HTML content explicitly
            }
        });

        const html = response.data;
        const lines = html.documentElement.innerHTML.split('\n');
        const keyword = 'a-spacing-small po-item_depth_width_height';
        const dimensionsRegex = /(\d+(\.\d+)?)"(D|W|H)/g;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(keyword)) {
                console.log('dimension table found at line:', i);

                // dimensions are 5 lines below the keyword
                const dimensionsLine = lines[i];
                const match = dimensionsLine.match(dimensionsRegex);
                const dimensionsString = match.join(' ');
                console.log(dimensionsString);

                if (match) {
                    const resultDiv = document.getElementById('result');
                    resultDiv.textContent = `Dimensions found: ${dimensionsString}`;
                    return 0;
                }
            }
        }
        
        return -1; // Keyword not found
    } catch (error) {
        console.error('Error:', error.message);
        const resultDiv = document.getElementById('result');
        resultDiv.textContent = 'An error occurred while finding dimensions';
        return -1; // Error occurred
    }
}