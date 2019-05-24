import * as dotenv from "dotenv";
dotenv.config();

import { getOAuthURL, getAccessToken, getUser } from "./meetup";
import { sendMail } from "./mail";
import { prisma } from "./generated/prisma-client";
import { DEFAULT_GROUPS } from "./constants";

module.exports.index = (event, ctx, callback) => {
  if (event.httpMethod === "GET") {
    callback(null, {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html"
      },
      body: `<a href='${getOAuthURL()}'>Login with Meetup</a>`
    });
    return;
  }
  throw new Error("Method not allowed");
};

module.exports.callback = async (event, ctx, callback) => {
  if (event.httpMethod === "GET") {
    const { code, state } = event.queryStringParameters;
    if (state) {
      sendMail({ subject: "Meetup OAuth failed 🔥", body: `Status: ${state}` });
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          state
        })
      });
    }

    const { access_token, refresh_token } = await getAccessToken({ code });

    // TODO: Handle the case when we fail to get remote user for whatever reason
    // curl "https://api.meetup.com/2/member/self/?access_token={access_token}"
    const remoteUser = await getUser({ access_token });

    const groups = await prisma.groups();

    // Create necessary groups
    // TODO: Fix this ugly hack, default Groups must exist via seeding and other groups should exist via some other workflow
    await Promise.all(
      DEFAULT_GROUPS.map(async group => {
        const existingGroup = groups.some(
          g => g.id === group.groupId.toString()
        );
        if (!existingGroup) {
          const newGroup = await prisma.createGroup({
            id: group.groupId
          });
          console.log(`Created a new group: ${group.groupId}`);
        }
      })
    );

    // TODO: If a user have a valid access token already! Don't do this!
    const user = await prisma.upsertUser({
      where: {
        meetup_id: remoteUser.id.toString()
      },
      create: {
        access_token,
        refresh_token,
        meetup_id: remoteUser.id.toString(),
        groups: {
          connect: DEFAULT_GROUPS.map(group => {
            return {
              id: group.groupId.toString()
            };
          })
        }
      },
      update: {
        access_token,
        refresh_token
      }
    });

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(user)
    });
    return;
  }
  throw new Error("Method not allowed");
};
