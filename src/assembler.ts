import { parse } from "path";
import { Instructions, Token, TokenType } from "./tokenizer";
import { env, exit } from "process";
import { read, write } from "./utils/console";
import { EOF } from "dns";

class Assembler {

    private cursor: number;
    private tokens: Token[];
    private environment: { 
        [key: string]: (string | number) 
    };

    constructor(tokens: Token[]) {
        this.cursor = 0;
        this.tokens = tokens;
        this.environment = {
            "$0": 0,
        };
    }

    /**
     * We need to do a preprocessor pass to collect all of the labels for jumping, since you
     * can technically jump forward or backwards in MIPS at will.
     */
    preprocess = () => {
        while (this.cursor < this.tokens.length) {
            let { type } = this.next();
            if (type == TokenType.IDENTIFIER && this.peek().type == TokenType.COLON) 
                this.assemble_label();
        }
        this.cursor = 0;
    }

    assemble = async () => {

        this.preprocess(); // preprocess labels

        const instructions = Object.values(Instructions);
        while (this.cursor < this.tokens.length) {
            let { type, value } = this.next();
            if (type == TokenType.IDENTIFIER) {
                if (instructions.includes(value as Instructions)) this.assemble_instruction(value as Instructions);
                else if (value === "syscall") await this.assemble_syscall();
                //else throw new Error(`Identifier "${value}" was not recognized!`);
            }

            // exit abnormally if we hit the end of the file
            // if(type == TokenType.EOF) exit(1); 
        }
    }

    assemble_instruction = (instruction: Instructions) => {
        let register, addressTo, registerFrom, registerTo, registerLeft, registerRight;
        switch (instruction) {

            // LOAD AND STORE
            case Instructions.LOAD_IMMEDIATE:
                register = this.parse_register();
                this.cursor++; // skip the comma
                let immediate = this.parse_immediate();
                this.write_environment(register, immediate);
                break;
            case Instructions.LOAD_ADDRESS:
                register = this.parse_register();
                this.cursor++; // skip the comma
                let label = this.parse_address();
                this.write_environment(register, label)
                break;
            case Instructions.MOVE:
                registerTo = this.parse_register();
                this.cursor++; // skip the comma
                registerFrom = this.parse_register();
                this.write_environment(registerTo, this.read_environment(registerFrom));
                break;

            // ARITMETIC OPERATIONS
            case Instructions.ADD:
                registerTo = this.parse_register();
                this.cursor++; // skip the comma
                registerLeft = this.parse_register();
                this.cursor++; // skip the comma
                registerRight = this.parse_register();
                this.write_environment(registerTo, (this.read_environment<number>(registerLeft) + this.read_environment<number>(registerRight)));
                break;
            case Instructions.SUBTRACT:
                registerTo = this.parse_register();
                this.cursor++; // skip the comma
                registerLeft = this.parse_register();
                this.cursor++; // skip the comma
                registerRight = this.parse_register();
                this.write_environment(registerTo, (this.read_environment<number>(registerLeft) - this.read_environment<number>(registerRight)));
                break;
            case Instructions.SET_ON_LESS_THAN:
                registerTo = this.parse_register();
                this.cursor++; // skip the comma
                registerLeft = this.parse_register();
                this.cursor++; // skip the comma
                registerRight = this.parse_register();
                this.write_environment(registerTo, (this.read_environment(registerLeft) < this.read_environment(registerRight)) ? 1 : 0);
                break;

            // BRANCHING
            case Instructions.JUMP_AND_LINK: this.write_environment("$ra", this.cursor + 1);
            case Instructions.JUMP:
                addressTo = this.parse_address();
                this.cursor = this.read_environment<number>(addressTo);
                break;
            case Instructions.JUMP_AND_LINK_REGISTER:
                registerTo = this.parse_register();
                this.cursor = this.read_environment<number>(registerTo);
                break;
            case Instructions.BRANCH_ON_EQUAL:
                registerLeft = this.parse_register();
                this.cursor++; // skip the comma
                registerRight = this.parse_register();
                this.cursor++; // skip the comma
                addressTo = this.parse_address();
                if (this.read_environment<number>(registerLeft) === this.read_environment<number>(registerRight)) 
                    this.cursor = this.read_environment<number>(addressTo);
                break;
            case Instructions.BRANCH_ON_NOT_EQUAL:
                registerLeft = this.parse_register();
                this.cursor++; // skip the comma
                registerRight = this.parse_register();
                this.cursor++; // skip the comma
                addressTo = this.parse_address();
                if (this.read_environment<number>(registerLeft) !== this.read_environment<number>(registerRight)) 
                    this.cursor = this.read_environment<number>(addressTo);
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
                    if (string.type == TokenType.STRING) this.write_environment(label.value, string.value);
                    else throw new Error(`Expected string, got ${string.value}`);
                    return;
                }

                // could be a word
                if (next.value == "word") {
                    this.next();
                    let string = this.peek();
                    if (string.type == TokenType.STRING) this.write_environment(label.value, string.value);
                    else throw new Error(`Expected string, got ${string.value}`);
                    return;
                }

                // if it is a label that is NOT a word or a string, then it is a group of code, we want the cursor to go back to the label
                this.write_environment(label.value, this.cursor);
            }
        };
    }

    // https://courses.missouristate.edu/kenvollmar/mars/help/syscallhelp.html
    assemble_syscall = async () => {
        let type = this.read_environment("$v0");

        switch (type) {
            case 1: 
                write(this.read_environment("$a0"), process.stdout); 
                break;
            case 4: // print null terminated string
                let address = this.read_environment("$a0");
                let string = this.read_environment(address as string);
                write(string, process.stdout);
                break;
            case 5: // read integer from standard input
                this.write_environment("$v0", Number(await read(process.stdin)));
                break;
            case 10: // terminate program
                exit(0);
                break;
            case 11: // print character

            default:
                throw new Error(`Syscall ${type} is not implemented!`);
        }
        
    }

    parse_register = () => {
        let { type, value } = this.next();
        if (type == TokenType.REGISTER) return value as string;
        else throw new Error(`Expected register, got ${value}`);
    }
    
    parse_immediate = () => {
        let { type, value } = this.next();
        if (type == TokenType.IMMEDIATE) return parseInt(value);
        else throw new Error(`Expected immediate value, got ${value}`);
    }

    parse_address = () => {
        let { type, value } = this.next();
        if (type == TokenType.IDENTIFIER) return value as string;
        else throw new Error(`Expected address value, got ${value}`);
    }

    read_environment = <T = string | number>(key: string) => this.environment[key] as T ?? 0;
    write_environment = (key: string, value: string | number) => this.environment[key] = value;
    next = () => this.tokens[this.cursor++];
    peek = () => this.tokens[this.cursor];
    peekLast = () => this.tokens[this.cursor - 1] ?? { type: TokenType.EOF, value: "EOF" };

}

export const assemble = (tokens: Token[]) => {
    const assembler: Assembler = new Assembler(tokens);
    assembler.assemble();
    return assembler;
}