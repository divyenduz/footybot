# FootyBot

<img src="https://user-images.githubusercontent.com/746482/58349336-466e3300-7e63-11e9-900f-3738badad2f1.png" width="500" />

### Introduction

Bot to help me RSVP on a specific Football meetup group.

### Why

A man just wants to play football.

Detailed why here: https://divu.in/automation-64b49e8bfcb8

### Development/Deployment

1. Copy `.env.sample` and fill accordingly into `.env` (for local development) and `.env.production` (for production deploy)
2. If you want to aggressively follow 12-factor app philosophy and have a single environment file. Please modify `package.json`/your deployment strategy accordingly.

3. Run `yarn && yarn build`, you can also use `yarn watch`.

4. [`serverless-plugin-typescript`](https://github.com/prisma/serverless-plugin-typescript) can be used to make TS+Serverless workflow better. I am accepting PRs for it.

5. `yarn offline` (For local development)

6. `yarn deploy-production` (For deploying to production i.e. serverless). This command also does data migration via Prisma.

### Workflow

You might have to create one or multiple meetup `OAuth` consumers based on the number of environments you want.

`yarn deploy` performs local DB migration using Prisma (declarative datamodel lives in `prisma/datamodel.prisma`)

`yarn offline` starts the project at `http://localhost:3000` (accepting PRs for port change, if required) and provides the
following endpoints:

1. `/` - `OAuth` for meetup.com
2. `/callback` - `OAuth` callback for meetup.com that you need to specify in your meetup.com `OAuth` consumer and your respective environment files as well (new `/callback` call would upsert a user using meetup id as the unique identifier)
3. `/run` - calls the function that is supposed to be called periodically that checks upcoming meetups and tries to sign all known users up (`yarn x` calls the same function)

Use `/` and then `/run`. Deployment sets up `/run` to be called every 5 minutes (change in `serverless.yml`, if needed).

### Scope

I made this for this one purpose, but with little modifications, this can be turned into a social media automator. I will most likely stop the development of this project now for any foreseeable time.

### Docker

```
aws ecr get-login-password --region ap-southeast-1 --profile zoid  | docker login --username AWS --password-stdin 297907245068.dkr.ecr.ap-southeast-1.amazonaws.com
```

```
docker build . -t footybot
```

```
docker tag footybot:latest 297907245068.dkr.ecr.ap-southeast-1.amazonaws.com/footybot:latest
```

```
docker push 297907245068.dkr.ecr.ap-southeast-1.amazonaws.com/footybot:latest
```

```
docker run -p 3000:3000 --env-file ./.env.local.docker footybot:latest
```
