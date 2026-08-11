<div align="center">

# 🎬 Parlocula

**A community-based social platform for movie & show enthusiasts**

Built from the belief that cinema deserved a dedicated space to discuss, organize, and experience films beyond short-form social content.

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](#)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](#)

[Live Demo](https://parlocula.vercel.app) · [Report Bug](https://parlocula.vercel.app/settings/report) · [Request Feature](https://parlocula.vercel.app/settings/feedback)

</div>

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Module Architecture](#module-architecture)
- [Real-Time Messaging](#real-time-messaging)
- [Authentication](#authentication)
- [Performance & Accessibility](#performance--accessibility)
- [Tech Stack](#tech-stack)
- [Architecture Evolution](#architecture-evolution)
- [Getting Started](#getting-started)
- [License](#license)

---

## Overview

Parlocula is a 10-module distributed system spanning **~90 REST API endpoints**, **16 MongoDB collections**, and **~400 React components**, publicly deployed on Vercel. It lets people discuss, organize, and experience films together — threads, posts, curated "shelves," real-time discussion rooms, and a shared wiki for movies and shows.

This README documents the system's architecture, key engineering decisions, and the tradeoffs behind them.

## Key Features

- **Real-Time Messaging (1:1 & group)** — optimistic UI updates, live presence, offline persistence, and background sync, with Redis-based message buffering to reduce database load during high-frequency activity.
- **Offline-First Architecture** — feeds, messaging, profiles, trending content, and collaborative interactions all work offline. Pending actions (posts, reactions, messages) persist locally via Zustand and survive an app close or dropped connection.
- **Performance Engineering** — ~90% Google PageSpeed score and GTmetrix Grade A across nearly all public pages, via SSR, JSON-LD structured data, dynamic sitemaps, canonical URLs, and optimized Open Graph metadata.
- **Caching & Data Layer** — Next.js framework-level caching for read-heavy routes, paired with Redis for high-frequency operations (sessions, feed generation, rate limiting, message buffering).
- **Abuse Prevention** — sliding-window rate limiting on authentication and content-creation endpoints.
- **Passwordless Authentication** — hybrid JWT + HTTP-only cookie session model, with full user-controlled session termination.
- **Accessibility** — semantic HTML and ARIA attributes throughout, 95–100% Accessibility score on Google PageSpeed Insights.
- **Progressive Web App** — installable, responsive, native-like mobile UX with offline access to core surfaces.

## System Architecture

High-level view of how the client, Next.js application layer, data layer, and real-time layer fit together.

```mermaid
flowchart TB
    subgraph Client["🖥️ Client Layer"]
        Browser["Browser / PWA"]
        Zustand["Zustand<br/>(Offline Queue + Client State)"]
        TSQ["TanStack Query<br/>(Client-Side Cache)"]
    end

    subgraph Vercel["▲ Vercel — Next.js App"]
        Middleware["Auth Middleware<br/>(JWT + HTTP-only Cookies)"]
        SSR["SSR Pages<br/>(JSON-LD, Sitemaps, OG Tags)"]
        API["~90 REST API Endpoints<br/>(10 Modules)"]
        RateLimit["Sliding-Window<br/>Rate Limiter"]
    end

    subgraph Data["💾 Data Layer"]
        MongoDB[("MongoDB<br/>16 Collections")]
        Redis[("Redis<br/>Sessions · Cache · Rate Limits<br/>Message Buffering")]
    end

    subgraph RealTime["⚡ Real-Time Layer"]
        Ably["Ably<br/>(Pub/Sub + Presence)"]
        WebPush["Web Push<br/>(Notifications)"]
    end

    Browser <--> TSQ
    Browser <--> Zustand
    Browser -- HTTPS --> Middleware
    Middleware --> API
    Middleware --> SSR
    API --> RateLimit
    RateLimit --> MongoDB
    RateLimit --> Redis
    SSR --> MongoDB
    API <--> Redis
    API <-- WebSocket --> Ably
    Ably -- Push Events --> Browser
    API --> WebPush
    WebPush --> Browser

    classDef client fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e
    classDef server fill:#fef3c7,stroke:#b45309,color:#78350f
    classDef data fill:#dcfce7,stroke:#15803d,color:#14532d
    classDef realtime fill:#fae8ff,stroke:#a21caf,color:#581c87

    class Browser,Zustand,TSQ client
    class Middleware,SSR,API,RateLimit server
    class MongoDB,Redis data
    class Ably,WebPush realtime
```

## Module Architecture

The system is organized into four layers by dependency direction — foundation, content, organization/real-time, and cross-cutting services — rather than 10 flat, unrelated features.

```mermaid
flowchart TB
    subgraph Foundation["🔐 Foundation Layer"]
        Auth["Auth Module"]
        User["User Module"]
    end

    subgraph Content["📄 Content Layer"]
        Threads["Threads Module"]
        Posts["Posts Module"]
        Comments["Comments Module"]
        Wiki["Wiki Module"]
    end

    subgraph Org["🗂️ Organization & Real-Time"]
        Shelves["Shelves Module"]
        Rooms["Rooms Module"]
    end

    subgraph CrossCutting["🔎 Cross-Cutting Services"]
        Notifications["Notifications Module"]
        Search["Search Module"]
    end

    Auth --> User

    User --> Threads
    User --> Posts
    User --> Shelves
    User --> Rooms

    Threads --> Comments
    Posts --> Comments
    Wiki -.-> Threads
    Wiki -.-> Posts

    Shelves --> Posts
    Shelves --> Threads

    Posts --> Notifications
    Comments --> Notifications
    Rooms --> Notifications

    Threads --> Search
    Posts --> Search
    Comments --> Search
    Wiki --> Search
    User --> Search

    classDef foundation fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d
    classDef content fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e
    classDef org fill:#fae8ff,stroke:#a21caf,color:#581c87
    classDef cross fill:#fef3c7,stroke:#b45309,color:#78350f

    class Auth,User foundation
    class Threads,Posts,Comments,Wiki content
    class Shelves,Rooms org
    class Notifications,Search cross
```

Dashed arrows indicate a loose reference (e.g., Wiki entries linked from Threads/Posts) rather than a hard functional dependency.

## Real-Time Messaging

Optimistic UI, offline persistence, and Redis-based message buffering keep conversations responsive and consistent under unreliable network conditions.

```mermaid
sequenceDiagram
    actor A as Client A (Sender)
    participant Store as Zustand<br/>(Offline Queue)
    participant API as Next.js API
    participant Redis as Redis<br/>(Message Buffer)
    participant Ably as Ably<br/>(Pub/Sub + Presence)
    participant Mongo as MongoDB
    actor B as Client B (Recipient)

    A->>A: Render message optimistically
    A->>Store: Queue as pending
    A->>API: POST /messages

    alt Client is online
        API->>Redis: Buffer message
        API->>Ably: Publish message event
        Ably->>B: Push via WebSocket
        B->>B: Render + update presence
        API-->>A: 200 OK
        A->>Store: Mark confirmed, dequeue
    else Client is offline
        Note over A,Store: Message persisted locally,<br/>UI still shows "sending"
        A->>Store: Persist to offline queue
        Note over A: Wait for reconnect
        A->>API: Replay queued messages on reconnect
        API->>Redis: Buffer message
        API->>Ably: Publish message event
        Ably->>B: Push via WebSocket
        API-->>A: 200 OK
        A->>Store: Mark confirmed, dequeue
    end

    loop Every N seconds / buffer threshold reached
        Redis->>Mongo: Flush batched messages
        Note over Redis,Mongo: Reduces per-message DB writes<br/>during high-frequency messaging
    end
```

Real-time delivery via Ably is not gated by database writes — Redis buffers and periodically flushes to MongoDB in batches, so a burst of messages doesn't turn into a burst of database operations.

## Authentication

A passwordless flow: email → OTP → session. Session cookies are only issued after both OTP validity and (for new users) profile-data validity are confirmed.

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Client (Browser)
    participant API as Next.js API
    participant Redis as Redis
    participant Email as Email Service
    participant Mongo as MongoDB

    U->>FE: Visit /join
    U->>FE: Enter email
    FE->>API: POST /auth/otp
    Note over API,Redis: Sliding-window rate limit<br/>on OTP requests
    API->>Redis: Generate OTP, store with TTL
    API->>Email: Send OTP email
    Email-->>U: OTP delivered

    U->>FE: Enter OTP
    FE->>API: POST /auth/verify
    API->>Redis: Validate OTP

    alt OTP valid
        API->>Mongo: Check if user exists (by email)
        alt User exists
            API->>Mongo: Fetch user metadata
            API->>API: Create session + generate JWT
            API-->>FE: Set-Cookie (HTTP-only, Secure)
            FE-->>U: Redirect to /feed
        else New user
            API-->>FE: Response: "new user, complete profile"
            FE-->>U: Show profile form
            U->>FE: Choose username, fill profile
            FE->>API: POST /auth/register
            API->>API: Validate profile data
            API->>Mongo: Create user record
            API->>API: Create session + generate JWT
            API-->>FE: Set-Cookie (HTTP-only, Secure)
            FE-->>U: Redirect to /feed
        end
    else OTP invalid or expired
        API-->>FE: 401 Invalid OTP
        FE-->>U: Show error, allow retry
    end
```

Tokens are never exposed to client-side JavaScript — sessions live in HTTP-only, Secure cookies, and users have full control to terminate active sessions at any time.

## Performance & Accessibility

| Metric | Score |
|---|---|
| Google PageSpeed | ~90% across nearly all public pages |
| GTmetrix | Grade A |
| Accessibility (PageSpeed Insights) | 95–100% |

Achieved via server-side rendering, JSON-LD structured data, dynamic sitemaps, canonical URLs, optimized Open Graph metadata, semantic HTML, and ARIA attributes throughout the UI.

Client-side responsiveness is further improved through debouncing/throttling on high-frequency interactions, optimistic rendering, infinite scrolling, background synchronization, and selective background refetching.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js, TypeScript |
| Styling | Tailwind CSS |
| Database | MongoDB (16 collections) |
| Cache / Buffering | Redis & Next Js built-in caching |
| Server State | TanStack Query |
| Client State | Zustand |
| Real-Time | Ably |
| Validation | Zod |
| Notifications | Web Push |
| Deployment | Vercel |

## Architecture Evolution

One of the largest architectural shifts during development came from understanding how Next.js manages rendering and caching across the client/server boundary. Early data-fetching strategies conflicted with framework caching behavior, which led to several redesigns before settling on a predictable model built on server-side rendering, cache revalidation, cache tags, and client-side synchronization.

## Getting Started

> **Note:** fill in the specifics for your actual repo before publishing.

```bash
# Clone the repository
git clone https://github.com/SadiqNaqvi/parlocula.git
cd parlocula

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: MONGODB_URI, REDIS_URL, ABLY_API_KEY, JWT_SECRET, EMAIL_* , VAPID_* (Web Push)

# Run the development server
npm run dev
```

Visit `http://localhost:3000` to view the app locally.

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built by Sadiq Naqvi · [LinkedIn](https://linkedin.com/in/sadiqnaqvi) · [Portfolio](https://naqvisadiq.netlify.app)

</div>