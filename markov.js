/** Textual markov chain generator */
const fs = require('fs');
const open = (...args) => import('open').then(mod => mod.default(...args));         // the open package is ESM-only... I could've just converted to ESM but I'd already struggled to find this.:D

class MarkovMachine {

    constructor(text) {
        // normalize whitespace and strip most punctuation that breaks the chain.
        let cleaned = text
            .replace(/[()"“”]/g, "")        // remove parentheses and quotes
            .replace(/\s[-—–]+\s/g, " ")    // remove standalone spaced dashes like " - "
            .replace(/--|—|–/g, " ")        // convert double/em/en dashes to spaces
            .replace(/[;:,]/g, " ")         // remove semicolons/colons/commas
            .replace(/\s+/g, " ")           // collapse weird spacing
            .replace(/\^/g, "")             // remove these " ^ "
            .trim();

        let words = cleaned.split(" ");        
        this.words = words.filter(w => w !== "");

        this.makeChains();
    };

    makeChains() {
        this.chains = new Map();

        for (let i = 0; i < this.words.length; i++) {
            let word = this.words[i];
            let nextWord = this.words[i+1] || null;

            if (!this.chains.has(word)) {
                this.chains.set(word, []);
            };

            this.chains.get(word).push(nextWord);
        };

        //console.log(this.chains)

        this.makeText();
    };

    makeText(numWords = 10) {
        const keys = Array.from(this.chains.keys());
        let word = keys[Math.floor(Math.random() * keys.length)];
        let output = [];

        while (output.length < numWords) {

            switch (word) {
                case null:
                    output.push('\b.');
                    word = keys[Math.floor(Math.random() * keys.length)];
                    break;

                default:
                    output.push(word);
                    let nextWords = this.chains.get(word);
                    word = nextWords[Math.floor(Math.random() * nextWords.length)];
            };
        };

        let phrasing = output.join(" ");
        phrasing = phrasing.replace(/^./, char => char.toUpperCase());

        if (!/[.!?]$/.test(phrasing)) {
            phrasing += ".";
        };

        console.log(phrasing);
    };
};

async function main() {
    const args = process.argv.slice(2);
    console.log(args, args.length);

    //if no args[]:
    if (args.length === 0) {
        console.error('Please provide a file path or web address.');
        console.log('\nExample Usage:');
        console.log(' node markov.js <source file> <"source file"> <etc>\n\n');
        process.exit(1);
    };

    //retrieve text from file(s)
    const rawText = [];
    args.forEach(arg => {
        try {
            const data = fs.readFileSync(arg, 'utf8');
            rawText.push(data);

        } catch (err) {

        }

        let mm = new MarkovMachine(...rawText);
    });
};

main();
