import * as dotenv from 'dotenv'
dotenv.config()

import { getOAuthURL, getAccessToken, getUser } from './meetup'
import { sendMail } from './mail'
import { Photon } from '@prisma/photon'

import { DEFAULT_GROUPS } from './constants'

const photon = new Photon()

module.exports.index = (event, ctx, callback) => {
  if (event.httpMethod === 'GET') {
    callback(null, {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `<a href='${getOAuthURL()}'>Login with Meetup</a>`,
    })
    return
  }
  throw new Error('Method not allowed')
}

module.exports.callback = async (event, ctx, callback) => {
  if (event.httpMethod === 'GET') {
    const { code, state } = event.queryStringParameters
    if (state) {
      sendMail({ subject: 'Meetup OAuth failed 🔥', body: `Status: ${state}` })
      return {
        statusCode: 200,
        body: JSON.stringify({
          state,
        }),
      }
    }

    try {
      const { access_token, refresh_token } = await getAccessToken({ code })

      // TODO: Handle the case when we fail to get remote user for whatever reason
      // curl "https://api.meetup.com/2/member/self/?access_token={access_token}"
      const remoteUser = await getUser({ access_token })
      console.log({ remoteUser })

      const groups = await photon.groups.findMany()
      console.log({ groups })

      // Create necessary groups
      // TODO: Fix this ugly hack, default Groups must exist via seeding and other groups should exist via some other workflow
      await Promise.all(
        DEFAULT_GROUPS.map(async group => {
          const existingGroup = groups.some(
            g => g.id === group.groupId.toString(),
          )
          if (!existingGroup) {
            const newGroup = await photon.groups.create({
              data: {
                id: group.groupId,
              },
            })
            console.log(`Created a new group: ${JSON.stringify(newGroup)}`)
          }
        }),
      )

      // TODO: If a user have a valid access token already! Don't do this!
      const user = await photon.users.upsert({
        where: {
          meetup_id: remoteUser.id.toString(),
        },
        create: {
          access_token,
          refresh_token,
          meetup_id: remoteUser.id.toString(),
          groups: {
            connect: DEFAULT_GROUPS.map(group => {
              return {
                id: group.groupId.toString(),
              }
            }),
          },
        },
        update: {
          access_token,
          refresh_token,
        },
      })
      console.log({ user })

      return {
        statusCode: 200,
        body: JSON.stringify(user),
      }
    } catch (e) {
      console.log(e)
      throw e
    }
    return
  }
  throw new Error('Method not allowed')
}
