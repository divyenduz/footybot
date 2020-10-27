import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import {
  getUpcomingEventsWithoutRSVP,
  performRSVP,
  getUser,
  refreshAccessToken,
} from './meetup'
import { sendMail } from './mail'

export const prisma = new PrismaClient()

export async function main() {
  await prisma.$connect()

  //TODO: Add user/group and what not batching later. Re-architect this system for scalability
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      meetup_id: true,
      access_token: true,
      refresh_token: true,
      Group: {
        select: {
          id: true,
        },
      },
    },
  })

  if (users.length === 0) {
    console.log(
      `No Users in the system. Please run src/server.ts and perform oAuth with meetup.com by running "yarn offline"`,
    )
  }

  // TODO: Collect responses to share back with user about which event was a success and which was a failure
  // TODO: Send 1 email in place of N mails for each success failure

  for (let user of users) {
    // Test and if needed, refresh access_token, if refresh fails, notify user to re-login
    const meetupUser = await getUser({ access_token: user.access_token })
    console.log({ meetupUser })
    if (!meetupUser) {
      const { access_token, refresh_token } = await refreshAccessToken({
        refresh_token: user.refresh_token,
      })

      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          access_token,
          refresh_token,
        },
      })

      // TODO: Better telemetry
      console.log(`Token for user ${updatedUser.id} refreshed`)
    }

    const sleep = (seconds: number) => {
      return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000)
      })
    }

    const groups = user.Group
    for await (let group of groups) {
      let events = []
      for (let i = 0; i <= 2; i++) {
        events = await getUpcomingEventsWithoutRSVP({
          access_token: user.access_token,
          groupId: group.id,
        })
        if (events.length === 0) {
          console.log(
            `Group: ${group.id} has no new events. Sleeping for 20 seconds and trying again.`,
          )
          await sleep(20)
        }
      }

      if (events.length === 0) {
        console.log(`Group: ${group.id} has no new events.`)
      } else {
        console.log(`Group: ${group.id} has ${events.length} sliced events`)
      }
      for await (let event of events) {
        const blockedEvents = (
          await prisma.eventMeta.findMany({
            where: {
              id: event.id,
              status: 'BLOCKED',
            },
            select: {
              id: true,
            },
          })
        ).map((event) => event.id)

        if (blockedEvents.includes(event.id)) {
          console.log(`The eventId ${event.id} is blocked`)
          return
        }

        let performRSVPResponse = {
          RSVPId: null,
          eventURL: null,
          response: null,
          error: null,
          code: null,
        }

        for (let i = 0; i <= 2; i++) {
          let { RSVPId, eventURL, response, error, code } = await performRSVP({
            access_token: user.access_token,
            eventId: event.id,
          })
          if (RSVPId === null || code === 'too_few_spots') {
            console.log(
              `eventId: ${event.id} RSVP failed with code ${code}. Probably the meetup hasn't opened yet. Sleeping for 20 seconds and trying again.`,
            )
            await sleep(20)
          } else {
            performRSVPResponse = { RSVPId, eventURL, response, error, code }
          }
        }

        const { RSVPId, eventURL, response, error, code } = performRSVPResponse
        console.log({ RSVPId, eventURL, response, error, code })

        if (code === 'too_few_spots') {
          console.log(
            `eventId: ${event.id} RSVP failed with code ${code}. Probably the meetup hasn't opened yet.`,
          )
          return
        }

        if (RSVPId === null && Boolean(error)) {
          console.log(`eventId: ${event.id} RSVP failed with error ${error}`)
          await prisma.eventMeta.create({
            data: {
              id: event.id,
              reason: `${response}: ${error}`,
              status: 'BLOCKED',
            },
          })
          return
        } else {
          console.log(`eventId: ${event.id} RSVP failed with error ${error}`)
          await prisma.eventMeta.create({
            data: {
              id: event.id,
              reason: `${response}: ${error}`,
              status: 'LOGGED',
            },
          })
        }

        console.log('Event:', { user })
        if (response === 'yes') {
          sendMail({
            subject: 'Meetup event scheduled ✅',
            body: `Meetup event ${eventURL} is scheduled successfully`,
            to: user.email,
          })
        } else {
          sendMail({
            subject: 'Meetup event scheduling failed ❌',
            body: `Meetup event ${eventURL} is failed to schedule with the following status: ${response}`,
            to: user.email,
          })
        }
      }
    }
  }
}

if (require.main === module) {
  main().finally(() => {
    prisma.$disconnect()
  })
}
