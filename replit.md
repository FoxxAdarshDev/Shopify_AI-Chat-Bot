# Overview

This is a Shopify AI Chat Bot application that integrates with Shopify stores to provide intelligent customer support through automated chat responses. The application consists of a React frontend built with Vite, an Express.js backend with WebSocket support, and uses Drizzle ORM with PostgreSQL for data persistence. The bot leverages Z.AI's language models to generate contextual responses based on store data including products, collections, pages, and blog posts.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with file-based structure
- **UI Components**: Radix UI primitives with shadcn/ui design system and Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Real-time Communication**: Custom WebSocket hook for live chat functionality

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Real-time Features**: WebSocket server using 'ws' library for live chat communication
- **API Design**: RESTful endpoints for CRUD operations with WebSocket channels for real-time updates
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Development Tools**: Hot reload with Vite integration and runtime error overlays

## Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Design**: Comprehensive schema covering users, stores, products, collections, pages, blog posts, conversations, messages, and AI interactions
- **Connection Management**: Connection pooling with @neondatabase/serverless

## Authentication & Authorization
- **Shopify OAuth**: Full OAuth 2.0 implementation for Shopify app installation
- **Session Management**: Store-based authentication with access token management
- **Security**: HMAC verification for Shopify webhooks and secure token storage

## AI Integration
- **Provider**: Z.AI integration for natural language processing
- **Models**: Support for multiple GLM models (glm-4.5-flash, glm-4.5, glm-4.5v)
- **Context Management**: Store data injection into AI prompts for contextual responses
- **Usage Tracking**: Token usage and response time monitoring

## Chat System
- **WebSocket Management**: Real-time bidirectional communication between customers and AI
- **Conversation Tracking**: Persistent conversation history with message threading
- **Typing Indicators**: Real-time typing status updates
- **Multi-session Support**: Concurrent conversation handling across multiple store sessions

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle Kit**: Database migrations and schema management

## Shopify Integration
- **Shopify Admin API**: REST and GraphQL API access for store data synchronization
- **OAuth Flow**: Shopify Partner app authentication and authorization
- **Webhook System**: Real-time updates for store data changes

## AI Services
- **Z.AI Platform**: Language model API for generating chat responses
- **Model Configuration**: Configurable AI models with context length management
- **Token Management**: Usage tracking and rate limiting

## UI & Styling
- **Radix UI**: Accessible component primitives for form controls, dialogs, and navigation
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide Icons**: Consistent icon system throughout the application

## Development Tools
- **Replit Integration**: Development environment plugins for runtime error handling
- **TypeScript**: End-to-end type safety across frontend, backend, and shared schemas
- **ESBuild & Vite**: Fast build tools for development and production bundling