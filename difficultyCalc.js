//Note: I have commented out the other tables on CSV generation near the bottom. Currently, this only generates one file now, which I think makes more sense, but I've left them in as comments in case anyone wants to generate all 3.
//The HTML render of the table provides a text description of the filters, based on what the "filters" object below is set to.

const to3Decimals = (num) => Math.round(num * 1000) / 1000;
const to2Decimals = (num) => Math.round(num * 100) / 100;

const difficultyNames = ["Novice", "Apprentice", "Adept", "Expert", "Master"];
const damageMult = [1.5, 2, 3]; //The "More Damage" mod options
const sliderMult = [2.5, 0.25, 0.5, 0.75, 1]; //The "Difficulty Slider Fixed" mod options. Starts with vanilla at index 0. Calculated by the difference between adept and expert on Damage Taken

//filters are in percent.
//These allow the option during table generation to ignore anything outside of their range. For instance, anything greater than 300% dealt damage would be ignored.
const filters = {
    maxDealt: 300, //300
    minDealt: 75, //75
    maxTaken: 500, //500
    minTaken: 80, //80
    maxRelative: 156, //156
    minRelative: 16 //16
}

//Whichever versions of the mods we add here, like x2 or x1.5, will take precedence and will not be overwritten if a duplicate of damage taken/damage dealt is found with another combination of the mods and difficulty settings.
const combinationPrecedence = [{ moreDamageVersion: "x2", sliderModVersion: "x2" }];

const sliderOutput = [];

const adeptDealt = 1;
const adeptTaken = 1;

for (const mult of sliderMult) {
    const noviceDealt = 1 + 2 * mult;
    const noviceTaken = to3Decimals(1 / noviceDealt);
    const apprenticeDealt = noviceDealt - mult;
    const apprenticeTaken = to3Decimals(1 / apprenticeDealt);

    const expertDealt = apprenticeTaken;
    const expertTaken = apprenticeDealt;

    const masterDealt = noviceTaken;
    const masterTaken = noviceDealt;

    const sliderModName = noviceDealt === 6 ? "Vanilla" : `x${noviceDealt}`;
    const damageModName = "Vanilla";

    const baseValues = [
        [noviceTaken, noviceDealt],
        [apprenticeTaken, apprenticeDealt],
        [adeptTaken, adeptDealt],
        [expertTaken, expertDealt],
        [masterTaken, masterDealt]
    ];

    const difficulties = difficultyNames.map((difficultyName, i) => {
        const [taken, dealt] = baseValues[i];
        return {
            sliderModName,
            damageModName,
            difficultyName,
            taken,
            dealt,
            relativeStrength: to2Decimals(dealt / taken)
        };
    });
    sliderOutput.push(difficulties);

    const damageModDifficulties = [];
    for (const damageMultValue of damageMult) {
        const damageModName = `x${damageMultValue}`;
        for (let i = 0; i < difficulties.length; i++) {
            const difficultyWithMult = { ...difficulties[i] };
            difficultyWithMult.damageModName = damageModName;
            difficultyWithMult.taken = to2Decimals(difficultyWithMult.taken * damageMultValue);
            difficultyWithMult.dealt = to2Decimals(difficultyWithMult.dealt * damageMultValue);
            damageModDifficulties.push(difficultyWithMult);
        }
    }
    difficulties.push(...damageModDifficulties);
}

const flat = sliderOutput.flat().toSorted((a, b) => {
    for (const combo of combinationPrecedence) {
        const aIsCombo = a.damageModName === combo.moreDamageVersion && a.sliderModName === combo.sliderModVersion;
        const bIsCombo = b.damageModName === combo.moreDamageVersion && b.sliderModName === combo.sliderModVersion;
        if (aIsCombo && !bIsCombo) return -1;
        if (!aIsCombo && bIsCombo) return 1;
    }
    return a.damageModName.localeCompare(b.damageModName) || a.sliderModName.localeCompare(b.sliderModName);
});

const seen = new Set();

function filterOutDuplicates() {
    const arr = [];
    for (const entry of flat) {
        const key = `${entry.taken}-${entry.dealt}`;
        if (!seen.has(key)) {
            seen.add(key);
            arr.push(entry);
        }
    }
    return arr;
}

const shallFilterDuplicates = confirm("Press OK to filter out any duplicates. Press Cancel to see all possible combinations, even if the damage dealt and taken is identical.");

const tableOfValues = shallFilterDuplicates ? filterOutDuplicates() : flat;

const sortedByTaken = tableOfValues.toSorted((a, b) => a.taken - b.taken); //Taking the least and ascending
const sortedByDealt = tableOfValues.toSorted((a, b) => b.dealt - a.dealt); //Dealing the most and descending
const sortedByRelativeStrength = tableOfValues.toSorted((a, b) => {
    if (b.relativeStrength !== a.relativeStrength) return b.relativeStrength - a.relativeStrength;
    return a.dealt - b.dealt;
})

const filteredRelativeStrength = sortedByRelativeStrength.filter(e => {
    const isWithinMinRelative = e.relativeStrength >= filters.minRelative / 100;
    const isWithinMaxRelative = e.relativeStrength <= filters.maxRelative / 100;
    const isWithinMinTaken = e.taken >= filters.minTaken / 100;
    const isWithinMaxTaken = e.taken <= filters.maxTaken / 100;
    const isWithinMinDealt = e.dealt >= filters.minDealt / 100;
    const isWithinMaxDealt = e.dealt <= filters.maxDealt / 100;

    if (e.sliderModName == "Vanilla" && e.damageModName == "Vanilla" || isWithinMinRelative && isWithinMaxRelative && isWithinMinTaken && isWithinMaxTaken && isWithinMinDealt && isWithinMaxDealt) {
        return true;
    }
    return false;
});

const filteredTaken = filteredRelativeStrength.toSorted((a, b) => a.taken - b.taken);
const filteredDealt = filteredRelativeStrength.toSorted((a, b) => b.dealt - a.dealt);

const tableHeaderText =
{
    sliderModName: "Slider Mod Version",
    damageModName: "More Damage Mod Version",
    difficultyName: "Difficulty",
    taken: "Damage Taken",
    dealt: "Damage Dealt",
    relativeStrength: "Relative Strength"
}

function generateFilterSummary(filters) {
    return `This table filters out all modded difficulties that fail to meet these criteria. The player must:
- Deal no more than ${filters.maxDealt}% damage
- Deal no less than ${filters.minDealt}% damage
- Take no more than ${filters.maxTaken}% damage
- Take no less than ${filters.minTaken}% damage
- Be no more than ${filters.maxRelative}% stronger than enemies
- Be no less than ${filters.minRelative}% the strength of enemies`;
}


function exportToCSV(array, filename = "damage_table.csv") {
    const headers = Object.keys(array[0]).map(e => tableHeaderText[e]).join(",") + "\n";

    const rows = array.map(obj => {
        return Object.keys(obj).map(header => {
            if (header === "taken" || header === "dealt" || header === "relativeStrength") {
                return Math.round(obj[header] * 100) + "%";
            } else {
                return obj[header];
            }
        }).join(",");
    }).join("\n");

    const csvContent = headers + rows;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



function renderTable(array, titleText, renderFilterText = false) {
    const container = document.createElement("div");

    const title = document.createElement("h2");
    title.innerText = titleText;
    container.appendChild(title);

    const filterSummary = document.createElement("p");
    filterSummary.innerText = generateFilterSummary(filters);
    filterSummary.style.whiteSpace = "pre-line";

    if (renderFilterText) container.appendChild(filterSummary);

    const table = document.createElement("table");
    const headers = Object.keys(array[0]);

    const headerRow = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.innerText = tableHeaderText[header];
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    array.forEach(obj => {
        const row = document.createElement("tr");
        headers.forEach(header => {
            const td = document.createElement("td");

            if (header === "taken" || header === "dealt" || header === "relativeStrength") {
                td.innerText = `${Math.round(obj[header] * 100)}%`;
            } else {
                td.innerText = obj[header];
            }

            row.appendChild(td);
        });
        table.appendChild(row);
    });

    container.appendChild(table);
    document.body.appendChild(container);
}



if (confirm(`Press OK to use filters, cancel to ignore filters.
Current Filters are that the Player Must:
- Deal no more than ${filters.maxDealt}% damage
- Deal no less than ${filters.minDealt}% damage
- Take no more than ${filters.maxTaken}% damage
- Take no less than ${filters.minTaken}% damage
- Be no more than ${filters.maxRelative}% stronger than enemies
- Be no less than ${filters.minRelative}% the strength of enemies
    `)) {
    renderTable(filteredRelativeStrength, "Filtered and Sorted by Relative Strength", true);
    renderTable(filteredDealt, "Filtered and Sorted by Damage Dealt");
    renderTable(filteredTaken, "Filtered and Sorted by Damage Taken");

    if (confirm("OK to Download CSV File - Cancel to Just View")) {
        exportToCSV(filteredRelativeStrength, "filteredRelativeStrength.csv");
        // exportToCSV(filteredDealt, "filteredDamageDealt.csv");
        // exportToCSV(filteredTaken, "filteredDamageTaken.csv");
    }
}
else {
    if (confirm("OK to Download CSV File - Cancel to Just View")) {
        exportToCSV(sortedByRelativeStrength, "sortedByRelativeStrength.csv");
        // exportToCSV(sortedByDealt, "sortedByDamageDealt.csv");
        // exportToCSV(sortedByTaken, "sortedByDamageTaken.csv");
    }
    else {
        renderTable(sortedByRelativeStrength, "Sorted by Relative Strength");
        renderTable(sortedByDealt, "Sorted by Damage Dealt");
        renderTable(sortedByTaken, "Sorted by Damage Taken");
    }
}