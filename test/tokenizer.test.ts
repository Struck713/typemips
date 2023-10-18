import { expect, test } from '@jest/globals';
import { Token, tokenize } from "../src/tokenizer";

// helper function to make test cases less redundent
const tester = (line: any, expected: any) => test(`tokenize: ${line}`, () => expect(tokenize(line)).toBe(expected));

tester("la $t0, label", []);