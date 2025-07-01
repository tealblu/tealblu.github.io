---
date: 2025-01-15
keywords: electronics, diy, electrolysis, constant-current, circuit-design
title: DIY Electrolysis Machine
tags:
categories:
lastMod: 2025-01-15
---

### Description:
This project explores the design and construction of a DIY electrolysis machine using constant-current control circuitry. The system automatically maintains precise current levels (typically 0.7 mA) for safe galvanic electrolysis applications, eliminating the need for manual voltage adjustments during treatment.

### Research Background:
Based on community research and feedback, the optimal approach involves using a constant-current circuit that automatically adjusts voltage to maintain the target amperage. This ensures consistent treatment while preventing overcurrent conditions that could cause skin damage.

### Circuit Design Approach:

  + #### Current Control Strategy
The system uses feedback control to maintain constant current rather than constant voltage. As noted in community discussions: "Before the first hair in each session I set the target amps, usually .0007, using the test switch. The voltage is set at a low end, say 6v. Try a hair. If I am not getting .0007 amps, increase volts."

  + #### Component Selection
Initial research suggested using an LM2596 voltage regulator with manual adjustment, but a constant-current (CC-CV) module or dedicated constant-current circuit provides better automation and safety.

### Constant-Current Circuit Design:

  + #### Core Components
The circuit requires several key components for proper operation:

    + **Op-amp (LM358)** - Acts as the feedback controller to compare actual current to the target
    + **N-channel MOSFET (2N7000)** - Adjusts voltage to the load based on op-amp output  
    + **Current Sense Resistor (100 Ω, 0.25W)** - Converts current to measurable voltage (70 mV at 0.7 mA)
    + **Voltage Reference (LM385-1.2V or 1.25V Zener)** - Provides stable reference voltage for comparison
    + **Voltage Divider Resistors (16 kΩ and 1 kΩ)** - Scales reference voltage to 70 mV target
    + **9V Battery** - Pure DC power supply, safe for skin contact
    + **Decoupling Capacitors (0.1 µF ceramic)** - Stabilizes op-amp and reference voltage

### Circuit Operation:

  + #### Current Sensing
The 100 Ω resistor placed in series with the load creates a voltage drop proportional to current:
```
Vsense = Itarget × Rsense = 0.0007 A × 100 Ω = 0.07 V (70 mV)
```

  + #### Voltage Reference Generation
The stable reference voltage is divided down to match the target sense voltage:
```
R1 = 16 kΩ, R2 = 1 kΩ ⇒ Vref = 1.2 V × (R2/(R1+R2)) = 70 mV
```

  + #### Feedback Control Loop
The op-amp compares the sense voltage to the reference voltage and adjusts the MOSFET gate voltage to maintain constant current. When current is too low, the op-amp increases gate voltage allowing more current. When current is too high, it reduces gate voltage.

### Safety Considerations:

  + #### Polarity Requirements
Proper polarity is critical for safe operation. The needle connects to the positive terminal (anode) and the return electrode to ground (cathode). Reversing polarity risks metal deposition into the skin.

  + #### Power Supply Safety
Use pure DC power sources only. AC adapters and components that store significant charge should be avoided to prevent shock hazards.

  + #### Current Limiting
The constant-current design inherently limits maximum current, providing built-in safety protection against equipment malfunction or user error.

### Optional Enhancements:

  + #### Visual Feedback
Adding an LED indicator can show when current is within the target range, providing immediate feedback during operation.

  + #### Adjustable Current Range
A potentiometer in the voltage divider allows adjustment of target current (e.g., 0.5–1 mA range) for different treatment requirements.

  + #### Current Monitoring
A panel ammeter module provides real-time current display for precise monitoring during treatment sessions.

### Links:

  + [Reddit Discussion - MtF Community](https://www.reddit.com/r/MtF/comments/1hjb25m/comment/m35aa99/)
  + [French DIY Electrolysis Guide](https://trrransgrrrls.wordpress.com/2024/09/07/epilation-electrolyse-on-fait-ca-soi-meme/)
  + [LM358 Op-amp Datasheet](https://www.ti.com/product/LM358)
  + [2N7000 MOSFET Datasheet](https://www.onsemi.com/products/discrete-semiconductors/mosfets/2n7000)