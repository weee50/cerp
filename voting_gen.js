var responses = null
var letters = null

async function loadResponses(file) {
    try {
        const response = await fetch(file);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        responses = text.split('\n');
        return true;
    } catch (error) {
        console.error("Error fetching response file:", error);
        return false;
    }
}
async function loadLetters(file) {
    try {
        const response = await fetch(file);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        letters = text.split('\n');
        return true;
    } catch (error) {
        console.error("Error fetching letter file:", error);
        return false;
    }
}
loadResponses("responses.txt")
loadLetters("letters.txt")

function getRandomSection() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 3; i++) {
        result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return result;
}

function lettersToSeed(letters) {
    return (letters.charCodeAt(0) - 65) * 676 + (letters.charCodeAt(1) - 65) * 26 + (letters.charCodeAt(2) - 65)
}

function shuffleResponses(seed) {
    let rng = new MersenneRNG(seed);
    let shuffled = [...responses];

    for (let i = 0; i < responses.length - 1; i++) {
        j = rng.randrange(i, responses.length);
        let temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled;
}

function wordCount(response) {
    return response.split(" ").filter(x => x.match(/[A-Za-z0-9]/)).length
}

var section_name = null
var screen_count = null
var big_screens = null

function generateSection() {
    let screen_size = Number(document.getElementById("screen_size").value);
    let section_code = document.getElementById("seed").value.toUpperCase();

    if (section_code === "") {
        section_code = getRandomSection();
    }

    if (!section_code.match(/^[A-Z]{3}$/)) {
        document.getElementById("voting").innerText = "Error: Section ID must be three letters";
        return;
    }

    if (!Number.isInteger(screen_size) || screen_size < 11 || screen_size > 16607 || isNaN(screen_size)) {
        document.getElementById("voting").innerText = "Error: Screen size must be an integer between 11 and 16607";
        return;
    }

    screen_count = Math.round(16607 / screen_size);
    let small_screen_size = Math.floor(16607 / screen_count);
    let big_screen_count = 16607 % screen_count;

    let full_seed = screen_count * 17576 + lettersToSeed(section_code);
    section_name = `${screen_count}${section_code}`

    let shuffled_responses = shuffleResponses(full_seed);

    let response_index = 0;

    big_screens = screen_size > 50

    let voting_html = []

    if (screen_count === 1) {
        voting_html.push(`<div class="voting_info">Generated 1 screen of 16607.</div>`)
    } else {
        voting_html.push(`<div class="voting_info">Generated ${screen_count} screens of ${small_screen_size}-${small_screen_size + 1}.</div>`)
    }

    if (big_screens) {
        voting_html.push(`<div class="voting_info">Due to large screen sizes, dragging has been disabled. Copying screens is recommended.</div>`)
        voting_html.push(`<p><button class="copy_all_button" onclick="copyAllScreens()">Copy All Screens</button></p>`)
    } else {
        voting_html.push(`<div class="voting_info">Drag responses to move them, then use the "Collapse Vote" button to obtain your vote! Use the "Copy Screen" button to copy the entire screen for use in external tools.</div>`)
        voting_html.push(`<p><button class="copy_all_button" onclick="copyAllScreens()">Copy All Screens</button><button class="copy_all_button" onclick="copyCollapsedVotes()">Copy All Collapsed Votes</button></p>`)
        voting_html.push(`<p><input type="checkbox" id="quote_fix" checked>Fix quotation marks in copied screens (for Google Sheets)</input></p>`)
    }

    voting_html.push(`<div class="voting_section">`)

    for (let screen = 0; screen < screen_count; screen++) {
        voting_html.push(`<div class="voting_screen" id="screen${screen}">`);
        voting_html.push(`<div class="screen_name">${section_name}-${screen + 1}</div>`);
        if (big_screens) {
            voting_html.push(`<div class="buttons"><button onclick="copyScreen(${screen})">Copy Screen</button></div>`);
            voting_html.push(`<table class="response_table"><tbody>`);
        } else {
            voting_html.push(`<div class="buttons"><button onclick="collapseToVote(${screen})">Collapse to Vote</button><button onclick="copyScreen(${screen})">Copy Screen</button></div>`);
            voting_html.push(`<table class="response_table"><tbody class="responses">`);
        }

        for (let i = 0; i < small_screen_size + (screen < big_screen_count ? 1 : 0); i++) {
            response = shuffled_responses[response_index]
            voting_html.push(`<tr>`);
            voting_html.push(`<th class="letter">${letters[i]}</th>`);
            voting_html.push(`<th class="response"><span class="response_text">${response}</span> <span class="word_count">${wordCount(response)}</span></th>`);
            voting_html.push(`</tr>`);
            response_index++;
        }

        voting_html.push("</tbody></table></div>")
    }

    voting_html.push("</div>")

    document.getElementById("voting").innerHTML = voting_html.join("");

    $( function() {
        $( ".responses" ).sortable();
    } );
}

uncollapsed_screens = []
collapsed = []

function collapseToVote(screen_num) {
    let vote_letters = $("#screen" + screen_num).find(".letter").text();
    let resultant_vote = `[${section_name}-${screen_num+1} ${vote_letters}]`;
    uncollapsed_screens[screen_num] = document.getElementById(`screen${screen_num}`).innerHTML;

    document.getElementById(`screen${screen_num}`).innerHTML = `<p><span class="collapsed_vote">${resultant_vote}</span> <button onclick="expandScreen(${screen_num})">Expand</button></p>`
    collapsed[screen_num] = true;
}

function expandScreen(screen_num) {
    document.getElementById(`screen${screen_num}`).innerHTML = uncollapsed_screens[screen_num];
    if (!big_screens) {
        $("#screen" + screen_num).find(".responses").sortable();
    }
    collapsed[screen_num] = false;
}

async function copyScreen(screen_num) {
    try {
        await navigator.clipboard.writeText(getScreenText(screen_num));
        alert("Screen copied!");
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

async function copyAllScreens() {
    screen_strings = []

    for (let i = 0; i < screen_count; i++) {
        screen_strings.push(getScreenText(i))
    }

    try {
        await navigator.clipboard.writeText(screen_strings.join("\n\n"));
        alert("Screens copied!");
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

async function copyScreen(screen_num) {
    try {
        await navigator.clipboard.writeText(getScreenText(screen_num));
        alert("Screen copied!");
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

async function copyCollapsedVotes() {
    try {
        let collapsed_votes = [];
        for (let i = 0; i < screen_count; i++) {
            if (collapsed[i]) {
                collapsed_votes.push($("#screen" + i).find(".collapsed_vote").text());
            }
        }
        let num_votes = collapsed_votes.length;
        if (num_votes === 0) {
            alert("No collapsed votes to copy.")
        } else {
            await navigator.clipboard.writeText(collapsed_votes.join("\n"));
            alert(`${num_votes} ${num_votes === 1 ? "vote" : "votes"} copied.`);
        }
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

function getScreenText(screen_num) {
    quote_fix = document.getElementById("quote_fix").checked

    let response_rows = $("#screen" + screen_num).find("tr")
    let screen_size = response_rows.length

    let screen_lines = [`${section_name}-${screen_num+1}`]
    
    for (let i = 0; i < screen_size; i++) {
        let letter = response_rows.eq(i).find(".letter").text();
        let response = response_rows.eq(i).find(".response_text").text();

        if (quote_fix) {
            response = response.replace(/"\b/, "“").replace(`"`, "”").replace(/'\b/, "‘").replace("'", "’")
        }

        screen_lines.push(`${letter}\t${response}`);
    }

    return screen_lines.join("\n");
}