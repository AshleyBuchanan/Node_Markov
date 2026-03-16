/** Textual markov chain generator */
const fs = require('fs');
const axios = require('axios');
class MarkovMachine {

    constructor(text, numWords) {
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

        this.numWords = numWords;
        this.makeChains();
    };

    makeChains() {
        this.chains = new Map();

        for (let i = 0; i < this.words.length; i++) {
            let word = `${this.words[i]} ${this.words[i+1]} ${this.words[i+2]}`;
            let nextWord = this.words[i+3] || null;

            if (!this.chains.has(word)) {
                this.chains.set(word, []);
            };

            this.chains.get(word).push(nextWord);
        };

        //console.log(this.chains)

        this.makeText(this.numWords);
    };

    makeText(numWords) {
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
                    let w = word.split(" ");
                    output.push(w[0]);
                    //output.push(w[1]);
                    //console.log(output)
                    let nextWords = this.chains.get(word);
                    word = `${word.split(" ")[1]} ${word.split(" ")[2]} ${nextWords[Math.max(Math.floor(Math.random() * nextWords.length))]}`;
            };
        };

        let phrasing = output.join(" ");
        phrasing = phrasing.replace(/^./, char => char.toUpperCase());

        if (!/[.!?]$/.test(phrasing)) {
            phrasing += ".";
        };

        console.log(phrasing);
        process.exit(0);
    };
};

function cat(arg) {
    try {
        const data = fs.readFileSync(arg, 'utf8');
        return data;

    } catch (err) {
        console.error(`Error reading ${arg}:`, err.message);
        process.exit(1);
    };
};

async function webCat(arg) {
    let payload;
 
    try {
        payload = await axios.get(arg, {
            //header was needed to access some sites like wikipedia
            headers: {
                'User-Agent': 'step3-cat/1.0 (learning project; contact: me@gmail.com)'
            }
        });

    } catch (err) {
        console.error(`Error fetching ${arg}:`, err.code==='ENOTFOUND' ? '404' : err.response.status);
        process.exit(1);
    };

    return payload.data;
};

async function main() {
    let numberOfWords = 10;
    const args = process.argv.slice(2);
    console.log(args, args.length);

    //if no args[]:
    if (args.length === 0) {
        console.error('Please provide a file path or web address.');
        console.log('\nExample Usage:');
        console.log(' node markov.js <[word count number]> <source_file> <"source file"> <etc>\n\n');
        process.exit(1);
    };

    //check to see if the first arg is a number
    if (Number(args[0]) != 0) {
        numberOfWords = args.shift();
    };

    //retrieve text from file(s)
    const rawText = await Promise.all(
        args.map(async arg => {
            if (arg.startsWith("https://") || arg.startsWith("http://")) {
                return await webCat(arg);
            } else {
                return cat(arg);
            };
        })
    );

    let mm = new MarkovMachine(rawText.join(" "), numberOfWords);
};

main();
