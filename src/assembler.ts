import { parse } from "path";
import { Instructions, Token, TokenType } from "./tokenizer";
import { env } from "process";
import { read } from "./utils/console";

class Assembler {

    private cursor: number;
    private tokens: Token[];
    private environment: { 
        [key: string]: (string | number) 
    };

    constructor(tokens: Token[]) {
        this.cursor = 0;
        this.tokens = tokens;
        this.environment = {};
    }

    assemble = async () => {
        const instructions = Object.values(Instructions);
        while (this.cursor < this.tokens.length) {
            let { type, value } = this.next();
            if (type == TokenType.IDENTIFIER) {
                if (instructions.includes(value as Instructions)) this.assemble_instruction(value as Instructions);
                else if (value === "syscall") await this.assemble_syscall();
                else if (this.peek().type == TokenType.COLON) this.assemble_label();
            }
        }
        console.log(this.environment);
    }

    assemble_instruction = (instruction: Instructions) => {
        let register;
        switch (instruction) {
            case Instructions.LOAD_IMMEDIATE:
                register = this.parse_register();
                this.cursor++; // skip the comma
                let immediate = this.parse_immediate();
                this.environment[register] = immediate;
                break;
            case Instructions.LOAD_ADDRESS:
                register = this.parse_register();
                this.cursor++; // skip the comma
                let label = this.parse_address();
                this.environment[register] = label;
                break;
            case Instructions.MOVE:
                let registerTo = this.parse_register();
                this.cursor++; // skip the comma
                let registerFrom = this.parse_register();
                this.environment[registerTo] = this.environment[registerFrom];
                break;
            default:
                throw new Error(`Instruction ${instruction} not implemented`);
        }
    }

    assemble_label = () => {
        let label = this.peekLast();
        if (label.type === TokenType.IDENTIFIER) {
            this.next(); // skip the colon
            let next = this.peek();
            if (next.type === TokenType.IDENTIFIER) { // modify the environment (or not)

                // ascii string
                if (next.value == "asciiz") {
                    this.next();
                    let string = this.peek();
                    if (string.type == TokenType.STRING) this.environment[label.value] = string.value;
                    else throw new Error(`Expected string, got ${string.value}`);
                    return;
                }

                // could be a word
                if (next.value == "word") {
                    this.next();
                    let string = this.peek();
                    if (string.type == TokenType.STRING) this.environment[label.value] = string.value;
                    else throw new Error(`Expected string, got ${string.value}`);
                    return;
                }


                // if it is a label that is NOT a word or a string, then it is a group of code, we want the cursor to go back to the label
                this.environment[label.value] = this.cursor;

            }
        };
    }

    // https://courses.missouristate.edu/kenvollmar/mars/help/syscallhelp.html
    assemble_syscall = async () => {
        let type = this.environment["$v0"];

        // print a ascii string
        if (type === 4) {
            let address = this.environment["$a0"];
            let string = this.environment[address];
            process.stdout.write(string as string, 'ascii');
        }

        // read an integer
        if (type === 5) {
            this.environment["$v0"] = await read(process.stdin);
        }


    }

    parse_register = () => {
        let { type, value } = this.next();
        if (type == TokenType.REGISTER) return value;
        else throw new Error(`Expected register, got ${value}`);
    }
    
    parse_immediate = () => {
        let { type, value } = this.next();
        if (type == TokenType.IMMEDIATE) return Number(value);
        else throw new Error(`Expected immediate value, got ${value}`);
    }

    parse_address = () => {
        let { type, value } = this.next();
        if (type == TokenType.IDENTIFIER) return value;
        else throw new Error(`Expected address value, got ${value}`);
    }

    next = () => this.tokens[this.cursor++];
    peek = () => this.tokens[this.cursor];
    peekLast = () => this.tokens[this.cursor - 1] ?? { type: TokenType.EOF, value: "EOF" };

}

export const assemble = (tokens: Token[]) => {
    const assembler: Assembler = new Assembler(tokens);
    return assembler.assemble();
}