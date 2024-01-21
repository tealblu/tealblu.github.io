---
date: 2024-01-21
category: projects
keywords: code, coding, pdp11, assembly, school
title: My Projects/Code/pdp11-sim
tags:
categories: projects
lastMod: 2024-01-21
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

### Links

  + [GitHub Repository](https://github.com/tealblu/pdp11-sim)

  + [What the heck is a PDP-11?](https://en.wikipedia.org/wiki/PDP-11)

  + [PDP-11 Instruction Set](https://www.teach.cs.toronto.edu/~ajr/258/pdp11.pdf)
