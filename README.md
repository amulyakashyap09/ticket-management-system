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

## Note:
In the implementation, I have incorporated the following best practices:
- Use of raw queries (although not generally recommended, it was explicitly mentioned in the assignment, so I've included them)
- ORM usage, following best practices
- Clear, self-explanatory comments
- Test cases
- Linting for code quality
- Docker and Docker Compose for containerization
- Database migrations

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

## Tests Screenshots

<img width="1728" alt="Screenshot 2024-10-08 at 5 31 22 PM" src="https://github.com/user-attachments/assets/44c0af52-5a9c-4455-b5bb-440aecbb9e99">
<img width="1728" alt="Screenshot 2024-10-08 at 5 44 44 PM" src="https://github.com/user-attachments/assets/7043f56d-037c-437f-a6c0-77f99c2e2373">
<img width="1728" alt="Screenshot 2024-10-08 at 5 44 48 PM" src="https://github.com/user-attachments/assets/0ea0c045-7178-4d07-b963-b5769ecc1c0e">
<img width="1728" alt="Screenshot 2024-10-08 at 5 44 50 PM" src="https://github.com/user-attachments/assets/caccc44c-a7fb-4660-9932-9e34bf4dc4ca">
<img width="1728" alt="Screenshot 2024-10-08 at 5 44 53 PM" src="https://github.com/user-attachments/assets/8c1fd541-cda5-4539-bfeb-7aed6f3cb73a">
<img width="1728" alt="Screenshot 2024-10-08 at 5 45 46 PM" src="https://github.com/user-attachments/assets/9c06deb4-d871-46f0-8944-f2419f8fdb14">
<img width="1728" alt="Screenshot 2024-10-08 at 5 45 52 PM" src="https://github.com/user-attachments/assets/66cd54e4-90b1-4466-86ac-a99d7c9116ff">
<img width="1728" alt="Screenshot 2024-10-08 at 5 56 27 PM" src="https://github.com/user-attachments/assets/8b1b01f8-6ec0-463a-85ce-4116dd4f0a46">
<img width="1728" alt="Screenshot 2024-10-08 at 5 58 12 PM" src="https://github.com/user-attachments/assets/d06d220c-a97a-426b-a074-8dcd53b2e047">




