# FootyBot

<img src="https://user-images.githubusercontent.com/746482/58349336-466e3300-7e63-11e9-900f-3738badad2f1.png" width="200" />

### Introduction

Bot to help me RSVP on a specific Football meetup group.

### Why

A man just wants to play football.

Detailed why here: https://divu.in/automation-64b49e8bfcb8

### Development/Deployment

1. Copy `.env.sample` and fill accordingly into `.env` (for local development)
2. `yarn dev` to start the server and do meetup oAuth.
3. `yarn x` to run the script and attempt to schedule a meetup.

### Workflow

- You might have to create one or multiple meetup `OAuth` consumers based on the number of environments you want.
- `yarn prisma db push` performs local DB migration using Prisma (declarative datamodel lives in `prisma/schema.prisma`)
- `yarn dev` starts the project at `http://localhost:3000` and provides the
  following endpoints:
  1. `/` - `OAuth` for meetup.com
  2. `/callback` - `OAuth` callback for meetup.com that you need to specify in your meetup.com `OAuth` consumer and your respective environment files as well (new `/callback` call would upsert a user using meetup id as the unique identifier)
  3. `/run` - calls the function that is supposed to be called periodically that checks upcoming meetups and tries to sign all known users up (`yarn x` calls the same function and in production is supposed to be called periodically)
