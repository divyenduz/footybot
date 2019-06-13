import * as dotenv from "dotenv";
dotenv.config();

import { getOAuthURL, getAccessToken, getUser } from "./meetup";
import { sendMail } from "./mail";
import { Photon } from "@generated/photon";
import { DEFAULT_GROUPS } from "./constants";

const photon = new Photon();

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

    console.log({ code, state });

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

    console.log({ access_token, refresh_token });

    // TODO: Handle the case when we fail to get remote user for whatever reason
    // curl "https://api.meetup.com/2/member/self/?access_token={access_token}"
    const remoteUser = await getUser({ access_token });

    console.log({ remoteUser });

    const groups = await photon.entities();

    console.log({ groups });

    try {
      // Create necessary groups
      // TODO: Fix this ugly hack, default Groups must exist via seeding and other groups should exist via some other workflow
      await Promise.all(
        DEFAULT_GROUPS.map(async group => {
          const existingGroup = groups.some(
            g => parseInt(g.meetup_id) === parseInt(group.groupId.toString())
          );
          if (!existingGroup) {
            const newGroup = await photon.entities.create({
              data: {
                meetup_id: group.groupId.toString()
              }
            });

            console.log(`Created a new group: ${newGroup.id}`);
          }
        })
      );
    } catch (e) {
      console.log("Failed to create missing groups");
      console.error(e);
    }

    const oneGroup = DEFAULT_GROUPS.find(group => Boolean(group.groupId));
    console.log({ oneGroup });

    const thisGroup = await photon.entities({
      where: {
        id: oneGroup.groupId
      }
    });
    console.log({ thisGroup });

    let user = null;
    try {
      user = await photon.users.upsert({
        where: {
          meetup_id: remoteUser.id.toString()
        },
        create: {
          access_token,
          refresh_token,
          meetup_id: remoteUser.id.toString(),
          groups: {
            connect: {
              meetup_id: oneGroup.groupId.toString()
            }
          }
        },
        update: {
          access_token,
          refresh_token
        }
      });

      console.log({ user });
    } catch (e) {
      console.log("Failed to create user");
      console.error(e);
    }

    await photon.disconnect();

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(user)
    });
    return;
  }
  throw new Error("Method not allowed");
};
