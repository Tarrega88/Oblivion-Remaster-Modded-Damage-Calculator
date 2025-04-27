const to3Decimals = (num) => Math.round(num * 1000) / 1000;
const to2Decimals = (num) => Math.round(num * 100) / 100;

const difficultyNames = ["Novice", "Apprentice", "Adept", "Expert", "Master"];
const damageMult = [1.5, 2, 3]; //The "More Damage" mod options
const sliderMult = [2.5, 0.25, 0.5, 0.75, 1]; //The "Difficulty Slider Fixed" mod options. Starts with vanilla at index 0. Calculated by the difference between adept and expert on Damage Taken

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

const flat = sliderOutput.flat();

const uniqueFlat = [];

const seen = new Set();

for (const entry of flat) {
    const key = `${entry.taken}-${entry.dealt}`;
    if (!seen.has(key)) {
        seen.add(key);
        uniqueFlat.push(entry);
    }
}

const sortedByTaken = uniqueFlat.toSorted((a, b) => a.taken - b.taken); //Taking the least and ascending
const sortedByDealt = uniqueFlat.toSorted((a, b) => b.dealt - a.dealt); //Dealing the most and descending
const sortedByRelativeStrength = uniqueFlat.toSorted((a, b) => b.relativeStrength - a.relativeStrength);

function exportToCSV(array, filename = "damage_table.csv") {
    const headers = Object.keys(array[0]).join(",") + "\n";
    const rows = array.map(obj => Object.values(obj).join(",")).join("\n");
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

function renderTable(array, titleText) {
    const container = document.createElement("div");

    const title = document.createElement("h2");
    title.innerText = titleText;
    container.appendChild(title);

    const table = document.createElement("table");
    const headers = Object.keys(array[0]);

    const headerRow = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.innerText = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    array.forEach(obj => {
        const row = document.createElement("tr");
        headers.forEach(header => {
            const td = document.createElement("td");
            td.innerText = obj[header];
            row.appendChild(td);
        });
        table.appendChild(row);
    });

    container.appendChild(table);
    document.body.appendChild(container);
}

renderTable(sortedByRelativeStrength, "Sorted by Relative Strength");
renderTable(sortedByDealt, "Sorted by Damage Dealt");
renderTable(sortedByTaken, "Sorted by Damage Taken");


if (confirm("OK to Download CSV Files - Cancel to Just View")) {
    exportToCSV(sortedByRelativeStrength, "sortedByRelativeStrength.csv");
    exportToCSV(sortedByDealt, "sortedByDamageDealt.csv");
    exportToCSV(sortedByTaken, "sortedByDamageTaken.csv");
}

//Legacy code of the loop over sliderMult. This version manually inputs the data into the difficulties array.
/*
// for (const mult of sliderMult) {

//     const noviceDealt = 1 + 2 * mult;
//     const noviceTaken = to3Decimals(1 / noviceDealt);
//     const apprenticeDealt = noviceDealt - mult;
//     const apprenticeTaken = to3Decimals(1 / apprenticeDealt);

//     const expertDealt = apprenticeTaken;
//     const expertTaken = apprenticeDealt;

//     const masterDealt = noviceTaken;
//     const masterTaken = noviceDealt;

//     const sliderModName = noviceDealt === 6 ? "Vanilla" : `x${noviceDealt}`;
//     const damageModName = "Vanilla";
//     const difficulties = [{ sliderModName, damageModName, difficultyName: "Novice", taken: noviceTaken, dealt: noviceDealt, relativeStrength: to2Decimals(noviceDealt / noviceTaken) }, { sliderModName, damageModName, difficultyName: "Apprentice", taken: apprenticeTaken, dealt: apprenticeDealt, relativeStrength: to2Decimals(apprenticeDealt / apprenticeTaken) }, { sliderModName, damageModName, difficultyName: "Adept", taken: adeptTaken, dealt: adeptDealt, relativeStrength: to2Decimals(adeptDealt / adeptTaken) }, { sliderModName, damageModName, difficultyName: "Expert", taken: expertTaken, dealt: expertDealt, relativeStrength: to2Decimals(expertDealt / expertTaken) }, { sliderModName, damageModName, difficultyName: "Master", taken: masterTaken, dealt: masterDealt, relativeStrength: to2Decimals(masterDealt / masterTaken) }];
//     sliderOutput.push(difficulties);

//     const damageModDifficulties = [];
//     for (const damageMultValue of damageMult) {
//         const damageModName = `x${damageMultValue.toString()}`;
//         for (let i = 0; i < difficulties.length; i++) {
//             const difficultyWithMult = { ...difficulties[i] };
//             difficultyWithMult.damageModName = damageModName;
//             difficultyWithMult.taken = to2Decimals(difficultyWithMult.taken * damageMultValue);
//             difficultyWithMult.dealt = to2Decimals(difficultyWithMult.dealt * damageMultValue);
//             damageModDifficulties.push(difficultyWithMult);
//         }
//     }
//     difficulties.push(...damageModDifficulties);
// }

*/