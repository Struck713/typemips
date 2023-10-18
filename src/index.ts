import { readFileSync } from "fs";
import { tokenize } from "./tokenizer";

(async () => {
    const asm = await readFileSync("asm/hello.asm", "utf-8");
    console.log(JSON.stringify(tokenize(asm), null, 2));
})();