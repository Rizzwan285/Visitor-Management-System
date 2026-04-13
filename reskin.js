const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    let newContent = content
        .replace(/\bbg-white\b/g, 'bg-card')
        .replace(/\bbg-slate-50\b/g, 'bg-background')
        .replace(/\bbg-slate-100\b/g, 'bg-muted')
        .replace(/\bbg-slate-200\b/g, 'bg-muted/80')
        .replace(/\bbg-slate-300\b/g, 'bg-secondary')
        .replace(/\bbg-slate-400\b/g, 'bg-secondary')
        .replace(/\bbg-slate-800\b/g, 'bg-secondary')
        .replace(/\bbg-slate-900\b/g, 'bg-card')
        .replace(/\btext-slate-100\b/g, 'text-card-foreground')
        .replace(/\btext-slate-400\b/g, 'text-muted-foreground')
        .replace(/\btext-slate-500\b/g, 'text-muted-foreground')
        .replace(/\btext-slate-600\b/g, 'text-muted-foreground')
        .replace(/\btext-slate-700\b/g, 'text-foreground')
        .replace(/\btext-slate-800\b/g, 'text-foreground')
        .replace(/\btext-slate-900\b/g, 'text-foreground')
        .replace(/\bborder-slate-100\b/g, 'border-border')
        .replace(/\bborder-slate-200\b/g, 'border-border')
        .replace(/\bborder-slate-300\b/g, 'border-border')
        .replace(/\bborder-slate-400\b/g, 'border-border')
        .replace(/\bborder-slate-800\b/g, 'border-border')
        .replace(/\bh-px bg-slate-300\b/g, 'h-px bg-border')
        .replace(/\bbg-blue-600\b/g, 'bg-primary')
        .replace(/\bh-24 bg-slate-100\b/g, 'h-24 bg-muted')
        .replace(/\btext-blue-600\b/g, 'text-primary')
        .replace(/\btext-blue-500\b/g, 'text-primary')
        .replace(/\bbg-blue-50\b/g, 'bg-primary/10')
        .replace(/\btext-black\b/g, 'text-foreground');
        
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${filePath}`);
    }
});
