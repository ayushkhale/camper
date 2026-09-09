# Project Rules & Automated Documentation Workflow

## Rule 1: Automatic Documentation Maintenance (`workflow.md`)
- Whenever maintained files, endpoints, components, UI layouts, or bug fixes are changed in `C:\Camper`, **AUTOMATICALLY** update `workflow.md` in the workspace root.
- Document every task item under **Section 10 (Date & Day-Wise Task Activity Log)** with date, component names, root cause, and changes made.
- Run `npm run docs:structure` after every file addition, move, rename, or deletion so the generated Excel-ready project inventory in **Section 12** matches the live workspace.
- Run `npm run check:imports` after source/import changes; it regenerates Section 12 before checking all local imports.
- Do not manually edit content between `<!-- PROJECT_STRUCTURE:START -->` and `<!-- PROJECT_STRUCTURE:END -->`; it is owned by the structure generator.
- Never wait for the user to ask for documentation updates. Keep `workflow.md` 100% synchronized automatically.
