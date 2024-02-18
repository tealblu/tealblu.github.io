
import fs from 'fs';
import path from 'path';

// Directory to search 
const dir = String.raw`S:\Projects\tealblu.github.io\content\pages`;

// Regular expression to match
const regex = /\[([^\]]*)\]\(\{\{/gm; 

// Map to store matches
let map = new Map();

// Recursive function to search directories
function searchDirs(dir) {
    // Read files in directory
    fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);

    // Check if file is directory
    if (fs.statSync(filePath).isDirectory()) {
        // Search subdirectory
        searchDirs(filePath);
    } else {
        // Check file content for match
        const content = fs.readFileSync(filePath, 'utf8');
        if (regex.test(content)) {
            // console.log("File: " + filePath);

            const matches = content.match(regex);
            
            // Add matches to map
            const match_array = new Array();
            if (matches.length > 0) {
                // loop through matches and remove lead ing [ and trailing ]({{
                matches.forEach(match => {
                    const match_str = match.substring(1, match.indexOf(']'));
                    match_array.push(match_str);
                });
                map.set(file, match_array);
            }
        }
    }
    });
}

// Start search in directory, return {filepath: match} map
searchDirs(dir);
console.log(map);