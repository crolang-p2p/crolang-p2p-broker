const fs = require('fs');
const path = require('path');

const HEADER_PATH = path.join(__dirname, '..', 'HEADER.txt');
const SRC_DIR = path.join(__dirname, '..', 'src');
const VALID_EXTENSIONS = ['.ts', '.tsx'];

if (!fs.existsSync(HEADER_PATH)) {
    console.error('❌ HEADER.txt not found');
    process.exit(1);
}

const headerText = fs.readFileSync(HEADER_PATH, 'utf8').trim();

function addHeaderToFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.startsWith('/*')) return; // Skip if header already present

    const updatedContent = `${headerText}\n\n${content}`;
    fs.writeFileSync(filePath, updatedContent);
    console.log(`✔ Added license to: ${path.relative(process.cwd(), filePath)}`);
}

function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (stat.isFile() && VALID_EXTENSIONS.includes(path.extname(fullPath))) {
            addHeaderToFile(fullPath);
        }
    });
}

walk(SRC_DIR);
