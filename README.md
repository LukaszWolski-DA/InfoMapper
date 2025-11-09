# InfoMapper

A Data Warehouse metadata automation tool for managing logical data models, source systems, and mappings.

## Quick Start

```bash
# Install dependencies
npm ci

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Object Management** - Define concepts, entities, and attributes
- **Model Diagrams** - Visual entity relationship diagrams
- **Source Integration** - Import and manage source metadata
- **Mapping** - Connect sources to logical models
- **Requirements** - Track functional and non-functional requirements
- **Catalog** - Search and filter all metadata

## Tech Stack

- Next.js 15.2
- React 19
- TypeScript 5
- Tailwind CSS
- shadcn/ui

## Documentation

See the `docs/` folder for comprehensive documentation:
- [Data Model](docs/INFOMAPPER_DATA_MODEL_v1.0.md)
- [Component Reference](docs/INFOMAPPER_COMPONENT_REFERENCE_v1.0.md)
- [UI/UX Guidelines](docs/ui-ux-consistency%20v1.md)

## Development

This project uses localStorage for data persistence. All state is managed through a centralized store with command-based mutations.

## License

MIT
