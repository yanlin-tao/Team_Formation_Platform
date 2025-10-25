Based on the comments in stage 2, we have the following changes:

## problem 1: "Your UML includes foreign keys and data types, which are implementation details. Keep the conceptual diagram free of FKs or SQL domains."(-1)

As for this problem, we have modified our UML, following shows our old UML and our updated UML(remove implementation details related to foreign keys). 

### old UML diagram
<p align="left">
    <img src="./img_src/UML_diagram.png" alt="old UML_diagram"
        style="width:300px; height:auto; max-width:30%;">
</p>

### modified UML diagram
<p align="left">
    <img src="./img_src/modified_UML diagram.png" alt="modified UML_diagram"
        style="width:300px; height:auto; max-width:30%;">
</p>

## problem 2: "In UserSkill, the two FKs should also form a composite primary key since it’s a many-to-many table."(-1)

As for this problem, we just updated our **III. Logical Design — Relational Schema** as follow:

### old version: 
<p align="left">
    <img src="./img_src/ST2_Q2_original.png" alt="original userskill"
        style="width:300px; height:auto; max-width:30%;">
</p>

### modified version:
<p align="left">
    <img src="./img_src/ST2_Q2_modified.png" alt="updated userskill"
        style="width:300px; height:auto; max-width:30%;">
</p>
