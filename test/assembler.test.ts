import { expect, test } from "@jest/globals";
import { tokenize } from "../src/tokenizer";
import { readFileSync } from "fs";
import { assemble } from "../src/assembler";

test("assembler: hello.asm", () => {
    let tokens = tokenize(readFileSync(`asm/hello.asm`, "utf-8"));
    assemble(tokens);
    expect(true).toBe(true);
});

test("assembler: branching.asm", () => {
    let tokens = tokenize(readFileSync(`asm/branching.asm`, "utf-8"));
    assemble(tokens);
    expect(true).toBe(true);
});