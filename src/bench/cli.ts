import { runFidelity, formatFidelity } from "./fidelity.js";

// `winnow bench` — run the fidelity bench and print the savings + needle-survival table.
console.log(formatFidelity(runFidelity()));
