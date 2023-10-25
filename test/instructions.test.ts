import { expect, test } from "@jest/globals";
import { assemble } from "../src/assembler";
import { tokenize } from "../src/tokenizer";

test("instructions: li", () => {
    let program = `
        li $s0, 1065
        li $s1, 0x0101
        li $s2, 0xFFE12
    `;

    let assembler = assemble(tokenize(program));
    expect(assembler.read_environment("$s0")).toBe(1065);
    expect(assembler.read_environment("$s1")).toBe(257);
    expect(assembler.read_environment("$s2")).toBe(1048082);
});

test("instructions: la", () => {
    let program = `
        label: .asciiz "Hello World!"
        la $s0, label
    `;

    let assembler = assemble(tokenize(program));
    expect(assembler.read_environment("label")).toBe("Hello World!");
    expect(assembler.read_environment("$s0")).toBe("label");
});

test("instructions: add", () => {
    let program = `
        li $s0, 1065
        li $s1, 19
        add $s2, $s0, $s1
    `;

    let assembler = assemble(tokenize(program));
    expect(assembler.read_environment("$s0")).toBe(1065);
    expect(assembler.read_environment("$s1")).toBe(19);
    expect(assembler.read_environment("$s2")).toBe(1084);
});

test("instructions: mov", () => {
    let program = `
        li $s0, 15
        li $s1, 20
        move $s4, $s1
        add $s2, $s0, $s4
    `;

    let assembler = assemble(tokenize(program));
    expect(assembler.read_environment("$s0")).toBe(15);
    expect(assembler.read_environment("$s1")).toBe(20);
    expect(assembler.read_environment("$s4")).toBe(20);
    expect(assembler.read_environment("$s2")).toBe(35);
});