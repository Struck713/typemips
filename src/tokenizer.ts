
export enum Instructions {

    ADD = "add",
    ADD_IMMEDIATE = "addi",
    ADD_UNSIGNED = "addu",
    ADD_IMMEDIATE_UNSIGNED = "addiu",
    SUBTRACT = "sub",
    SUBTRACT_UNSIGNED = "subu",
    MULTIPLY = "mult",
    MULTIPLY_NO_OVERFLOW = "mul",
    DIVIDE = "div",
    AND = "and",
    AND_IMMEDIATE = "andi",
    OR = "or",
    SHIFT_LEFT = "sll",
    SHIFT_RIGHT = "srl",
    LOAD_WORD = "lw",
    STORE_WORD = "sw",
    LOAD_UPPER_IMMEDIATE = "lui",
    LOAD_ADDRESS = "la",
    LOAD_IMMEDIATE = "li",
    MOVE_FROM_HI = "mfhi",
    MOVE_FROM_LO = "mflo",
    MOVE = "move",
    BRANCH_ON_EQUAL = "beq",
    BRANCH_ON_NOT_EQUAL = "bne",
    BRANCH_ON_GREATER_THAN = "bgt",
    BRANCH_ON_GREATER_THAN_OR_EQUAL = "bge",
    BRANCH_ON_LESS_THAN = "blt",
    BRANCH_ON_LESS_THAN_OR_EQUAL = "ble",
    SET_ON_LESS_THAN = "slt",
    SET_ON_LESS_THAN_IMMEDIATE = "slti",
    JUMP = "j",
    JUMP_AND_LINK_REGISTER = "jr",
    JUMP_AND_LINK = "jal",

}

export enum TokenType {
    REGISTER = "register",
    IDENTIFIER = "identifier",
    COMMA = "comma",
    COLON = "colon",
    OPEN_PARENTHESIS = "open_parenthesis",
    CLOSE_PARENTHESIS = "close_parenthesis",
    NEWLINE = "newline",
    WHITESPACE = "whitespace",
    COMMENT = "comment",
    IMMEDIATE = "immediate",
    STRING = "string",
    CHARACTER = "character",
    EOF = "eof"
}

export type Token = { type: TokenType, value: string }

const NUMBER_REGEX = /[xa-fA-F0-9]+/;
const ALPHABET_REGEX = /[a-zA-Z]/;
const REGISTER_REGEX = /[a-zA-Z0-9]/;
const IDENFITIFER_REGEX = /[a-zA-Z0-9_]/;

const QUOTE = "'";
const DOUBLE_QUOTE = "\"";

/**
 * Tokenize an entire file of MIPS Assembly code.
 * 
 * @param text All of the lines in the file
 * @returns The tokens for the entire file
 */
export const tokenize = (text: string) => {
    let tokens: Token[] = [];

    // split the text into lines
    let lines = text.split("\n");
    for (let line of lines) tokens.push(...tokenizeLine(line));

    tokens.push({ type: TokenType.EOF, value: "EOF" });
    return tokens;
}

/**
 * Since MIPS Assembly is line-by-line, we can tokenize a single line at a time.
 * 
 * @param line The line of source to tokenize
 * @returns 
 */
export const tokenizeLine = (line: string) => {
    
    let tokens: Token[] = [];
    let cursor = 0;

    const next = () => {
        let char = line[cursor++];
        if (char === "\\") {
            char = line[cursor++];
            if (char === "n") return "\n";
            else if (char === "t") return "\t";
            else if (char === "\\") return "\\";
            else if (char === "\"") return "\"";
            else throw new Error(`Invalid escape sequence: \\${char}`);
        }
        return char;
    }

    const peek = () => {
        return line[cursor] ?? '\0';
    }

    while (cursor < line.length) {
        let char = next();
        if (char === "#") break; // end the parsing with the comment
        else if (char === ",") tokens.push({ type: TokenType.COMMA, value: char });
        else if (char === ":") tokens.push({ type: TokenType.COLON, value: char });
        else if (char === "(") tokens.push({ type: TokenType.OPEN_PARENTHESIS, value: char });
        else if (char === ")") tokens.push({ type: TokenType.CLOSE_PARENTHESIS, value: char });
        // else if (char === QUOTE) {
        //     let value = next();
        //     next(); // consume the closing quote
        //     tokens.push({ type: TokenType.CHARACTER, value });
        // } 
        else if (char === DOUBLE_QUOTE) {
            let value = "";
            while (peek() !== DOUBLE_QUOTE) value += next();
            next(); // consume the closing double quote
            tokens.push({ type: TokenType.STRING, value });
        } else if (char.match(ALPHABET_REGEX)) {
            let value = char;
            while (peek().match(IDENFITIFER_REGEX)) value += next();
            tokens.push({ type: TokenType.IDENTIFIER, value });
        } else if (char.match(NUMBER_REGEX)) {
            let value = char;
            while (peek().match(NUMBER_REGEX)) value += next();
            tokens.push({ type: TokenType.IMMEDIATE, value });
        } else if (char === "$") {
            let value = char;
            while (peek().match(REGISTER_REGEX)) value += next();
            tokens.push({ type: TokenType.REGISTER, value });
        }
    }

    return tokens;
}