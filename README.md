# Ticket Management System

This project is a **Ticket Management System** developed in **TypeScript**, utilizing **Node.js** and a **TypeORM** setup for database management with raw SQL queries. The system includes a Dockerized environment for seamless setup and execution.

## Features

- **Authentication**: Login endpoint with JWT-based authentication.
- **Ticket Management**: API routes to manage tickets, including ticket assignment, creation, and fetching ticket analytics.
- **User Management**: Manage users with dedicated endpoints.
- **Database Migrations**: Handled through TypeORM and raw SQL queries.
- **Middleware**:
  - **Authentication Middleware**: Verifies JWT tokens.
  - **Error Handling Middleware**: Handles and formats errors gracefully.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Docker Setup](#docker-setup)
  - [Without Docker](#without-docker)
- [Scripts](#scripts)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Dashboard](#dashboard)
  - [Tickets](#tickets)
  - [Users](#users)
- [Running Tests](#running-tests)

## Prerequisites

Make sure you have the following installed:
- **Docker** and **Docker Compose**
- **Node.js** (v14 or above)
- **npm** or **yarn**

## Setup Instructions

### Docker Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/amulyakashyap09/ticket-management-system.git
   cd ticket-management-system
2. Build and start the Docker containers:
    ```bash
    docker-compose up --build
3. Access the application at http://localhost:4000.

### Without Docker

1. Clone the repository:
    ```bash
    git clone https://github.com/amulyakashyap09/ticket-management-system.git
    cd ticket-management-system

2. Install dependencies:
    ```bash
    npm install

3. Start the server:
    ```bash
    npm run start

4. Access the application at http://localhost:4000.

### Scripts

1. Start the application:
    ```bash
    npm run start

2. Run lint checks:
    ```bash
    npm run lint

3. Fix linting issues:
    ```bash
    npm run lint-fix

4. Run TypeScript compiler checks:
    ```bash
    npm run tsc

5. Run tests:
    ```bash
    npm run test

6. Run database migrations:
    ```bash
    npm run migration:run

7. Revert last migration:
    ```bash
    npm run migration:revert

## API Endpoints

### Authentication

- Login: Authenticate and get a token.
  - POST /auth/login
      ```bash
      {
        "username": "user",
        "password": "password"
      }

### Users

- Get User Details: Fetch details of a specific user by ID.
  - GET /users/:id
  - Requires JWT authentication.

- Add User: Add a new user to the system.
  - POST /users/
  - Requires validation and checks for existing users.

### Tickets

 - Get Ticket Analytics: Fetch analytics related to tickets.
    - GET /tickets/analytics
    - Requires JWT authentication.

- Get Ticket by ID: Fetch details of a specific ticket by its ID.
    - GET /tickets/:ticketId
    - Requires JWT authentication.

 - Assign User to Ticket: Assign a user to a specific ticket.
    - PUT /tickets/:ticketId/assign
    - Requires JWT authentication.

- Create Ticket: Create a new ticket.
  - POST /tickets/
  - Requires JWT authentication and valid ticket data.

### Dashboard
- Get Ticket Analytics: Fetch analytics of tickets.
    - GET /api/dashboard/analytics
    - Requires JWT authentication.











