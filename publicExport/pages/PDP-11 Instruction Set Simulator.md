---
date: 2024-01-21
keywords: code, coding, pdp11, assembly, school
title: PDP-11 Instruction Set Simulator
tags:
categories:
lastMod: 2024-06-23
---
### Description:
This is a C program that accurately simulates the PDP-11 computer's assembly language, complete with virtual memory, CPU registers, and a caching system. Input and output are performed through the command line or through files.
![A brief tour of the PDP-11, the most influential minicomputer of all time |  Ars Technica](https://cdn.arstechnica.net/wp-content/uploads/2013/10/unix-creators.jpg)

### Instruction Set:
The PDP-11 instruction set contains 12 basic operations to be performed on memory addresses. Operands are represented by 16-bit words, with the leftmost bits containing the opcode and the rightmost bits containing source, destination, and register addresses. In addition, many other operands are supported, allowing for a wide variety of operations to be performed.

### Architecture:
The PDP-11 architecture is a 16-bit instruction set architecture developed by Digital Equipment Corporation for use with PDP-11 computers. It was widely used in the 1970s, but grew less popular in the 1980s and afterwards.

  + #### Memory
Memory is represented by 16-bit words in little-endian format. The smallest addressable unit of memory is 8 bits. Registers R0-R7 can each store one word, which points to a location in the computer's 64KB of memory. Low memory addresses are reserved for two-word vectors that serve as places to store the program counter and processor status.

  + #### CPU Registers
The PDP-11 contains eight general-purpose 16-bit registers (R0-R7). Register R7 stores the program counter. Other registers have common but not universal use cases.

  + #### Addressing Modes
The PDP-11 computer uses eight "addressing modes". Each addressing mode alters the operation of the registers as shown in the following chart.
|**Code**|**Name**|**Example**|**Description**|
|--|--|--|--|
|0n|Register|Rn|The operand is in Rn.|
|1n|Register deferred|(Rn)|Rn contains the address of the operand.|
|2n|Autoincrement|(Rn)+|Rn contains the address of the operand, then increment Rn.|
|3n|Autoincrement deferred|@(Rn)+|Rn contains the address of the address of the operand, then increment Rn by 2.|
|4n|Autodecrement|-(Rn)|Decrement Rn, then use the result as the address of the operand.|
|5n|Autodecrement deferred|@-(Rn)|Decrement Rn by 2, then use the result as the address of the address of the operand.|
|6n|Index|X(Rn)|Rn+X is the address of the operand.|
|7n|Index deferred|@X(Rn)|Rn+X is the address of the address of the operand.|

The Program Counter has four addressing modes, and the Stack has 6 addressing modes, both of which alter the operation of the system in their own way.

### Code Breakdown:

  + Memory addresses are stored in the following structure:

    + `int mode` stores the operating mode.

    + `int reg` stores the register on which the operation is being performed.

    + `int addr` stores addresses relevant to modes 1-7.

    + `int value` stores a relevant value.

```c
/* struct to help organize source and destination operand handling */
typedef struct ap {
    int mode;
    int reg;
    int addr; /* used only for modes 1-7 */
    int value;
} addr_phrase_t;
```

  + The following global variables are defined:

    + `uint16_t memory[MEMSIZE]` represents the simulated global memory, segregated into 16-bit chunks. `MEMSIZE` is a predefined variable that determines the amount of memory available to the system.

    + `uint16_t reg[8]` represents the 8 CPU registers, each capable of storing one 16-bit word.

    + `bool n, z, v, c` are single-bit condition codes used to indicate the status of the system.

    + All other global variables are used for statistics purposes and do not affect the operation of the system.

```c
// Global variables
uint16_t memory[MEMSIZE]; // 16-bit memory
uint16_t reg[8] = {0}; // R0-R7
bool n, z, v, c; // Condition codes

addr_phrase_t src, dst; // Source and destination address phrases

bool running; // Flag to indicate if the program is running
bool trace = false;
bool verbose = false;
int memory_reads = 0;
int memory_writes = 0;
int inst_fetches = 0;
int inst_execs = 0;
int branch_taken = 0;
int branch_execs = 0;
```

  + The following functions are defined:

    + `operate()` takes a 16-bit instruction as its input, interprets it, and performs the corresponding action.

    + `get_operand()`, `update_operand()`, and `put_operand()` all modify the operand.

    + `pstats()` and `pregs()` are defined for development purposes - they print statistics and the values of the registers, respectively.

    + The full code for each of these functions can be seen in the project's [GitHub Repository](https://github.com/tealblu/pdp11-sim)

```c
// Function prototypes
void operate(uint16_t instruction);
void get_operand(addr_phrase_t *phrase);
void update_operand(addr_phrase_t *phrase);
void put_operand(addr_phrase_t *phrase);
void add(uint16_t operand);
void asl(uint16_t operand);
void asr(uint16_t operand);
void beq(uint16_t operand);
void bne(uint16_t operand);
void br(uint16_t operand);
void cmp(uint16_t operand);
void halt(uint16_t operand);
void mov(uint16_t operand);
void sob(uint16_t operand);
void sub(uint16_t operand);
void pstats();
void pregs();
```

### Links

  + [GitHub Repository](https://github.com/tealblu/pdp11-sim)

  + [What the heck is a PDP-11?](https://en.wikipedia.org/wiki/PDP-11)

  + [PDP-11 Instruction Set](https://www.teach.cs.toronto.edu/~ajr/258/pdp11.pdf)
