import { expect, test } from '@jest/globals';
import { Token, TokenType, tokenize, tokenizeLine } from "../src/tokenizer";
import { readFileSync } from 'fs';

// helper function to make test cases less redundent
const tester = (line: string, expected: Token[]) => test(`tokenize: ${line}`, () => expect(tokenizeLine(line)).toStrictEqual(expected));
const fileTester = (file: string, expected: Token[]) => test(`tokenize file: ${file}`, () => expect(tokenize(readFileSync(`asm/${file}`, "utf-8"))).toStrictEqual(expected));

// this one is crazy LOL
fileTester("hello.asm", [
    { type: TokenType.IDENTIFIER, value: "data" },
    { type: TokenType.IDENTIFIER, value: "msg" },
    { type: TokenType.COLON, value: ":" },
    { type: TokenType.IDENTIFIER, value: "asciiz" },
    { type: TokenType.STRING, value: "\nHello, World!\n" },
    { type: TokenType.IDENTIFIER, value: "text" },
    { type: TokenType.IDENTIFIER, value: "main" },
    { type: TokenType.COLON, value: ":" },
    { type: TokenType.IDENTIFIER, value: "li" },
    { type: TokenType.REGISTER, value: "$v0" },
    { type: TokenType.COMMA, value: "," },
    { type: TokenType.IMMEDIATE, value: "4" },
    { type: TokenType.IDENTIFIER, value: "la" },
    { type: TokenType.REGISTER, value: "$a0" },
    { type: TokenType.COMMA, value: "," },
    { type: TokenType.IDENTIFIER, value: "msg" },
    { type: TokenType.IDENTIFIER, value: "syscall" },
    { type: TokenType.IDENTIFIER, value: "li" },
    { type: TokenType.REGISTER, value: "$v0" },
    { type: TokenType.COMMA, value: "," },
    { type: TokenType.IMMEDIATE, value: "10" },
    { type: TokenType.IDENTIFIER, value: "syscall" },
    { type: TokenType.EOF, value: "EOF" }

]);

// simple mips la instruction
tester("la $t0, label", [
    { type: TokenType.IDENTIFIER, value: "la" },
    { type: TokenType.REGISTER, value: "$t0" }, 
    { type: TokenType.COMMA, value: "," }, 
    { type: TokenType.IDENTIFIER, value: "label" },
]);

// label
tester("main:", [
    { type: TokenType.IDENTIFIER, value: "main" },
    { type: TokenType.COLON, value: ":" }
]);

// parse some literals
tester("li  $v0,    4", [
    { type: TokenType.IDENTIFIER, value: "li"},
    { type: TokenType.REGISTER, value: "$v0" }, 
    { type: TokenType.COMMA, value: "," }, 
    { type: TokenType.IMMEDIATE, value: "4" },
]);

// comments shouldn't tokenize
tester("# Comment should be nothing", []);

// stop parsing line at comment
tester("li  $v0,    4 # still shouldn't parse comment", [
    { type: TokenType.IDENTIFIER, value: "li"},
    { type: TokenType.REGISTER, value: "$v0" }, 
    { type: TokenType.COMMA, value: "," }, 
    { type: TokenType.IMMEDIATE, value: "4" },
]);

// valid syntax still will tokenize (tabs)
tester("mov\t$r4,\t4123", [
    { type: TokenType.IDENTIFIER, value: "mov"},
    { type: TokenType.REGISTER, value: "$r4" }, 
    { type: TokenType.COMMA, value: "," }, 
    { type: TokenType.IMMEDIATE, value: "4123" },
]);

// more complex syntax
tester("sb $t1, varStrRev($t3)", [
    { type: TokenType.IDENTIFIER, value: "sb" },
    { type: TokenType.REGISTER, value: "$t1" },
    { type: TokenType.COMMA, value: "," },
    { type: TokenType.IDENTIFIER, value: "varStrRev" },
    { type: TokenType.OPEN_PARENTHESIS, value: "(" },
    { type: TokenType.REGISTER, value: "$t3" },
    { type: TokenType.CLOSE_PARENTHESIS, value: ")" },
]);

tester("bgt $t2, $t1, switchCase # comment", [
    { type: TokenType.IDENTIFIER, value: "bgt" },
    { type: TokenType.REGISTER, value: "$t2" },
    { type: TokenType.COMMA, value: "," },
    { type: TokenType.REGISTER, value: "$t1" },
    { type: TokenType.COMMA, value: "," },
    { type: TokenType.IDENTIFIER, value: "switchCase" },
]);

tester("nine: .asciiz \"Nine\"", [
    { type: TokenType.IDENTIFIER, value: "nine" },
    { type: TokenType.COLON, value: ":" },
    { type: TokenType.IDENTIFIER, value: "asciiz" },
    { type: TokenType.STRING, value: "Nine" },
]);

tester("    syscall", [
    { type: TokenType.IDENTIFIER, value: "syscall" }
]);